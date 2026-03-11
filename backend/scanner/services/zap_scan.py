import logging
import subprocess
from typing import Any

import requests

from .finding_utils import make_finding

logger = logging.getLogger(__name__)

ZAP_RULES: list[tuple[tuple[str, ...], str, str, str, float, str]] = [
    (
        ("sql injection", "sqli"),
        "Potential SQL Injection",
        "critical",
        "ZAP output indicates payload behavior consistent with SQL injection risk.",
        9.1,
        "OWASP A03 - Injection",
    ),
    (
        ("cross site scripting", "xss"),
        "Potential Cross-Site Scripting (XSS)",
        "high",
        "ZAP output indicates untrusted input may be reflected or executed in the browser.",
        8.2,
        "OWASP A03 - Injection",
    ),
    (
        ("csrf", "cross-site request forgery"),
        "Potential CSRF Weakness",
        "high",
        "The application may not enforce anti-CSRF protections on state-changing requests.",
        7.3,
        "OWASP A01 - Broken Access Control",
    ),
    (
        ("directory browsing", "path traversal"),
        "Potential Path Traversal",
        "high",
        "Scanner output references traversal patterns that may expose unauthorized files.",
        8.0,
        "OWASP A01 - Broken Access Control",
    ),
    (
        ("insecure cookie", "httponly", "samesite"),
        "Cookie Security Weakness",
        "medium",
        "Session cookie security attributes appear weak or inconsistent.",
        5.8,
        "OWASP A07 - Identification and Authentication Failures",
    ),
]


def _fallback_passive_checks(url: str, timeout: int) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    try:
        response = requests.get(url, timeout=timeout, allow_redirects=True)
    except requests.RequestException as exc:
        logger.info("ZAP fallback checks skipped for %s: %s", url, exc)
        return findings

    body = response.text.lower()
    if "traceback (most recent call last)" in body or "stack trace" in body:
        findings.append(
            make_finding(
                title="Verbose Error Disclosure",
                severity="medium",
                description="Application response exposes stack trace details.",
                evidence=response.url,
                remediation="Disable verbose errors in production and log full traces server-side only.",
                category="OWASP A05 - Security Misconfiguration",
                cvss_score=5.8,
            )
        )

    if "<script>alert(" in body or "onerror=" in body:
        findings.append(
            make_finding(
                title="Potential Reflected Script Injection Pattern",
                severity="medium",
                description="Response body contains script patterns commonly associated with XSS test payloads.",
                evidence=response.url,
                remediation="Apply context-aware output encoding and strict input validation.",
                category="OWASP A03 - Injection",
                cvss_score=6.1,
            )
        )

    return findings


def run_zap(url: str, timeout: int = 180) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    try:
        cmd = ["zap-cli", "quick-scan", "--self-contained", url]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
    except FileNotFoundError:
        logger.info("zap-cli is not installed; using passive fallback checks.")
        return _fallback_passive_checks(url, timeout=10)
    except subprocess.TimeoutExpired:
        logger.warning("zap quick-scan timed out for %s", url)
        return findings
    except Exception as exc:
        logger.error("Unexpected zap scan error for %s: %s", url, exc)
        return findings

    output = f"{result.stdout}\n{result.stderr}"
    if not output.strip():
        return findings

    lower_output = output.lower()
    for keywords, title, severity, description, cvss, category in ZAP_RULES:
        if any(keyword in lower_output for keyword in keywords):
            evidence_line = next(
                (line.strip() for line in output.splitlines() if any(keyword in line.lower() for keyword in keywords)),
                title,
            )
            findings.append(
                make_finding(
                    title=title,
                    severity=severity,
                    description=description,
                    evidence=evidence_line,
                    remediation="Validate the finding in authenticated ZAP mode and patch affected routes.",
                    category=category,
                    cvss_score=cvss,
                )
            )

    return findings
