import logging
import subprocess
from typing import Any

from .finding_utils import make_finding

logger = logging.getLogger(__name__)

NIKTO_RULES: list[tuple[str, str, str, str, float, str]] = [
    (
        "outdated",
        "Outdated Web Server Version",
        "high",
        "Nikto suggests an outdated web server component.",
        7.5,
        "OWASP A06 - Vulnerable and Outdated Components",
    ),
    (
        "default credentials",
        "Default Credentials Indicator",
        "critical",
        "Nikto output references default credentials or weak default access.",
        9.1,
        "OWASP A07 - Identification and Authentication Failures",
    ),
    (
        "directory indexing",
        "Directory Indexing Enabled",
        "medium",
        "Directory listing is enabled and may leak sensitive content structure.",
        5.3,
        "OWASP A05 - Security Misconfiguration",
    ),
    (
        "backup file",
        "Backup Files Exposed",
        "high",
        "Backup artifact disclosure can reveal source code or credentials.",
        7.4,
        "OWASP A05 - Security Misconfiguration",
    ),
    (
        "x-powered-by",
        "Technology Header Disclosure",
        "low",
        "Application fingerprint headers were identified in responses.",
        3.3,
        "Information Disclosure",
    ),
    (
        "cookie",
        "Cookie Security Weakness",
        "medium",
        "Nikto identified insecure cookie behavior.",
        5.8,
        "OWASP A07 - Identification and Authentication Failures",
    ),
]


def run_nikto(url: str, timeout: int = 150) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    try:
        cmd = ["nikto", "-h", url, "-ask", "no"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
    except FileNotFoundError:
        logger.info("nikto is not installed; skipping nikto checks.")
        return findings
    except subprocess.TimeoutExpired:
        logger.warning("nikto scan timed out for %s", url)
        return findings
    except Exception as exc:
        logger.error("Unexpected nikto error for %s: %s", url, exc)
        return findings

    output = f"{result.stdout}\n{result.stderr}"
    if not output.strip():
        return findings

    lower_output = output.lower()
    matched = False
    for keyword, title, severity, description, cvss, category in NIKTO_RULES:
        if keyword in lower_output:
            matched = True
            evidence_line = next(
                (line.strip() for line in output.splitlines() if keyword in line.lower()),
                keyword,
            )
            findings.append(
                make_finding(
                    title=title,
                    severity=severity,
                    description=description,
                    evidence=evidence_line,
                    remediation="Patch affected components and harden server configuration.",
                    category=category,
                    cvss_score=cvss,
                )
            )

    if not matched and "nikto" in lower_output and "error" not in lower_output:
        findings.append(
            make_finding(
                title="Nikto Informational Finding",
                severity="low",
                description="Nikto completed and reported potential hardening opportunities.",
                evidence="Nikto scan completed with informational output.",
                remediation="Review full Nikto report output and close unnecessary exposures.",
                category="Hardening",
                cvss_score=2.4,
            )
        )

    return findings
