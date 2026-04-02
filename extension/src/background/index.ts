/* ═══════════════════════════════════════════════════════
 * JobHunt — Background Service Worker
 * Central message hub that bridges:
 *   Content Script ↔ Background ↔ Laravel API
 *
 * Responsibilities:
 * - Handle message routing from content scripts
 * - Manage API communication with auth tokens
 * - Dispatch Chrome desktop notifications
 * - Coordinate Google OAuth flow
 * ═══════════════════════════════════════════════════════ */

import { onMessage } from "@/lib/messaging";
import * as api from "@/lib/api";
import { MessageType } from "@/types";
import type { JobData, AnalyzeJobResponse } from "@/types";

/* ═══════════════════════════════════════════════════════
 * Message Handlers
 * ═══════════════════════════════════════════════════════ */

/**
 * ANALYZE_JOB: Content script sends scraped job data.
 * Background forwards to Laravel API for AI processing.
 */
onMessage<JobData, AnalyzeJobResponse>(
  MessageType.ANALYZE_JOB,
  async (jobData) => {
    console.log("[JobHunt BG] Analyzing job:", jobData.jobTitle);

    const response = await api.analyzeJob(jobData);
    return response;
  }
);



/**
 * LOGIN_WITH_GOOGLE: Popup triggers Google OAuth flow.
 */
onMessage<void, { success: boolean; error?: string }>(
  MessageType.LOGIN_WITH_GOOGLE,
  async () => {
    console.log("[JobHunt BG] Starting Google OAuth flow...");

    try {
      const token = await getGoogleAuthToken();
      if (!token) throw new Error("Google OAuth cancelled or failed. Make sure OAuth2 client_id is configured correctly in manifest.json.");

      await api.loginWithGoogle(token);

      showNotification("Welcome!", "You're now signed in to JobHunt.");

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google OAuth failed";
      console.error("[JobHunt BG] OAuth error:", message);
      return { success: false, error: message };
    }
  }
);

/**
 * GET_AUTH_TOKEN: Check if user is authenticated.
 */
onMessage<void, { token: string | null }>(
  MessageType.GET_AUTH_TOKEN,
  async () => {
    const token = await api.getAuthToken();
    return { token };
  }
);

/* ═══════════════════════════════════════════════════════
 * Google OAuth Integration
 * Uses chrome.identity API for seamless OAuth flow
 * in Chrome Extensions.
 * ═══════════════════════════════════════════════════════ */

/**
 * Google OAuth Integration
 * Uses chrome.identity API for seamless OAuth flow
 * in Chrome Extensions.
 */
function getGoogleAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error("[JobHunt BG] OAuth Error:", chrome.runtime.lastError.message);
        resolve(null);
        return;
      }
      resolve(token || null);
    });
  });
}

/* ═══════════════════════════════════════════════════════
 * Chrome Notifications
 * ═══════════════════════════════════════════════════════ */

function showNotification(title: string, message: string): void {
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
    title: `JobHunt — ${title}`,
    message,
    priority: 1,
  });
}

/* ═══════════════════════════════════════════════════════
 * Extension Lifecycle Events
 * ═══════════════════════════════════════════════════════ */

// On extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[JobHunt BG] Extension installed");

    showNotification(
      "Welcome to JobHunt!",
      "Click the extension icon to get started with AI-powered job matching."
    );
  } else if (details.reason === "update") {
    console.log("[JobHunt BG] Extension updated to version", chrome.runtime.getManifest().version);
  }
});

// Keep service worker alive for message handling
chrome.runtime.onStartup.addListener(() => {
  console.log("[JobHunt BG] Service worker started");
});

console.log("[JobHunt BG] Background service worker initialized");
