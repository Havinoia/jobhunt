/* ═══════════════════════════════════════════════════════
 * JobHunt — LinkedIn DOM Scraper
 * Extracts job posting data from LinkedIn's job detail page.
 *
 * Strategy: Use multiple selector fallbacks to handle
 * LinkedIn's frequent DOM structure changes.
 * ═══════════════════════════════════════════════════════ */

import type { JobData } from "@/types";

/**
 * Selector groups for LinkedIn job detail elements.
 * Ordered by specificity — first match wins.
 */
const SELECTORS = {
  jobTitle: [
    "h1.t-24.t-bold.inline",
    "h1.job-details-jobs-unified-top-card__job-title",
    "h1.topcard__title",
    ".jobs-unified-top-card h1",
    "h1.t-24",
    ".job-details-jobs-unified-top-card__job-title a",
  ],
  companyName: [
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".topcard__org-name-link",
    "a.ember-view.t-black.t-normal",
    ".jobs-unified-top-card__company-name a",
  ],
  location: [
    ".job-details-jobs-unified-top-card__bullet",
    ".topcard__flavor--bullet",
    ".jobs-unified-top-card__bullet",
    ".job-details-jobs-unified-top-card__primary-description-container .t-black--light",
  ],
  jobDescription: [
    ".jobs-description-content__text",
    ".jobs-description__content",
    ".jobs-box__html-content",
    "#job-details",
    ".description__text",
  ],
} as const;

/**
 * Attempts to find an element using multiple selectors.
 * Returns the first successful match.
 */
function queryWithFallback(selectors: readonly string[]): Element | null {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

/**
 * Cleans extracted text by removing excess whitespace,
 * normalizing line breaks, and trimming.
 */
function cleanText(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

/**
 * Main scraper function — extracts job posting data
 * from the current LinkedIn page DOM.
 *
 * @returns JobData if on a valid job page, null otherwise.
 */
export function scrapeLinkedInJob(): JobData | null {
  try {
    const titleEl = queryWithFallback(SELECTORS.jobTitle);
    const companyEl = queryWithFallback(SELECTORS.companyName);
    const locationEl = queryWithFallback(SELECTORS.location);
    const descriptionEl = queryWithFallback(SELECTORS.jobDescription);

    const jobTitle = cleanText(titleEl?.textContent);
    const companyName = cleanText(companyEl?.textContent);
    const location = cleanText(locationEl?.textContent);
    const jobDescription = cleanText(descriptionEl?.textContent);

    // Must have at least a title and description to be valid
    if (!jobTitle || !jobDescription) {
      console.warn("[JobHunt Scraper] Could not extract required fields from page.");
      return null;
    }

    return {
      jobTitle,
      companyName,
      location,
      jobDescription,
      linkedinJobUrl: window.location.href,
    };
  } catch (error) {
    console.error("[JobHunt Scraper] Error while scraping:", error);
    return null;
  }
}

/**
 * Checks if the current page is a LinkedIn job detail page.
 */
export function isLinkedInJobPage(): boolean {
  const url = window.location.href;
  return (
    url.includes("linkedin.com/jobs/view") ||
    url.includes("linkedin.com/jobs/collections") ||
    !!document.querySelector(".jobs-search__job-details")
  );
}
