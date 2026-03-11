import logging
from typing import Any

import requests
from requests.exceptions import SSLError

from .finding_utils import make_finding

logger = logging.getLogger(__name__)

REQUEST_HEADERS = {
    "User-Agent": "NexusSecure/5.0 (+https://localhost/security-scanner)"
}


def _extract_set_cookie_headers(response: requests.Response) -> list[str]:
    raw_headers = getattr(response, "raw", None)
    if raw_headers and hasattr(raw_headers, "headers"):
        header_obj = raw_headers.headers
        if hasattr(header_obj, "getlist"):
            return [cookie.strip() for cookie in header_obj.getlist("Set-Cookie") if cookie]

    cookie_header = response.headers.get("Set-Cookie")
    if not cookie_header:
        return []
    return [chunk.strip() for chunk in cookie_header.split(",") if chunk.strip()]


def _check_cookie_flags(cookies: list[str]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for cookie in cookies:
        lowered = cookie.lower()
        cookie_name = cookie.split("=", 1)[0].strip() or "session-cookie"
        base_finding = (
            f"Cookie `{cookie_name}` is missing a mandatory security attribute. "
            "This can expose session identifiers to attackers."
        )

        if "secure" not in lowered:
            findings.append(
                make_finding(
                    title=f"Insecure Cookie Attribute ({cookie_name})",
                    severity="high",
                    description=base_finding,
                    evidence=cookie,
                    remediation="Set the `Secure` flag on session and authentication cookies.",
                    category="OWASP A05 - Security Misconfiguration",
                    cvss_score=8.2,
                )
            )

        if "httponly" not in lowered:
            findings.append(
                make_finding(
                    title=f"Cookie Missing HttpOnly ({cookie_name})",
                    severity="medium",
                    description=base_finding,
                    evidence=cookie,
                    remediation="Set `HttpOnly` on cookies to block JavaScript access.",
                    category="OWASP A07 - Identification and Authentication Failures",
                    cvss_score=5.3,
                )
            )

        if "samesite" not in lowered:
            findings.append(
                make_finding(
                    title=f"Cookie Missing SameSite ({cookie_name})",
                    severity="medium",
                    description=base_finding,
                    evidence=cookie,
                    remediation="Set `SameSite=Lax` or `SameSite=Strict` for session cookies.",
                    category="OWASP A01 - Broken Access Control",
                    cvss_score=5.3,
                )
            )
    return findings


def check_headers(url: str, timeout: int = 12) -> list[dict[str, Any]]:
    """Run passive HTTP security header checks and return professional findings."""
    findings: list[dict[str, Any]] = []

    try:
        response = requests.get(
            url,
            timeout=timeout,
            allow_redirects=True,
            headers=REQUEST_HEADERS,
        )
    except SSLError as exc:
        logger.warning("TLS validation failed for %s: %s", url, exc)
        findings.append(
            make_finding(
                title="Invalid TLS Certificate",
                severity="high",
                description="The target served an invalid or untrusted TLS certificate.",
                evidence=str(exc),
                remediation="Install a valid CA-signed certificate and complete certificate chain.",
                category="OWASP A02 - Cryptographic Failures",
                cvss_score=7.4,
            )
        )
        try:
            response = requests.get(
                url,
                timeout=timeout,
                allow_redirects=True,
                headers=REQUEST_HEADERS,
                verify=False,
            )
        except requests.RequestException:
            return findings
    except requests.RequestException as exc:
        logger.error("HTTP request failed for %s: %s", url, exc)
        return [
            make_finding(
                title="Target Unreachable",
                severity="low",
                description="The scanner could not establish an HTTP connection to the target.",
                evidence=str(exc),
                remediation="Confirm DNS resolution, firewall rules, and server availability.",
                category="Availability",
                cvss_score=3.1,
            )
        ]

    headers = response.headers
    lower_headers = {key.lower(): value for key, value in headers.items()}
    is_https = response.url.startswith("https://")

    required_headers: list[tuple[str, str, str, float, str]] = [
        (
            "content-security-policy",
            "high",
            "Mitigates script injection and unsafe resource loading.",
            7.5,
            "OWASP A03 - Injection",
        ),
        (
            "x-frame-options",
            "high",
            "Protects against clickjacking attacks in framed contexts.",
            7.1,
            "OWASP A05 - Security Misconfiguration",
        ),
        (
            "x-content-type-options",
            "medium",
            "Prevents browsers from MIME-sniffing unsafe content types.",
            5.3,
            "OWASP A05 - Security Misconfiguration",
        ),
        (
            "referrer-policy",
            "medium",
            "Controls cross-origin leakage of sensitive URL information.",
            5.0,
            "OWASP A01 - Broken Access Control",
        ),
        (
            "permissions-policy",
            "low",
            "Restricts browser features that can increase attack surface.",
            3.9,
            "Hardening",
        ),
        (
            "cross-origin-opener-policy",
            "low",
            "Reduces cross-origin window context attacks.",
            3.3,
            "Hardening",
        ),
    ]

    if is_https:
        required_headers.append(
            (
                "strict-transport-security",
                "high",
                "Forces HTTPS and defends against downgrade attacks.",
                7.4,
                "OWASP A02 - Cryptographic Failures",
            )
        )

    for header_name, severity, description, cvss, category in required_headers:
        if header_name not in lower_headers:
            findings.append(
                make_finding(
                    title=f"Missing Security Header: {header_name}",
                    severity=severity,
                    description=f"{header_name} is missing. {description}",
                    remediation=f"Configure `{header_name}` in your web server or reverse proxy.",
                    category=category,
                    cvss_score=cvss,
                )
            )

    csp = lower_headers.get("content-security-policy", "")
    if csp and ("unsafe-inline" in csp or "unsafe-eval" in csp):
        findings.append(
            make_finding(
                title="Weak Content Security Policy",
                severity="medium",
                description="The configured CSP allows unsafe script execution directives.",
                evidence=csp,
                remediation="Remove `unsafe-inline` and `unsafe-eval`; use nonces or hashes.",
                category="OWASP A03 - Injection",
                cvss_score=6.1,
            )
        )

    xfo = lower_headers.get("x-frame-options", "").lower()
    if xfo and xfo not in {"deny", "sameorigin"}:
        findings.append(
            make_finding(
                title="Weak X-Frame-Options Value",
                severity="medium",
                description="X-Frame-Options should be set to `DENY` or `SAMEORIGIN`.",
                evidence=headers.get("X-Frame-Options", ""),
                remediation="Set `X-Frame-Options: DENY` unless framing is explicitly required.",
                category="OWASP A05 - Security Misconfiguration",
                cvss_score=5.3,
            )
        )

    xcto = lower_headers.get("x-content-type-options", "").lower()
    if xcto and xcto != "nosniff":
        findings.append(
            make_finding(
                title="Weak X-Content-Type-Options Value",
                severity="low",
                description="X-Content-Type-Options should be set to `nosniff`.",
                evidence=headers.get("X-Content-Type-Options", ""),
                remediation="Set `X-Content-Type-Options: nosniff` for all responses.",
                category="OWASP A05 - Security Misconfiguration",
                cvss_score=3.7,
            )
        )

    if "server" in lower_headers:
        findings.append(
            make_finding(
                title="Server Banner Disclosure",
                severity="low",
                description="The `Server` header reveals backend server software details.",
                evidence=headers.get("Server", ""),
                remediation="Remove or sanitize `Server` header values in production.",
                category="Information Disclosure",
                cvss_score=3.3,
            )
        )

    if "x-powered-by" in lower_headers:
        findings.append(
            make_finding(
                title="Technology Stack Disclosure",
                severity="low",
                description="The response exposes framework information via `X-Powered-By`.",
                evidence=headers.get("X-Powered-By", ""),
                remediation="Disable `X-Powered-By` and similar framework fingerprint headers.",
                category="Information Disclosure",
                cvss_score=3.3,
            )
        )

    findings.extend(_check_cookie_flags(_extract_set_cookie_headers(response)))
    return findings
