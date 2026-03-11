from decimal import Decimal, InvalidOperation
from typing import Any, Dict


SEVERITY_LEVELS = {"low", "medium", "high", "critical"}


def normalize_severity(value: str | None) -> str:
    severity = (value or "low").strip().lower()
    if severity not in SEVERITY_LEVELS:
        return "low"
    return severity


def normalize_cvss(value: Any) -> Decimal | None:
    if value is None:
        return None

    try:
        cvss = Decimal(str(value)).quantize(Decimal("0.1"))
    except (InvalidOperation, TypeError, ValueError):
        return None

    if cvss < Decimal("0.0"):
        return Decimal("0.0")
    if cvss > Decimal("10.0"):
        return Decimal("10.0")
    return cvss


def make_finding(
    *,
    title: str,
    severity: str,
    description: str,
    evidence: str = "",
    remediation: str = "",
    category: str = "",
    cvss_score: float | str | Decimal | None = None,
    reference: str = "",
) -> Dict[str, Any]:
    return {
        "title": title.strip(),
        "severity": normalize_severity(severity),
        "description": description.strip(),
        "evidence": evidence.strip(),
        "remediation": remediation.strip(),
        "category": category.strip(),
        "cvss_score": normalize_cvss(cvss_score),
        "reference": reference.strip(),
    }
