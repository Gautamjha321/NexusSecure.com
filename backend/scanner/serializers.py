import ipaddress
import socket
from urllib.parse import urlparse

from rest_framework import serializers
from .models import Scan, Vulnerability, ScanLog


class VulnerabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vulnerability
        fields = [
            "id",
            "title",
            "severity",
            "description",
            "evidence",
            "remediation",
            "category",
            "cvss_score",
            "reference",
            "tool_name",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class ScanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanLog
        fields = ["id", "tool_name", "status", "message", "created_at"]
        read_only_fields = ["created_at"]


class ScanSerializer(serializers.ModelSerializer):
    vulnerabilities = VulnerabilitySerializer(many=True, read_only=True)
    logs = ScanLogSerializer(many=True, read_only=True)
    vulnerability_count = serializers.SerializerMethodField()

    class Meta:
        model = Scan
        fields = ["id", "target_url", "status", "progress", "created_at", "updated_at", "vulnerabilities", "logs", "vulnerability_count"]
        read_only_fields = ["user", "status", "progress", "created_at", "updated_at", "vulnerabilities", "logs"]

    def get_vulnerability_count(self, obj):
        return obj.vulnerability_count

    @staticmethod
    def _is_restricted_ip(address: str) -> bool:
        ip = ipaddress.ip_address(address)
        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        )

    def validate_target_url(self, value):
        parsed = urlparse(value)

        if parsed.scheme not in {"http", "https"}:
            raise serializers.ValidationError("URL scheme must be http or https.")

        hostname = parsed.hostname
        if not hostname:
            raise serializers.ValidationError("A valid hostname is required.")

        if hostname.lower() == "localhost" or hostname.endswith(".local"):
            raise serializers.ValidationError("Localhost targets are not allowed.")

        try:
            if self._is_restricted_ip(hostname):
                raise serializers.ValidationError("Private or internal IP targets are not allowed.")
        except ValueError:
            try:
                resolved = {record[4][0] for record in socket.getaddrinfo(hostname, None)}
            except socket.gaierror:
                return value

            for ip_value in resolved:
                if self._is_restricted_ip(ip_value):
                    raise serializers.ValidationError("Host resolves to private/internal IP space.")

        return value
