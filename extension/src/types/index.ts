/* ═══════════════════════════════════════════════════════
 * JobHunt — Shared Type Definitions
 * Core interfaces used across popup, content script,
 * background script, and API communication.
 * ═══════════════════════════════════════════════════════ */

/* ─── Job Data (scraped from LinkedIn DOM) ─── */
export interface JobData {
  jobTitle: string;
  companyName: string;
  location: string;
  jobDescription: string;
  linkedinJobUrl: string;
}

/* ─── AI Analysis Response ─── */
export interface MatchResult {
  matchScore: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

export interface SkillGap {
  skill: string;
  importance: "high" | "medium" | "low";
  suggestion: string;
}

/* ─── User & Profile ─── */
export interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  tier: "freemium" | "premium";
  avatarUrl?: string;
  usage?: UsageInfo;
}

export interface ResumeReport {
  analysis_metadata: {
    detected_language: string;
    career_level: string;
    primary_domain: string;
  };
  extracted_data: {
    skills_hard: string[];
    skills_soft: string[];
    tools_and_apps: string[];
    credentials: string[];
  };
  job_recommendations: {
    role_title: string;
    relevance_score: number;
    logic_reasoning: string;
    market_demand: string;
    search_keywords: string[];
  }[];
  skill_gap_analysis: {
    missing_common_skills: string[];
    upskilling_suggestion: string;
  };
}

export interface ResumeProfile {
  id: string;
  userId: string;
  originalFilename: string;
  category?: string;
  extractedSkills: string[];
  report?: ResumeReport;
  updatedAt: string;
}



/* ─── Message Bridge Types ─── */
export enum MessageType {
  /* Content Script → Background */
  ANALYZE_JOB = "ANALYZE_JOB",
  SCRAPE_RESULT = "SCRAPE_RESULT",

  /* Background → Content Script */
  ANALYSIS_RESULT = "ANALYSIS_RESULT",

  /* Auth */
  GET_AUTH_TOKEN = "GET_AUTH_TOKEN",
  AUTH_TOKEN_RESPONSE = "AUTH_TOKEN_RESPONSE",
  LOGIN_WITH_GOOGLE = "LOGIN_WITH_GOOGLE",

  /* Notifications */
  SHOW_NOTIFICATION = "SHOW_NOTIFICATION",
}

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload: T;
}

/* ─── API Request/Response Shapes ─── */
export interface AnalyzeJobRequest {
  jobData: JobData;
  resumeProfileId?: string;
}

export interface AnalyzeJobResponse {
  matchResult: MatchResult;
  skillGaps: SkillGap[];
}



export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
