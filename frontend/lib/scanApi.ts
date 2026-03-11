import api from "./api";

export interface Vulnerability {
  id: number;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence?: string | null;
  remediation?: string | null;
  category?: string | null;
  cvss_score?: string | number | null;
  reference?: string | null;
  tool_name: string;
  created_at: string;
}

export interface ScanLog {
  id: number;
  tool_name: string;
  status: string;
  message: string;
  created_at: string;
}

export interface ScanResult {
  id: number;
  target_url: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
  vulnerabilities: Vulnerability[];
  logs: ScanLog[];
  vulnerability_count: number;
}

export interface ScanListItem {
  id: number;
  target_url: string;
  status: string;
  progress: number;
  created_at: string;
  vulnerability_count: number;
}

export interface ScanHistoryResponse {
  count: number;
  results: ScanListItem[];
  next?: string | null;
  previous?: string | null;
}

export interface ScanProgress {
  id: number;
  status: string;
  progress: number;
  target_url: string;
  vulnerability_count: number;
  created_at: string;
  updated_at: string;
  severity_breakdown: Record<string, number>;
  logs: ScanLog[];
}

export interface ScanStats {
  scan_id: number;
  target_url: string;
  status: string;
  progress: number;
  total_vulnerabilities: number;
  severity_breakdown: Record<string, number>;
  tool_breakdown: Record<string, number>;
  owasp_breakdown: Record<string, number>;
  risk_score: number;
  risk_level: "low" | "moderate" | "high" | "critical";
  recommendations: string[];
  created_at: string;
  completed_at: string | null;
}

export const startScan = async (url: string): Promise<ScanResult> => {
  const response = await api.post<ScanResult>("scan/start/", { target_url: url });
  return response.data;
};

export const getScanResult = async (id: string | number): Promise<ScanResult> => {
  const response = await api.get<ScanResult>(`scan/result/${id}/`);
  return response.data;
};

export const getScanProgress = async (id: string | number): Promise<ScanProgress> => {
  const response = await api.get<ScanProgress>(`scan/progress/${id}/`);
  return response.data;
};

export const getScanHistory = async (): Promise<ScanHistoryResponse> => {
  const response = await api.get<ScanHistoryResponse>("scan/history/");
  return response.data;
};

export const getScanStats = async (id: string | number): Promise<ScanStats> => {
  const response = await api.get<ScanStats>(`scan/stats/${id}/`);
  return response.data;
};

export const deleteScan = async (id: string | number): Promise<{ message?: string }> => {
  const response = await api.delete<{ message?: string }>(`scan/${id}/`);
  return response.data;
};
