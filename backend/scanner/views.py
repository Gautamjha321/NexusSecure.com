from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import Scan, ScanLog
from .serializers import ScanSerializer, VulnerabilitySerializer, ScanLogSerializer
from .tasks import run_scan_async
import logging
import threading

logger = logging.getLogger(__name__)


class StartScanView(generics.CreateAPIView):
    """API endpoint to start a new vulnerability scan"""
    serializer_class = ScanSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # Create scan with current user
        scan_user = self.request.user if self.request.user.is_authenticated else None
        scan = serializer.save(user=scan_user)
        
        # Trigger async Celery task
        try:
            if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
                # Run inline for local/dev debugging
                run_scan_async.apply(args=[scan.id])
            else:
                run_scan_async.delay(scan.id)
            logger.info(f"Scan {scan.id} queued for processing")
        except Exception as e:
            logger.error(f"Failed to queue scan {scan.id}: {e}")
            # Fallback: run scan in a background thread if Celery is unavailable
            try:
                thread = threading.Thread(
                    target=run_scan_async.apply,
                    kwargs={"args": [scan.id]},
                    daemon=True,
                )
                thread.start()
                logger.warning(f"Celery unavailable. Scan {scan.id} running in background thread.")
            except Exception as thread_error:
                logger.error(f"Fallback scan thread failed for {scan.id}: {thread_error}")
                scan.status = "failed"
                scan.save()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return Response(response.data, status=status.HTTP_201_CREATED)


class ScanResultView(generics.RetrieveAPIView):
    """Get detailed scan results including all vulnerabilities"""
    queryset = Scan.objects.all()
    serializer_class = ScanSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = []  # Disable throttling for polling

    def get_queryset(self):
        # Anyone can see the scan if they have the ID
        return Scan.objects.all()


class ScanHistoryView(generics.ListAPIView):
    """Get scan history for all users or authenticated user"""
    serializer_class = ScanSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = []  # Disable throttling for polling

    def get_queryset(self):
        # Could filter by user if authenticated, else return all, or just return all recent
        if self.request.user.is_authenticated:
            return Scan.objects.filter(user=self.request.user).order_by("-created_at")
        return Scan.objects.all().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({"count": queryset.count(), "results": serializer.data})


class ScanProgressView(generics.RetrieveAPIView):
    """Get real-time progress of a running scan"""
    queryset = Scan.objects.all()
    permission_classes = [permissions.AllowAny]
    throttle_classes = []  # Disable throttling for polling

    def get_queryset(self):
        return Scan.objects.all()

    def retrieve(self, request, *args, **kwargs):
        scan = self.get_object()
        vulnerabilities = scan.vulnerabilities.all()
        severity_breakdown = {
            "critical": vulnerabilities.filter(severity="critical").count(),
            "high": vulnerabilities.filter(severity="high").count(),
            "medium": vulnerabilities.filter(severity="medium").count(),
            "low": vulnerabilities.filter(severity="low").count(),
        }
        return Response({
            "id": scan.id,
            "status": scan.status,
            "progress": scan.progress,
            "target_url": scan.target_url,
            "vulnerability_count": scan.vulnerability_count,
            "scan_date": scan.scan_date,
            "created_at": scan.created_at,
            "updated_at": scan.updated_at,
            "severity_breakdown": severity_breakdown,
            "logs": ScanLogSerializer(scan.logs.all(), many=True).data
        })


class VulnerabilityListView(generics.ListAPIView):
    """Get vulnerabilities for a specific scan"""
    serializer_class = VulnerabilitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        scan_id = self.kwargs.get("scan_id")
        # Allow anyone with scan ID to access vulnerabilities
        scan = get_object_or_404(Scan, id=scan_id)
        return scan.vulnerabilities.all()


class ScanDetailView(generics.RetrieveDestroyAPIView):
    """Get scan details or delete a scan"""
    queryset = Scan.objects.all()
    serializer_class = ScanSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Scan.objects.all()

    def destroy(self, request, *args, **kwargs):
        """Delete a scan and all associated data"""
        scan = self.get_object()
        scan_id = scan.id
        scan.delete()
        return Response(
            {"message": f"Scan {scan_id} deleted successfully"},
            status=status.HTTP_200_OK
        )


class ScanStatsView(generics.RetrieveAPIView):
    """Get security statistics for a scan"""
    queryset = Scan.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Scan.objects.all()

    def retrieve(self, request, *args, **kwargs):
        scan = self.get_object()
        vulnerabilities = scan.vulnerabilities.all()

        # Calculate statistics
        severity_counts = {
            "critical": vulnerabilities.filter(severity="critical").count(),
            "high": vulnerabilities.filter(severity="high").count(),
            "medium": vulnerabilities.filter(severity="medium").count(),
            "low": vulnerabilities.filter(severity="low").count(),
        }

        tool_counts = {}
        for vuln in vulnerabilities:
            tool_counts[vuln.tool_name] = tool_counts.get(vuln.tool_name, 0) + 1

        category_counts = {}
        for vuln in vulnerabilities:
            category = vuln.category or "Uncategorized"
            category_counts[category] = category_counts.get(category, 0) + 1

        weighted_deduction = (
            severity_counts["critical"] * 20
            + severity_counts["high"] * 12
            + severity_counts["medium"] * 6
            + severity_counts["low"] * 2
        )
        risk_score = max(0, 100 - weighted_deduction)

        if risk_score >= 85:
            risk_level = "low"
        elif risk_score >= 65:
            risk_level = "moderate"
        elif risk_score >= 40:
            risk_level = "high"
        else:
            risk_level = "critical"

        recommendations = []
        for vuln in vulnerabilities:
            if vuln.remediation and vuln.remediation not in recommendations:
                recommendations.append(vuln.remediation)
            if len(recommendations) >= 5:
                break

        return Response({
            "scan_id": scan.id,
            "target_url": scan.target_url,
            "status": scan.status,
            "progress": scan.progress,
            "total_vulnerabilities": vulnerabilities.count(),
            "severity_breakdown": severity_counts,
            "tool_breakdown": tool_counts,
            "owasp_breakdown": category_counts,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "recommendations": recommendations,
            "scan_date": scan.scan_date,
            "created_at": scan.created_at,
            "completed_at": scan.updated_at if scan.status == "completed" else None
        })
