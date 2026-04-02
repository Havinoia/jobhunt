/* ═══════════════════════════════════════════════════════
 * JobHunt — Message Bridge
 * Type-safe communication layer between:
 *   Content Script ↔ Background Service Worker
 *
 * Uses chrome.runtime messaging API with strongly
 * typed message envelopes.
 * ═══════════════════════════════════════════════════════ */

import { MessageType, type ExtensionMessage } from "@/types";

/**
 * Send a message from content script → background service worker.
 * Returns a typed response promise.
 */
export function sendToBackground<TPayload, TResponse>(
  type: MessageType,
  payload: TPayload
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    const message: ExtensionMessage<TPayload> = { type, payload };

    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      // If the background script returned an object with an error property, reject it.
      if (response && typeof response === 'object' && 'error' in response) {
        reject(new Error(response.error));
        return;
      }
      
      resolve(response as TResponse);
    });
  });
}

/**
 * Register a message handler in the background service worker.
 * Automatically handles the async response pattern.
 */
export function onMessage<TPayload, TResponse>(
  type: MessageType,
  handler: (
    payload: TPayload,
    sender: chrome.runtime.MessageSender
  ) => Promise<TResponse> | TResponse
): void {
  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage<TPayload>,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: TResponse) => void
    ) => {
      if (message.type !== type) return false;

      // Handle async responses
      const result = handler(message.payload, sender);

      if (result instanceof Promise) {
        result
          .then((response) => sendResponse(response))
          .catch((error) => {
            console.error(`[JobHunt Message Bridge] Error handling ${type}:`, error);
            sendResponse({ error: error.message } as TResponse);
          });
        // Return true to indicate async response
        return true;
      } else {
        sendResponse(result);
        return false;
      }
    }
  );
}

/**
 * Send a message to a specific tab's content script.
 * Used by the background script to push data to content scripts.
 */
export function sendToContentScript<TPayload>(
  tabId: number,
  type: MessageType,
  payload: TPayload
): Promise<void> {
  return new Promise((resolve, reject) => {
    const message: ExtensionMessage<TPayload> = { type, payload };

    chrome.tabs.sendMessage(tabId, message, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}
