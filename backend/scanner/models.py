from django.db import models
from django.conf import settings
from django.utils import timezone


class Scan(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scans", null=True, blank=True)
    target_url = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    progress = models.IntegerField(default=0)  # 0-100%
    scan_date = models.DateTimeField(default=timezone.now, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.target_url} - {self.status}"

    @property
    def vulnerability_count(self):
        return self.vulnerabilities.count()


class Vulnerability(models.Model):
    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    scan = models.ForeignKey(Scan, related_name="vulnerabilities", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    description = models.TextField()
    evidence = models.TextField(blank=True, null=True)
    remediation = models.TextField(blank=True, default="")
    category = models.CharField(max_length=100, blank=True, default="")
    cvss_score = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    reference = models.URLField(blank=True, default="")
    tool_name = models.CharField(max_length=50)  # nmap, zap, nikto, etc
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-severity", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.severity})"


class ScanLog(models.Model):
    scan = models.ForeignKey(Scan, related_name="logs", on_delete=models.CASCADE)
    tool_name = models.CharField(max_length=50)
    status = models.CharField(max_length=20)  # running/completed/failed
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.scan.id} - {self.tool_name}"
