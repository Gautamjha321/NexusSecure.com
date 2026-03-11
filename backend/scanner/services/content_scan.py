import logging
from typing import Any
from urllib.parse import urljoin, urlparse

import requests

from .finding_utils import make_finding

logger = logging.getLogger(__name__)

SENSITIVE_PATHS = [
    "/.git/",
    "/.env",
    "/backup.zip",
    "/config.php.bak",
    "/phpinfo.php",
    "/admin/",
    "/wp-admin/",
    "/phpmyadmin/",
]


def _check_sensitive_paths(base_url: str, timeout: int) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    for path in SENSITIVE_PATHS:
        target = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
        try:
            response = requests.get(target, timeout=timeout, allow_redirects=False)
        except requests.RequestException:
            continue

        if response.status_code in {200, 206}:
            findings.append(
                make_finding(
                    title=f"Sensitive Endpoint Exposed ({path})",
                    severity="high",
                    description="A sensitive or administrative endpoint is publicly reachable.",
                    evidence=f"{target} -> HTTP {response.status_code}",
                    remediation="Restrict access by IP allowlist, authentication, or network controls.",
                    category="OWASP A01 - Broken Access Control",
                    cvss_score=8.0,
                )
            )
    return findings


def _check_robots_txt(base_url: str, timeout: int) -> list[dict[str, Any]]:
    robots_url = urljoin(base_url.rstrip("/") + "/", "robots.txt")
    findings: list[dict[str, Any]] = []
    try:
        response = requests.get(robots_url, timeout=timeout, allow_redirects=True)
    except requests.RequestException:
        return findings

    if response.status_code != 200:
        return findings

    lowered = response.text.lower()
    sensitive_keywords = ("admin", "private", "backup", "internal", "config")
    lines = [line.strip() for line in response.text.splitlines() if line.strip().lower().startswith("disallow:")]
    exposed_lines = [line for line in lines if any(keyword in line.lower() for keyword in sensitive_keywords)]

    if exposed_lines:
        findings.append(
            make_finding(
                title="Sensitive Paths Advertised in robots.txt",
                severity="medium",
                description="robots.txt discloses restricted application paths that can aid attackers.",
                evidence="\n".join(exposed_lines[:8]),
                remediation="Do not list sensitive directories in robots.txt; enforce authorization instead.",
                category="Information Disclosure",
                cvss_score=5.8,
            )
        )

    if "allow: /" in lowered and "disallow:" not in lowered:
        findings.append(
            make_finding(
                title="Open robots.txt Policy",
                severity="low",
                description="robots.txt indicates no crawler restrictions, potentially exposing staging paths.",
                evidence=robots_url,
                remediation="Review public crawl policy and ensure non-public endpoints are blocked server-side.",
                category="Hardening",
                cvss_score=2.7,
            )
        )

    return findings


def _check_form_csrf(response_text: str) -> list[dict[str, Any]]:
    lowered = response_text.lower()
    if "<form" not in lowered:
        return []

    csrf_markers = ("csrf", "_token", "authenticity_token", "xsrf")
    if any(marker in lowered for marker in csrf_markers):
        return []

    return [
        make_finding(
            title="Potential Missing CSRF Token",
            severity="medium",
            description="HTML forms were detected without obvious CSRF token markers.",
            remediation="Embed anti-CSRF tokens in state-changing forms and validate them server-side.",
            category="OWASP A01 - Broken Access Control",
            cvss_score=6.1,
        )
    ]


def _check_directory_listing(response_text: str) -> list[dict[str, Any]]:
    lowered = response_text.lower()
    if "<title>index of /" in lowered or "<h1>index of /" in lowered:
        return [
            make_finding(
                title="Directory Listing Enabled",
                severity="high",
                description="Server directory listing appears enabled for a browsable path.",
                remediation="Disable auto-indexing in the web server and restrict file-system browsing.",
                category="OWASP A05 - Security Misconfiguration",
                cvss_score=7.0,
            )
        ]
    return []


def run_content_checks(url: str, timeout: int = 8) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return findings

    try:
        response = requests.get(url, timeout=timeout, allow_redirects=True)
    except requests.RequestException as exc:
        logger.info("Content checks skipped for %s: %s", url, exc)
        return findings

    if response.status_code >= 500:
        findings.append(
            make_finding(
                title="Server Error Disclosure",
                severity="low",
                description="Target returned server-side error responses during baseline probing.",
                evidence=f"HTTP {response.status_code} at {response.url}",
                remediation="Handle server errors with generic responses and review exception handling.",
                category="OWASP A09 - Security Logging and Monitoring Failures",
                cvss_score=3.9,
            )
        )

    findings.extend(_check_form_csrf(response.text))
    findings.extend(_check_directory_listing(response.text))
    findings.extend(_check_robots_txt(url, timeout))
    findings.extend(_check_sensitive_paths(url, timeout))
    return findings
