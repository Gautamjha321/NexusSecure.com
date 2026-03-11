from django.contrib import admin

from .models import Scan, ScanLog, Vulnerability


@admin.register(Scan)
class ScanAdmin(admin.ModelAdmin):
    list_display = ("id", "target_url", "user", "status", "progress", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("target_url", "user__username", "user__email")
    readonly_fields = ("created_at", "updated_at", "scan_date")


@admin.register(Vulnerability)
class VulnerabilityAdmin(admin.ModelAdmin):
    list_display = ("id", "scan", "title", "severity", "category", "tool_name", "created_at")
    list_filter = ("severity", "tool_name", "category", "created_at")
    search_fields = ("title", "description", "evidence", "scan__target_url")
    readonly_fields = ("created_at",)


@admin.register(ScanLog)
class ScanLogAdmin(admin.ModelAdmin):
    list_display = ("id", "scan", "tool_name", "status", "created_at")
    list_filter = ("tool_name", "status", "created_at")
    search_fields = ("scan__target_url", "message")
    readonly_fields = ("created_at",)
