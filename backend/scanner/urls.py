from django.urls import path
from .views import (
    StartScanView,
    ScanResultView,
    ScanHistoryView,
    ScanProgressView,
    VulnerabilityListView,
    ScanDetailView,
    ScanStatsView
)

urlpatterns = [
    path("start/", StartScanView.as_view(), name="start-scan"),
    path("history/", ScanHistoryView.as_view(), name="scan-history"),
    path("result/<int:pk>/", ScanResultView.as_view(), name="scan-result"),
    path("progress/<int:pk>/", ScanProgressView.as_view(), name="scan-progress"),
    path("stats/<int:pk>/", ScanStatsView.as_view(), name="scan-stats"),
    path("<int:pk>/", ScanDetailView.as_view(), name="scan-detail"),
    path("<int:scan_id>/vulnerabilities/", VulnerabilityListView.as_view(), name="scan-vulnerabilities"),
]
