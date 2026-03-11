import logging
import socket
from typing import Any

from .finding_utils import make_finding

logger = logging.getLogger(__name__)

PORT_RULES: dict[int, tuple[str, str, str, str, float]] = {
    21: (
        "high",
        "FTP Service Exposed",
        "FTP transmits credentials in clear text and is commonly abused when exposed publicly.",
        "Disable FTP or migrate to SFTP/FTPS with strict network filtering.",
        8.0,
    ),
    22: (
        "medium",
        "SSH Service Publicly Exposed",
        "SSH is reachable from the public internet and may be targeted by brute-force attacks.",
        "Restrict SSH by IP allowlist, key-only authentication, and fail2ban/rate limits.",
        5.9,
    ),
    23: (
        "critical",
        "Telnet Service Exposed",
        "Telnet is unencrypted and should never be exposed on production systems.",
        "Disable Telnet immediately and replace it with hardened SSH access.",
        9.8,
    ),
    445: (
        "high",
        "SMB Service Exposed",
        "SMB exposure can lead to lateral movement and known remote exploitation vectors.",
        "Block SMB from untrusted networks and enforce patched server versions.",
        8.8,
    ),
    3306: (
        "high",
        "MySQL Port Exposed",
        "Database service is directly reachable and increases risk of unauthorized data access.",
        "Restrict database ports to private network segments and application hosts only.",
        8.2,
    ),
    5432: (
        "high",
        "PostgreSQL Port Exposed",
        "Database service is directly reachable and increases risk of unauthorized data access.",
        "Restrict database ports to private network segments and application hosts only.",
        8.2,
    ),
    6379: (
        "critical",
        "Redis Port Exposed",
        "Redis exposure can allow unauthorized data access and remote command abuse.",
        "Bind Redis to localhost/private networks and enable authentication controls.",
        9.1,
    ),
    27017: (
        "critical",
        "MongoDB Port Exposed",
        "MongoDB services exposed to the internet are frequently targeted for ransom and data theft.",
        "Restrict access to trusted networks and enforce authentication/authorization.",
        9.1,
    ),
    3389: (
        "high",
        "RDP Port Exposed",
        "RDP endpoints are high-value brute-force and credential stuffing targets.",
        "Disable public RDP or place behind VPN + MFA and strict source filtering.",
        8.5,
    ),
}


def check_ports(hostname: str, timeout: int = 1) -> list[dict[str, Any]]:
    """Scan key ports and return structured exposure findings."""
    findings: list[dict[str, Any]] = []
    if not hostname:
        return findings

    for port, (severity, title, description, remediation, cvss) in PORT_RULES.items():
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(timeout)
                if sock.connect_ex((hostname, port)) == 0:
                    findings.append(
                        make_finding(
                            title=title,
                            severity=severity,
                            description=description,
                            evidence=f"{hostname}:{port} responded to TCP connection probe.",
                            remediation=remediation,
                            category="OWASP A05 - Security Misconfiguration",
                            cvss_score=cvss,
                        )
                    )
        except socket.gaierror:
            logger.warning("Hostname could not be resolved: %s", hostname)
            break
        except OSError as exc:
            logger.debug("Port %s probe failed for %s: %s", port, hostname, exc)

    return findings
