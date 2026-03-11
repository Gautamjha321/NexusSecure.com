import datetime as dt
import logging
import socket
import ssl
from typing import Any

from .finding_utils import make_finding

logger = logging.getLogger(__name__)


def run_tls_checks(hostname: str, timeout: int = 8) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    if not hostname:
        return findings

    context = ssl.create_default_context()

    try:
        with socket.create_connection((hostname, 443), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as tls_sock:
                cert = tls_sock.getpeercert()
                protocol = tls_sock.version() or ""
    except ssl.SSLError as exc:
        findings.append(
            make_finding(
                title="TLS Handshake Failure",
                severity="high",
                description="The HTTPS endpoint failed TLS negotiation.",
                evidence=str(exc),
                remediation="Review certificate chain, supported ciphers, and TLS server configuration.",
                category="OWASP A02 - Cryptographic Failures",
                cvss_score=7.4,
            )
        )
        return findings
    except OSError as exc:
        logger.info("TLS checks skipped for %s: %s", hostname, exc)
        return findings

    not_after = cert.get("notAfter")
    issuer = cert.get("issuer", ())
    subject = cert.get("subject", ())

    if not_after:
        try:
            expiry = dt.datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=dt.timezone.utc)
        except ValueError:
            expiry = None

        if expiry is not None:
            days_remaining = (expiry - dt.datetime.now(dt.timezone.utc)).days

            if days_remaining < 0:
                findings.append(
                    make_finding(
                        title="Expired TLS Certificate",
                        severity="critical",
                        description="The target HTTPS certificate is expired.",
                        evidence=f"Certificate expired on {expiry.date().isoformat()}",
                        remediation="Renew and deploy a valid certificate immediately.",
                        category="OWASP A02 - Cryptographic Failures",
                        cvss_score=9.1,
                    )
                )
            elif days_remaining < 21:
                findings.append(
                    make_finding(
                        title="TLS Certificate Near Expiry",
                        severity="medium",
                        description="TLS certificate will expire soon and may cause service disruption.",
                        evidence=f"Expires in {days_remaining} day(s)",
                        remediation="Renew the certificate before expiration and automate renewal checks.",
                        category="Resilience",
                        cvss_score=4.9,
                    )
                )

    if subject and issuer and subject == issuer:
        findings.append(
            make_finding(
                title="Self-Signed Certificate",
                severity="high",
                description="Certificate appears self-signed and may not be trusted by clients.",
                evidence=str(cert.get("subject", "")),
                remediation="Use a certificate issued by a trusted certificate authority.",
                category="OWASP A02 - Cryptographic Failures",
                cvss_score=7.1,
            )
        )

    if protocol in {"TLSv1", "TLSv1.1"}:
        findings.append(
            make_finding(
                title="Deprecated TLS Protocol Supported",
                severity="high",
                description=f"Server negotiated insecure protocol version `{protocol}`.",
                evidence=protocol,
                remediation="Disable TLS 1.0/1.1 and enforce TLS 1.2+.",
                category="OWASP A02 - Cryptographic Failures",
                cvss_score=7.5,
            )
        )

    return findings
