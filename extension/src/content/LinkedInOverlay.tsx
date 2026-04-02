/* ═══════════════════════════════════════════════════════
 * JobHunt — LinkedIn Overlay Panel
 * Floating glassmorphism analysis panel that appears
 * on LinkedIn job detail pages.
 *
 * Renders inside a Shadow DOM for complete CSS isolation.
 * Implements the "Cognitive Concierge" design philosophy:
 * - Atmospheric Depth (tonal layering, no harsh borders)
 * - Glassmorphism floating panel
 * - Gradient CTAs with inner-glow hover
 * - Progress Ring for match score visualization
 * ═══════════════════════════════════════════════════════ */

import { useState, useCallback } from "react";
import { scrapeLinkedInJob } from "@/lib/scraper";
import { sendToBackground } from "@/lib/messaging";
import { MessageType } from "@/types";
import type { JobData, MatchResult, SkillGap, AnalyzeJobResponse } from "@/types";

/* ─── State Types ─── */
type PanelState = "idle" | "loading" | "result" | "error";

export default function LinkedInOverlay() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>("idle");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  /* ─── Analyze Job Handler ─── */
  const handleAnalyze = useCallback(async () => {
    setPanelState("loading");
    setErrorMessage("");

    try {
      // Step 1: Scrape job data from LinkedIn DOM
      const scraped = scrapeLinkedInJob();
      if (!scraped) {
        throw new Error("Could not extract job details from this page.");
      }
      // Step 2: Send to background → API for AI analysis
      const response = await sendToBackground<JobData, AnalyzeJobResponse>(
        MessageType.ANALYZE_JOB,
        scraped
      );

      setMatchResult(response.matchResult);
      setSkillGaps(response.skillGaps);
      setPanelState("result");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Analysis failed";
      setErrorMessage(msg);
      setPanelState("error");
    }
  }, []);



  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-ambient-lg flex items-center justify-center hover:shadow-ambient-xl hover:scale-105 transition-all duration-normal ease-smooth"
        title="Open JobHunt Panel"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          work
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] font-body">
      {/* ═══ Floating Panel — Glassmorphism ═══ */}
      <div className="glass-panel rounded-xl overflow-hidden ghost-border">
        {/* ─── Panel Header ─── */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}
            >
              auto_awesome
            </span>
            <span className="font-headline font-bold text-sm text-on-surface tracking-tight">
              JobHunt AI
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-full hover:bg-surface-container-high/50 transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "18px" }}>
                {isMinimized ? "expand_less" : "expand_more"}
              </span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-surface-container-high/50 transition-colors"
              title="Close"
            >
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "18px" }}>
                close
              </span>
            </button>
          </div>
        </div>

        {/* ─── Panel Body (collapsible) ─── */}
        {!isMinimized && (
          <div className="px-4 pb-4">
            {/* ── Idle State: Analyze CTA ── */}
            {panelState === "idle" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: "32px" }}
                  >
                    psychology
                  </span>
                </div>
                <p className="text-body-md text-on-surface-variant mb-5">
                  Analyze this job posting against your CV skills.
                </p>
                <button onClick={handleAnalyze} className="btn-primary w-full flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    auto_awesome
                  </span>
                  Analyze Match
                </button>
              </div>
            )}

            {/* ── Loading State ── */}
            {panelState === "loading" && (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-body-md text-on-surface-variant">
                  AI is analyzing your match...
                </p>
              </div>
            )}

            {/* ── Result State: Match Score + Skill Gap ── */}
            {panelState === "result" && matchResult && (
              <div className="space-y-4">
                {/* Match Score Ring */}
                <div className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl">
                  <ProgressRing score={matchResult.matchScore} size={64} />
                  <div className="flex-1">
                    <p className="font-headline font-bold text-on-surface text-lg leading-tight">
                      {matchResult.matchScore}% Match
                    </p>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      {matchResult.summary}
                    </p>
                  </div>
                </div>

                {/* Matched Skills */}
                {matchResult.matchedSkills.length > 0 && (
                  <div>
                    <p className="font-label text-label-sm font-bold text-on-surface-variant uppercase tracking-[0.05em] mb-2">
                      Your Strengths
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.matchedSkills.map((skill) => (
                        <span key={skill} className="chip-match">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Gaps */}
                {skillGaps.length > 0 && (
                  <div>
                    <p className="font-label text-label-sm font-bold text-on-surface-variant uppercase tracking-[0.05em] mb-2">
                      Skill Gap
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGaps.map((gap) => (
                        <span key={gap.skill} className="chip-gap">{gap.skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setPanelState("idle"); setMatchResult(null); setSkillGaps([]); }}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      refresh
                    </span>
                    Re-analyze Posisi Ini
                  </button>
                </div>
              </div>
            )}



            {/* ── Error State ── */}
            {panelState === "error" && (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-error-container/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-error" style={{ fontSize: "28px" }}>
                    error
                  </span>
                </div>
                <p className="text-body-md text-on-surface-variant mb-4">{errorMessage}</p>
                <button onClick={handleAnalyze} className="btn-primary w-full py-2.5 text-sm">
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Progress Ring Component
 * SVG circular progress indicator for match score.
 * Uses secondary (Emerald Green) for the active stroke.
 * ───────────────────────────────────────────── */
function ProgressRing({ score, size = 64 }: { score: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(102, 221, 139, 0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Active stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#006d36"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-slow ease-smooth"
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-headline font-bold text-sm text-on-surface">
          {score}%
        </span>
      </div>
    </div>
  );
}
