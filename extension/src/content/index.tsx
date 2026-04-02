/* ═══════════════════════════════════════════════════════
 * JobHunt — Content Script Entry Point
 * Mounts the LinkedIn overlay inside a Shadow DOM
 * to fully encapsulate styles from LinkedIn's CSS.
 *
 * Flow:
 * 1. Detect if we're on a LinkedIn job detail page
 * 2. Create a host element + Shadow Root
 * 3. Inject compiled Tailwind CSS into shadow root
 * 4. Render React <LinkedInOverlay /> inside shadow root
 * ═══════════════════════════════════════════════════════ */

import React from "react";
import ReactDOM from "react-dom/client";
import LinkedInOverlay from "./LinkedInOverlay";
import contentCss from "./content.css?inline";
import { isLinkedInJobPage } from "@/lib/scraper";

const HOST_ID = "jobhunt-extension-root";
const FONT_LINK_ID = "jobhunt-fonts";

/**
 * Injects Google Fonts into the main document <head>.
 * Fonts must be loaded at the document level because
 * Shadow DOM cannot load external fonts on its own.
 */
function injectFonts(): void {
  if (document.getElementById(FONT_LINK_ID)) return;

  const fontLink = document.createElement("link");
  fontLink.id = FONT_LINK_ID;
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600&display=swap";
  document.head.appendChild(fontLink);

  // Material Symbols
  const iconLink = document.createElement("link");
  iconLink.rel = "stylesheet";
  iconLink.href =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
  document.head.appendChild(iconLink);
}

/**
 * Creates the Shadow DOM host element and mounts
 * the React overlay application inside it.
 */
function mountOverlay(): void {
  // Prevent duplicate mounts
  if (document.getElementById(HOST_ID)) return;

  // Create host element (invisible to LinkedIn's layout)
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    z-index: 2147483647;
    width: 0;
    height: 0;
    overflow: visible;
    pointer-events: none;
  `;
  document.body.appendChild(host);

  // Attach Shadow Root
  const shadowRoot = host.attachShadow({ mode: "open" });

  // Inject compiled Tailwind CSS into the Shadow Root
  const styleSheet = document.createElement("style");
  styleSheet.textContent = contentCss;
  shadowRoot.appendChild(styleSheet);

  // Create React mount point inside Shadow Root
  const appContainer = document.createElement("div");
  appContainer.id = "jobhunt-app";
  appContainer.style.pointerEvents = "auto";
  shadowRoot.appendChild(appContainer);

  // Mount React application
  const root = ReactDOM.createRoot(appContainer);
  root.render(
    React.createElement(React.StrictMode, null, React.createElement(LinkedInOverlay))
  );
}

/**
 * Removes the overlay when navigating away from a job page.
 */
function unmountOverlay(): void {
  const host = document.getElementById(HOST_ID);
  if (host) {
    host.remove();
  }
}

/**
 * Watches for LinkedIn SPA navigation changes.
 * LinkedIn uses client-side routing, so we need to
 * observe URL changes to detect job page transitions.
 */
function observeNavigation(): void {
  let lastUrl = location.href;

  const checkPage = () => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      if (isLinkedInJobPage()) {
        mountOverlay();
      } else {
        unmountOverlay();
      }
    }
  };

  // MutationObserver to catch SPA navigations
  const observer = new MutationObserver(checkPage);
  observer.observe(document.body, { childList: true, subtree: true });

  // Also use popstate for back/forward navigation
  window.addEventListener("popstate", checkPage);
}

/* ─── Initialize ─── */
function init(): void {
  injectFonts();

  if (isLinkedInJobPage()) {
    mountOverlay();
  }

  observeNavigation();

  console.log("[JobHunt] Content script initialized");
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
