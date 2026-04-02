// JobHunt — API Client
// Handles Sanctum token-based authentication and provides typed methods for all API endpoints.

import type {
  AnalyzeJobRequest,
  AnalyzeJobResponse,
  AuthResponse,
  JobData,
  User,
  ResumeProfile,
  ApiError,
} from "@/types";

// Configuration
const API_BASE_URL =
  (typeof chrome !== "undefined" &&
    chrome.runtime?.getManifest?.()?.host_permissions?.[1]?.replace("/*", "")) ||
  "http://localhost:8000";

const API_PREFIX = `${API_BASE_URL}/api`;

// Token Management
async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["authToken"], (result) => {
      resolve(result.authToken || null);
    });
  });
}

async function setAuthToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ authToken: token }, resolve);
  });
}

async function clearAuthToken(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(["authToken"], resolve);
  });
}

// HTTP Client
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_PREFIX}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData: ApiError = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
    throw new Error(errorData.message);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/* ─── Authentication ─── */
export async function loginWithGoogle(googleAccessToken: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ access_token: googleAccessToken }),
  });
  await setAuthToken(response.token);
  return response;
}

export async function register(email: string, password: string): Promise<void> {
  await apiRequest<void>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function verify(email: string, code: string): Promise<void> {
  const response = await apiRequest<AuthResponse>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  await setAuthToken(response.token);
}

export async function loginEmail(email: string, password: string): Promise<void> {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  await setAuthToken(response.token);
}

export async function logout(): Promise<void> {
  await apiRequest<void>("/auth/logout", { method: "POST" });
  await clearAuthToken();
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/user");
}

/* ─── Resume / CV ─── */
export async function uploadResume(file: File): Promise<ResumeProfile> {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch(`${API_PREFIX}/resume/upload`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Upload failed" }));
    throw new Error(errorData.message);
  }

  return response.json();
}

export async function getResumeSkills(): Promise<ResumeProfile> {
  return apiRequest<ResumeProfile>("/resume/skills");
}

export async function deleteResume(): Promise<void> {
  return apiRequest<void>("/resume", { method: "DELETE" });
}

/* ─── Job Analysis ─── */
export async function analyzeJob(
  jobData: JobData,
  resumeProfileId?: string
): Promise<AnalyzeJobResponse> {
  const request: AnalyzeJobRequest = { jobData, resumeProfileId };
  return apiRequest<AnalyzeJobResponse>("/jobs/analyze", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/* ─── Subscription ─── */
export async function checkoutPremium(): Promise<{ token: string; redirect_url: string }> {
  return apiRequest<{ token: string; redirect_url: string }>("/subscription/checkout", {
    method: "POST",
  });
}

/* ─── Utility ─── */
export { getAuthToken, setAuthToken, clearAuthToken };
