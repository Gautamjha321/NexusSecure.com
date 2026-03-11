import logging
import re
import subprocess
from typing import Any
from urllib.parse import urlparse

from .finding_utils import make_finding

logger = logging.getLogger(__name__)

SERVICE_RISK = {
    "ftp": ("high", "FTP Service Detected", 7.8),
    "telnet": ("critical", "Telnet Service Detected", 9.8),
    "microsoft-ds": ("high", "SMB Service Detected", 8.8),
    "mysql": ("high", "MySQL Service Detected", 8.2),
    "postgresql": ("high", "PostgreSQL Service Detected", 8.2),
    "redis": ("critical", "Redis Service Detected", 9.1),
    "mongodb": ("critical", "MongoDB Service Detected", 9.1),
    "rdp": ("high", "RDP Service Detected", 8.5),
}

SERVICE_LINE = re.compile(r"^(\d+)\/tcp\s+open\s+([a-z0-9\-_]+)\s*(.*)$", re.IGNORECASE)
CVE_PATTERN = re.compile(r"(CVE-\d{4}-\d{4,7})", re.IGNORECASE)


def run_nmap(url: str, timeout: int = 90) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    hostname = urlparse(url).hostname
    if not hostname:
        return findings

    try:
        cmd = ["nmap", "-sV", "--script", "vuln", "--open", hostname]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
    except FileNotFoundError:
        logger.info("nmap is not installed; skipping nmap checks.")
        return findings
    except subprocess.TimeoutExpired:
        logger.warning("nmap scan timed out for %s", hostname)
        return findings
    except Exception as exc:
        logger.error("Unexpected nmap error for %s: %s", hostname, exc)
        return findings

    output = f"{result.stdout}\n{result.stderr}"
    if not output.strip():
        return findings

    for raw_line in output.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        service_match = SERVICE_LINE.match(line)
        if service_match:
            port, service, version = service_match.groups()
            service_key = service.lower()
            if service_key in SERVICE_RISK:
                severity, title, cvss = SERVICE_RISK[service_key]
                findings.append(
                    make_finding(
                        title=title,
                        severity=severity,
                        description="Nmap identified an exposed network service with elevated attack risk.",
                        evidence=f"Port {port}/tcp open ({service} {version.strip()})".strip(),
                        remediation="Restrict service exposure to trusted networks and review access controls.",
                        category="OWASP A05 - Security Misconfiguration",
                        cvss_score=cvss,
                    )
                )
            continue

        if "VULNERABLE:" in line.upper():
            findings.append(
                make_finding(
                    title="Nmap Vulnerability Script Alert",
                    severity="high",
                    description="Nmap script output flagged a potential exploitable service condition.",
                    evidence=line,
                    remediation="Review the full nmap script output and patch the affected component.",
                    category="OWASP A06 - Vulnerable and Outdated Components",
                    cvss_score=7.5,
                )
            )

        cve_matches = CVE_PATTERN.findall(line)
        for cve in cve_matches:
            findings.append(
                make_finding(
                    title=f"Known CVE Reference Detected ({cve.upper()})",
                    severity="high",
                    description="Nmap output referenced a known vulnerability identifier.",
                    evidence=line,
                    remediation="Patch to a version that remediates the referenced CVE.",
                    category="OWASP A06 - Vulnerable and Outdated Components",
                    cvss_score=8.0,
                    reference=f"https://nvd.nist.gov/vuln/detail/{cve.upper()}",
                )
            )

    return findings
