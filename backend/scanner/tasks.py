import logging
from collections.abc import Callable
from typing import Any
from urllib.parse import urlparse

from celery import shared_task

from .models import Scan, ScanLog, Vulnerability
from .services.content_scan import run_content_checks
from .services.finding_utils import make_finding, normalize_cvss, normalize_severity
from .services.headers_scan import check_headers
from .services.nikto_scan import run_nikto
from .services.nmap_scan import run_nmap
from .services.port_scan import check_ports
from .services.tls_scan import run_tls_checks
from .services.zap_scan import run_zap

logger = logging.getLogger(__name__)


def _normalize_finding(raw_finding: Any) -> dict[str, Any]:
    if isinstance(raw_finding, tuple) and len(raw_finding) >= 2:
        title, severity = raw_finding[0], raw_finding[1]
        return make_finding(
            title=str(title),
            severity=str(severity),
            description="Automated scanner finding.",
        )

    if isinstance(raw_finding, dict):
        return make_finding(
            title=str(raw_finding.get("title", "Unnamed finding")),
            severity=str(raw_finding.get("severity", "low")),
            description=str(raw_finding.get("description", "Automated scanner finding.")),
            evidence=str(raw_finding.get("evidence", "")),
            remediation=str(raw_finding.get("remediation", "")),
            category=str(raw_finding.get("category", "")),
            cvss_score=raw_finding.get("cvss_score"),
            reference=str(raw_finding.get("reference", "")),
        )

    return make_finding(
        title="Unknown scanner output",
        severity="low",
        description="Scanner returned an unsupported finding format.",
        evidence=str(raw_finding),
    )


def _persist_findings(
    *,
    scan: Scan,
    tool_name: str,
    raw_findings: list[dict[str, Any]],
    dedupe_cache: set[tuple[str, str, str]],
) -> int:
    created_count = 0

    for raw_finding in raw_findings:
        finding = _normalize_finding(raw_finding)
        fingerprint = (
            finding["title"].lower(),
            finding["severity"],
            finding["evidence"].lower()[:200],
        )

        if fingerprint in dedupe_cache:
            continue

        dedupe_cache.add(fingerprint)
        Vulnerability.objects.create(
            scan=scan,
            title=finding["title"],
            severity=normalize_severity(finding["severity"]),
            description=finding["description"],
            evidence=finding["evidence"] or None,
            remediation=finding["remediation"],
            category=finding["category"],
            cvss_score=normalize_cvss(finding["cvss_score"]),
            reference=finding["reference"],
            tool_name=tool_name,
        )
        created_count += 1

    return created_count


@shared_task(bind=True)
def run_scan_async(self, scan_id: int) -> dict[str, Any]:
    """Main asynchronous vulnerability scan workflow."""
    try:
        scan = Scan.objects.get(id=scan_id)
    except Scan.DoesNotExist:
        logger.error("Scan %s not found", scan_id)
        return {"status": "failed", "error": "scan-not-found", "scan_id": scan_id}

    scan.status = "running"
    scan.progress = 0
    scan.save(update_fields=["status", "progress", "updated_at"])

    parsed_url = urlparse(scan.target_url)
    hostname = parsed_url.hostname or ""
    if not hostname:
        scan.status = "failed"
        scan.save(update_fields=["status", "updated_at"])
        return {"status": "failed", "error": "invalid-target-url", "scan_id": scan_id}

    pipeline: list[tuple[str, int, str, Callable[[], list[dict[str, Any]]]]] = [
        ("headers_scan", 15, "Running HTTP header hardening checks", lambda: check_headers(scan.target_url)),
        ("tls_scan", 30, "Evaluating TLS certificate and protocol posture", lambda: run_tls_checks(hostname)),
        ("content_scan", 45, "Running passive web content reconnaissance", lambda: run_content_checks(scan.target_url)),
        ("port_scan", 60, "Scanning high-risk network services", lambda: check_ports(hostname)),
        ("nmap", 75, "Running deep Nmap service analysis", lambda: run_nmap(scan.target_url)),
        ("nikto", 90, "Running Nikto web hardening checks", lambda: run_nikto(scan.target_url)),
        ("zap", 100, "Running OWASP ZAP dynamic analysis", lambda: run_zap(scan.target_url)),
    ]

    failed_steps = 0
    dedupe_cache: set[tuple[str, str, str]] = set()

    for tool_name, progress, start_message, runner in pipeline:
        scan_log = ScanLog.objects.create(
            scan=scan,
            tool_name=tool_name,
            status="running",
            message=start_message,
        )

        try:
            findings = runner()
            created = _persist_findings(
                scan=scan,
                tool_name=tool_name,
                raw_findings=findings,
                dedupe_cache=dedupe_cache,
            )
            scan_log.status = "completed"
            scan_log.message = f"{tool_name} finished. Added {created} unique findings."
        except Exception as exc:
            failed_steps += 1
            scan_log.status = "failed"
            scan_log.message = f"{tool_name} failed: {exc}"
            logger.exception("Tool step failed for scan %s (%s)", scan_id, tool_name)
        finally:
            scan_log.save(update_fields=["status", "message"])
            scan.progress = progress
            scan.save(update_fields=["progress", "updated_at"])

    scan.status = "failed" if failed_steps == len(pipeline) else "completed"
    scan.save(update_fields=["status", "updated_at"])

    logger.info(
        "Scan %s completed with status=%s (%s failed step(s), %s findings).",
        scan_id,
        scan.status,
        failed_steps,
        scan.vulnerabilities.count(),
    )
    return {"status": scan.status, "scan_id": scan_id, "failed_steps": failed_steps}
