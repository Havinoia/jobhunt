import React, { useState, useEffect, useCallback, useRef, Fragment } from "react";
import type {
  User,
  UsageInfo,
  ResumeProfile,
} from "@/types";
import { MessageType } from "@/types";
import { sendToBackground } from "@/lib/messaging";
import { getSkillName } from "@/lib/utils";
import * as api from "@/lib/api";

/* ═══════════════════════════════════════════════════════
 * JobHunt — Popup Shell (Fully Functional)
 * ═══════════════════════════════════════════════════════ */

type NavTab = "home" | "skills" | "settings" | "profile";

/**
 * UsageResetTimer — A live ticking countdown until usage resets.
 */
const UsageResetTimer = ({ resetAt }: { resetAt: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Handle both camelCase from updated backend and possible snake_case from cache
      const targetTime = resetAt; 
      if (!targetTime) return "--:--:--";
      
      const target = new Date(targetTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) return "Resetting...";

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [resetAt]);

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-2">
      <svg className="w-3 h-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      Resets in <span className="text-primary font-black tabular-nums">{timeLeft}</span> (WIB)
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");

  /* ─── Auth State ─── */
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageInfo>({ 
    used: 0, 
    limit: 5, 
    remaining: 5, 
    resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString() 
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  /* ─── Resume State ─── */
  const [resume, setResume] = useState<ResumeProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  /* ─── Boot: Check auth ─── */
  useEffect(() => {
    (async () => {
      try {
        const token = await api.getAuthToken();
        if (token) {
          const userData = await api.getCurrentUser();
          setUser(userData);
          if (userData.usage) setUsage(userData.usage);
          // Load resume if exists
          try {
            const res = await api.getResumeSkills();
            setResume(res);
          } catch { /* no resume yet */ }
        }
      } catch {
        // Not logged in
      } finally {
        setIsAuthLoading(false);
      }
    })();
  }, []);

  /* ─── Login Handler ─── */
  const handleLogin = useCallback(async () => {
    setAuthError("");
    try {
      const result = await sendToBackground<void, { success: boolean; error?: string }>(
        MessageType.LOGIN_WITH_GOOGLE,
        undefined as never
      );
      if (result.success) {
        const userData = await api.getCurrentUser();
        setUser(userData);
        if (userData.usage) setUsage(userData.usage);
        try {
          const res = await api.getResumeSkills();
          setResume(res);
        } catch { /* no resume */ }
      } else {
        setAuthError(result.error || "Google sign-in was cancelled or failed. Check your Google OAuth configuration.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Login failed");
    }
  }, []);

  /* ─── Logout Handler ─── */
  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch { /* ignore */ }
    setUser(null);
    setResume(null);
  }, []);

  /* ─── CV Upload Handler ─── */
  const handleUploadCV = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError("");
    try {
      const res = await api.uploadResume(file);
      setResume(res);
      // Refresh usage
      const userData = await api.getCurrentUser();
      if (userData.usage) setUsage(userData.usage);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  /* ─── Premium Upgrade Handler ─── */
  const handleUpgrade = useCallback(async () => {
    setIsUpgrading(true);
    try {
      const res = await api.checkoutPremium();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) chrome.tabs.update(tabs[0].id, { url: res.redirect_url });
      });
    } catch {
      alert("Failed to initiate checkout. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  }, []);

  /* ═══ RENDER ═══ */

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="w-[420px] h-[560px] bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          error={authError}
          onShowEmailAuth={() => setShowEmailAuth(true)}
        />
        {showEmailAuth && <EmailAuthModal onClose={() => setShowEmailAuth(false)} />}
      </>
    );
  }

  return (
    <div className="w-[420px] h-[560px] bg-surface flex flex-col overflow-hidden">
      {/* ═══ Header ═══ */}
      <header className="glass-header sticky top-0 z-50 flex justify-between items-center w-full px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-black tracking-tight text-primary font-headline">
            JobHunt
          </span>
          <button 
            onClick={() => setShowPremiumModal(true)}
            className="flex items-center hover:opacity-80 active:scale-95 transition-all"
          >
            {user.tier?.toLowerCase() === 'premium' ? (
              <span className="premium-badge-gold">
                <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
                Premium
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase text-on-surface-variant/50 bg-surface-container-high ring-1 ring-outline-variant/10">
                {user.tier}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab("profile")}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all"
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-on-primary text-[11px] font-bold">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === "home" && (
          <HomeTab
            user={user}
            usage={usage}
            resume={resume}
            isUploading={isUploading}
            uploadError={uploadError}
            onUploadCV={handleUploadCV}
            onRemoveCV={async () => {
              try {
                await api.deleteResume();
                setResume(null);
              } catch { /* ignore error on removal */ }
            }}
          />
        )}
        {activeTab === "skills" && (
          <SkillsTab resume={resume} />
        )}
        {activeTab === "settings" && (
          <SettingsTab 
            user={user} 
            usage={usage} 
            onLogout={handleLogout} 
            onTabChange={setActiveTab} 
            isUpgrading={isUpgrading}
            onUpgrade={handleUpgrade}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab user={user} onUpdateUser={(updated) => setUser({ ...user, ...updated })} />
        )}
      </main>

      {/* ═══ Premium comparison Modal ═══ */}
      {showPremiumModal && (
        <PremiumModal 
          onClose={() => setShowPremiumModal(false)} 
          currentTier={user.tier} 
          isUpgrading={isUpgrading}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* ═══ Bottom Navigation ═══ */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * Login Screen
 * ═══════════════════════════════════════════════════════ */
function LoginScreen({ onLogin, error, onShowEmailAuth }: { onLogin: () => void; error: string; onShowEmailAuth: () => void }) {
  return (
    <div className="w-[420px] h-[560px] bg-surface flex flex-col items-center justify-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-on-primary" style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}>
          work
        </span>
      </div>
      <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-2 text-center">
        Welcome to JobHunt
      </h1>
      <p className="text-body-md text-on-surface-variant text-center mb-8 leading-relaxed">
        AI-powered skill matching & job tracking for LinkedIn.
      </p>
      <button onClick={onLogin} className="btn-primary w-full flex items-center justify-center gap-3 py-3.5">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.5-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Sign in with Google
      </button>
      <button onClick={onShowEmailAuth} className="btn-secondary w-full flex items-center justify-center gap-3 py-3.5 mt-3">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
        Sign in with Email
      </button>
      {error && (
        <p className="text-body-sm text-error mt-4 text-center px-4 py-2 bg-error/10 rounded-lg border border-error/20">
          {error}
        </p>
      )}
      <p className="text-[10px] text-on-surface-variant/40 mt-8 text-center">
        We only access your name & email for authentication.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * Email Auth Modal — Registration, Verification & Login
 * ═══════════════════════════════════════════════════════ */
function EmailAuthModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'register' | 'verify' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    setLoading(true);
    try {
      await api.register(name.trim(), email, password);
      setStep('verify');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      await api.verify(email, code);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await api.loginEmail(email, password);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-surface rounded-2xl shadow-ambient-lg w-[380px] p-6 mx-4">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-headline font-bold text-on-surface">
            {step === 'register' ? 'Create Account' : step === 'verify' ? 'Verify Email' : 'Welcome Back'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {step === 'register' && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password (min 8 chars, include @!# etc)"
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button onClick={handleRegister} disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Registering...' : 'Register'}
            </button>
            <p className="text-center text-body-sm text-on-surface-variant">
              Already have an account?{' '}
              <button type="button" onClick={() => { setStep('login'); setError(''); }} className="text-primary font-semibold hover:underline">
                Log in
              </button>
            </p>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface-variant">Enter the 6-digit code sent to <strong>{email}</strong></p>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm text-center tracking-[0.5em] font-mono font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <button onClick={handleVerify} disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </div>
        )}

        {step === 'login' && (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button onClick={handleLogin} disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="text-center text-body-sm text-on-surface-variant">
              Don't have an account?{' '}
              <button type="button" onClick={() => { setStep('register'); setError(''); }} className="text-primary font-semibold hover:underline">
                Register
              </button>
            </p>
          </div>
        )}

        {error && (
          <p className="text-body-sm text-error mt-3 text-center px-3 py-2 bg-error/10 rounded-lg border border-error/20">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * Home Tab — CV Upload + Usage
 * ═══════════════════════════════════════════════════════ */
interface HomeTabProps {
  user: User;
  usage: UsageInfo;
  resume: ResumeProfile | null;
  isUploading: boolean;
  uploadError: string;
  onUploadCV: (file: File) => void;
  onRemoveCV: () => void;
}

function HomeTab({ user, usage, resume, isUploading, uploadError, onUploadCV, onRemoveCV }: HomeTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await api.checkoutPremium();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) chrome.tabs.update(tabs[0].id, { url: res.redirect_url });
      });
    } catch {
      alert("Failed to initiate checkout. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleGenerate = () => {
    if (selectedFile) {
      onUploadCV(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="px-5 py-5 space-y-5">
      {/* ─── CV Upload Section ─── */}
      <section>
        <h2 className="font-headline font-bold text-lg text-on-surface mb-3">
          {resume ? "Your Resume" : "Upload Your CV"}
        </h2>

        {(!resume || selectedFile) ? (
          <>
            {/* File Selector */}
            <div
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-normal ease-smooth ${
                selectedFile
                  ? "border-primary/40 bg-primary/5"
                  : "border-outline-variant/40 cursor-pointer hover:border-primary/50 hover:bg-primary/5 group"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <p className="text-body-md text-on-surface-variant">Extracting skills with AI...</p>
                  <p className="text-body-sm text-on-surface-variant/60">This uses 1 daily credit</p>
                </div>
              ) : selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "24px" }}>
                      description
                    </span>
                  </div>
                  <p className="font-body font-bold text-sm text-on-surface truncate max-w-full">
                    {selectedFile.name}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {(selectedFile.size / 1024).toFixed(0)} KB · Ready to analyze
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); fileInputRef.current?.click(); }}
                    className="text-primary text-body-sm font-semibold hover:underline"
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "28px" }}>
                      upload_file
                    </span>
                  </div>
                  <p className="text-body-md font-medium text-on-surface mb-1">
                    Click to upload your CV
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    PDF format, max 2MB
                  </p>
                </>
              )}
            </div>

            {/* Generate Button — only shows after file is selected */}
            {selectedFile && !isUploading && (
              <button
                onClick={handleGenerate}
                className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                Generate AI Analysis
                <span className="text-on-primary/60 text-xs ml-1">(1 credit)</span>
              </button>
            )}
          </>
        ) : (
          /* Resume Loaded */
          <div className="bg-secondary-fixed/10 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-on-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-bold text-sm text-on-surface truncate">
                {resume.originalFilename}
              </p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                  {resume.report?.analysis_metadata.career_level || "Junior"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary-fixed/20 text-on-secondary-container uppercase">
                  {resume.report?.analysis_metadata.primary_domain || "General"}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (resume.pdf_url) {
                  window.open(resume.pdf_url, '_blank');
                } else {
                  alert("This is an older analysis. Please re-upload your CV to view the original PDF file.");
                  // Fallback for now if they still want the analysis
                  window.open(`http://localhost:8000/resume/${resume.id}`, '_blank');
                }
              }}
              className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>
              View Detail
            </button>
            <button
              onClick={onRemoveCV}
              className="p-1.5 rounded-full hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors flex-shrink-0 ml-1"
              title="Remove CV"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                close
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
        {uploadError && (
          <p className="text-body-sm text-error mt-2">{uploadError}</p>
        )}
      </section>

      {/* ─── Usage Quota ─── */}
      <section className="bg-primary/5 ghost-border rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-editorial">
            Daily AI Usage
          </span>
          <span className="text-label-sm font-bold text-primary">
            {usage.remaining > 0 ? `${usage.used} of ${usage.limit} used` : "Daily limit reached"}
          </span>
        </div>
        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-primary h-full rounded-full transition-all duration-slow ease-smooth"
            style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
          />
        </div>
        
        <UsageResetTimer resetAt={usage.resetAt} />

        <p className="text-body-sm text-on-surface-variant mb-3">
          {usage.remaining > 0
            ? `${usage.remaining} analysis${usage.remaining !== 1 ? "es" : ""} remaining today.`
            : "Daily limit reached!"}
          {user.tier?.toLowerCase() === "freemium" && " Upgrade for 20x daily."}
        </p>
        {user.tier === "freemium" && (
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className={`w-full bg-on-primary-fixed text-white flex items-center justify-center gap-2 py-2.5 rounded-lg text-title-sm shadow-ambient-sm transition-all duration-normal ease-smooth ${
              isUpgrading ? "opacity-70 cursor-not-allowed" : "hover:shadow-ambient-md hover:brightness-105"
            }`}
          >
            {isUpgrading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
            )}
            {isUpgrading ? "Processing..." : "Upgrade Rp 40.000/bulan"}
          </button>
        )}
      </section>

      {/* ─── Recommended Jobs (LinkedIn Search) ─── */}
      {resume && (resume.report?.job_recommendations ?? []).length > 0 && (
        <RecommendedJobs recommendations={resume.report!.job_recommendations} />
      )}
 
      {/* ─── Gap Analysis ─── */}
      {resume && (resume.report?.skill_gap_analysis?.missing_common_skills ?? []).length > 0 && (
        <GapAnalysis gapData={resume.report!.skill_gap_analysis} />
      )}

      {/* ─── Skills Preview ─── */}
      {resume && resume.extractedSkills?.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-3">
            <h2 className="font-headline font-bold text-lg text-on-surface">
              Your Skills
            </h2>
            <span className="text-label-sm font-semibold text-primary">
              {resume.extractedSkills.length} total
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {resume.extractedSkills.slice(0, 12).map((skill) => {
              const name = getSkillName(skill);
              return (
                <span key={name} className="bg-secondary-fixed/20 text-on-secondary-container px-2.5 py-1 rounded-md text-xs font-semibold">
                  {name}
                </span>
              );
            })}
            {resume.extractedSkills.length > 12 && (
              <span className="text-body-sm text-on-surface-variant/60 self-center ml-1">
                +{resume.extractedSkills.length - 12} more
              </span>
            )}
          </div>
        </section>
      )}

      {/* ─── How it works ─── */}
      {!resume && (
        <section className="space-y-3">
          <h2 className="font-headline font-bold text-lg text-on-surface">How it works</h2>
          {[
            { icon: "upload_file", title: "Upload CV", desc: "Upload your resume PDF" },
            { icon: "psychology", title: "AI Extracts Skills", desc: "AI reads & identifies your expertise" },
            { icon: "work", title: "Match on LinkedIn", desc: "Get instant match scores on job pages" },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-surface-container-lowest rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
                  {step.icon}
                </span>
              </div>
              <div>
                <p className="font-body font-bold text-sm text-on-surface">{step.title}</p>
                <p className="text-body-sm text-on-surface-variant">{step.desc}</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * Recommended Jobs — LinkedIn Job Search Based on Skills
 * ═══════════════════════════════════════════════════════ */
function buildLinkedInSearchUrl(keywords: string): string {
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&refresh=true`;
}

function RecommendedJobs({ recommendations }: { recommendations: NonNullable<ResumeProfile['report']>['job_recommendations'] }) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const handleOpenSearch = (keywords: string[]) => {
    const url = buildLinkedInSearchUrl(keywords.join(" "));
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) chrome.tabs.update(tabs[0].id, { url });
    });
  };

  const handleMessageHR = (keywords: string[]) => {
    const recruiterUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords.join(" ") + " recruiter")}&origin=GLOBAL_SEARCH_HEADER`;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) chrome.tabs.update(tabs[0].id, { url: recruiterUrl });
    });
  };

  return (
    <section>
      <div className="flex justify-between items-end mb-3">
        <h2 className="font-headline font-bold text-lg text-on-surface">
          Recommended Roles
        </h2>
        <span className="text-label-sm font-semibold text-primary uppercase tracking-editorial">
          AI Audit
        </span>
      </div>

      <div className="space-y-2.5">
        {recommendations.map((recommendation, idx) => (
          <div
            key={idx}
            className="bg-surface-container-lowest ghost-border rounded-xl overflow-hidden transition-all duration-normal ease-smooth hover:shadow-ambient-md"
          >
            {/* Card Header */}
            <button
              onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
              className="w-full flex items-center gap-3 p-3.5 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
                  military_tech
                </span>
                <div className="absolute -top-1 -right-1 bg-primary text-[8px] text-on-primary font-bold px-1 rounded-full">
                  {recommendation.relevance_score}%
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-bold text-sm text-on-surface truncate">
                  {recommendation.role_title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold uppercase ${
                    recommendation.market_demand === 'High' ? 'text-secondary' : 'text-on-surface-variant/60'
                  }`}>
                    {recommendation.market_demand} Demand
                  </span>
                </div>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant/40 transition-transform duration-normal"
                style={{
                  fontSize: "20px",
                  transform: expandedCard === idx ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                expand_more
              </span>
            </button>

            {/* Expanded Content */}
            {expandedCard === idx && (
              <div className="px-3.5 pb-3.5 space-y-3 animate-[fadeIn_200ms_ease]">
                <div className="bg-surface-container/30 p-2.5 rounded-lg text-[11px] leading-relaxed text-on-surface-variant italic">
                  "{recommendation.logic_reasoning}"
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenSearch(recommendation.search_keywords)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-semibold hover:brightness-110 transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>work</span>
                    Jobs
                  </button>
                  <button
                    onClick={() => handleMessageHR(recommendation.search_keywords)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-container text-on-surface-variant text-body-sm font-semibold hover:bg-surface-container-high transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>mail</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GapAnalysis({ gapData }: { gapData: NonNullable<ResumeProfile['report']>['skill_gap_analysis'] }) {
  return (
    <section className="bg-error-container/10 ghost-border rounded-xl p-4 border-error/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-error" style={{ fontSize: "20px" }}>warning</span>
        <h2 className="font-headline font-bold text-lg text-on-surface">Skill Gap Audit</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold text-error uppercase tracking-wider mb-2">Missing Benchmarks</p>
          <div className="flex flex-wrap gap-1.5">
            {gapData.missing_common_skills.map(skill => {
              const skillName = getSkillName(skill);
              return (
                <span key={skillName} className="px-2 py-0.5 bg-error-container/20 text-on-error-container rounded text-[10px] font-semibold">
                  {skillName}
                </span>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white/40 p-3 rounded-lg">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Growth Path</p>
          <p className="text-body-sm text-on-surface-variant leading-relaxed">
            {gapData.upskilling_suggestion}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
 * Skills Tab
 * ═══════════════════════════════════════════════════════ */
function SkillsTab({ resume }: { resume: ResumeProfile | null }) {
  if (!resume || !resume.report) {
    return (
      <div className="px-5 py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant/40" style={{ fontSize: "32px" }}>
            psychology
          </span>
        </div>
        <p className="text-body-md text-on-surface-variant px-10">
          Upload your CV to see your <strong>Deep Skills Audit</strong>.
        </p>
      </div>
    );
  }

  const { extracted_data } = resume.report;

  const SkillSection = ({ title, icon, skills }: { title: string; icon: string; skills: (string | { name: string; confidence: number })[] }) => {
    if (!skills || skills.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary/40" style={{ fontSize: "18px" }}>{icon}</span>
          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-on-surface-variant/70 italic">{title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => {
            const name = getSkillName(skill);
            return (
              <span key={name} className="bg-surface-container-lowest ghost-border px-3 py-1.5 rounded-lg text-body-sm font-medium text-on-surface">
                {name}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="px-5 py-6">
      <header className="mb-8">
        <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">Skills Audit</h2>
        <p className="text-body-sm text-on-surface-variant italic">Comprehensive mapping for your profile</p>
      </header>

      <SkillSection title="Hard Core Skills" icon="terminal" skills={extracted_data.skills_hard} />
      <SkillSection title="Software & Tools" icon="tactic" skills={extracted_data.tools_and_apps} />
      <SkillSection title="Soft & Cultural" icon="diversity_3" skills={extracted_data.skills_soft} />
      <SkillSection title="Credentials" icon="verified" skills={extracted_data.credentials} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * Settings Tab
 * ═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
 * Profile Tab — Identity & Security
 * ═══════════════════════════════════════════════════════ */
function ProfileTab({ user, onUpdateUser }: { user: User; onUpdateUser: (updated: Partial<User>) => void }) {
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [passwordStep, setPasswordStep] = useState<'idle' | 'requesting' | 'confirming'>('idle');
  const [passCode, setPassCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passMessage, setPassMessage] = useState('');
  const [isPassLoading, setIsPassLoading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdatingAvatar(true);
    setAvatarError("");
    try {
      const res = await api.updateAvatar(file);
      onUpdateUser({ avatar_url: res.avatar_url });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to update avatar");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleRequestPassCode = async () => {
    setIsPassLoading(true);
    setPassError("");
    setPassMessage("");
    try {
      await api.requestPasswordChange();
      setPasswordStep('confirming');
      setPassMessage("Verification code sent to your email.");
    } catch (err) {
      setPassError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsPassLoading(false);
    }
  };

  const handleConfirmPassChange = async () => {
    if (newPassword.length < 8) {
      setPassError("Password must be at least 8 characters");
      return;
    }
    setIsPassLoading(true);
    setPassError("");
    try {
      await api.confirmPasswordChange(passCode, newPassword);
      setPassMessage("Password changed successfully!");
      setPasswordStep('idle');
      setPassCode('');
      setNewPassword('');
    } catch (err) {
      setPassError(err instanceof Error ? err.message : "Change failed");
    } finally {
      setIsPassLoading(false);
    }
  };

  return (
    <div className="px-5 py-6 space-y-8 animate-[fadeIn_300ms_ease]">
      <header>
        <h2 className="font-headline font-bold text-2xl text-on-surface mb-1">Your Profile</h2>
        <p className="text-body-sm text-on-surface-variant italic">Manage your identity and security</p>
      </header>

      {/* Identity Section */}
      <section className="bg-surface-container-lowest ghost-border rounded-2xl p-5 flex flex-col items-center">
        <div className="relative group mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center overflow-hidden shadow-ambient-lg ring-4 ring-white">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-on-primary text-3xl font-bold">
                {user.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
            {isUpdatingAvatar && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              </div>
            )}
          </div>
          <button 
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_camera</span>
          </button>
          <input ref={avatarInputRef} type="file" hidden accept="image/*" onChange={handleAvatarChange} />
        </div>

        <div className="text-center">
          <h3 className="font-body font-bold text-lg text-on-surface leading-tight">{user.name}</h3>
          <p className="text-body-sm text-on-surface-variant">{user.email}</p>
          {avatarError && <p className="text-[10px] text-error font-bold mt-2">{avatarError}</p>}
        </div>
      </section>

      {/* Security Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary/40" style={{ fontSize: '20px' }}>security</span>
          <h3 className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70 italic">Security Controls</h3>
        </div>

        <div className="bg-surface-container-lowest ghost-border rounded-xl p-4">
          {passwordStep === 'idle' ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Update Password</p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">Verification code will be sent to your email.</p>
              </div>
              <button 
                onClick={handleRequestPassCode}
                disabled={isPassLoading}
                className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                {isPassLoading ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary animate-spin rounded-full" />
                ) : (
                  "Change"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3 animate-[fadeIn_200ms_ease]">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold text-on-surface italic">Account Verification Required</p>
                <button onClick={() => setPasswordStep('idle')} className="text-[10px] text-on-surface-variant/40 hover:text-error transition-colors uppercase font-bold">Cancel</button>
              </div>
              
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase ml-1">6-Digit Code</label>
                  <input 
                    type="text" 
                    placeholder="000000"
                    maxLength={6}
                    value={passCode}
                    onChange={(e) => setPassCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container/50 border border-outline-variant/20 text-sm font-mono text-center tracking-[0.4em] focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase ml-1">New Password</label>
                  <input 
                    type="password" 
                    placeholder="Min 8 chars + symbol"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container/50 border border-outline-variant/20 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button 
                  onClick={handleConfirmPassChange}
                  disabled={isPassLoading || passCode.length !== 6 || newPassword.length < 8}
                  className="w-full btn-primary py-2.5 text-xs font-bold shadow-ambient-md disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all"
                >
                  {isPassLoading ? "Processing..." : "Update Password"}
                </button>
              </div>
            </div>
          )}
          
          {passError && (
            <p className="mt-3 px-3 py-2 bg-error/10 text-error text-[10px] font-bold rounded border border-error/20 italic">
              🚨 {passError}
            </p>
          )}
          {passMessage && !passError && (
            <p className="mt-3 px-3 py-2 bg-secondary/10 text-secondary text-[10px] font-bold rounded border border-secondary/20 italic">
              ✨ {passMessage}
            </p>
          )}
        </div>
      </section>

      <div className="pt-4 text-center">
        <button onClick={() => setPasswordStep('idle')} className="text-[10px] text-on-surface-variant/40 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>help</span>
          Email changes are restricted for security.
        </button>
      </div>
    </div>
  );
}

function SettingsTab({ user, usage, onLogout, onTabChange, isUpgrading, onUpgrade }: { 
  user: User; 
  usage: UsageInfo; 
  onLogout: () => void; 
  onTabChange: (tab: NavTab) => void;
  isUpgrading: boolean;
  onUpgrade: () => void;
}) {

  return (
    <div className="px-5 py-5 space-y-5">
      {/* Profile Card */}
      <button 
        onClick={() => onTabChange("profile")}
        className="w-full text-left bg-surface-container-lowest ghost-border rounded-xl p-4 flex items-center gap-3 hover:bg-surface-container-low transition-colors group"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm ring-2 ring-white">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-on-primary text-lg font-bold">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-bold text-on-surface truncate group-hover:text-primary transition-colors">{user.name}</p>
          <p className="text-body-sm text-on-surface-variant truncate">{user.email}</p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary/50 transition-all group-hover:translate-x-0.5" style={{ fontSize: '20px' }}>
          chevron_right
        </span>
      </button>

      {/* Plan & Usage */}
      <div className="bg-surface-container-lowest ghost-border rounded-xl p-4">
        <h3 className="font-body font-bold text-sm text-on-surface mb-3">Plan & Usage</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">Current Plan</span>
            <span className="text-on-surface font-semibold capitalize">{user.tier}</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">Today's Usage</span>
            <span className="text-on-surface font-semibold">
              {usage.remaining > 0 ? `${usage.used} / ${usage.limit}` : "Limit reached"}
            </span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">Remaining</span>
            <span className={`font-semibold ${usage.remaining > 0 ? "text-secondary" : "text-error"}`}>
              {usage.remaining}
            </span>
          </div>
        </div>
      </div>

      {/* Premium Upgrade */}
      {user.tier === "freemium" && (
        <div className="bg-gradient-to-br from-primary/10 to-primary-container/10 ghost-border rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "24px" }}>
              workspace_premium
            </span>
            <div>
              <p className="font-body font-bold text-on-surface">Go Premium</p>
              <p className="text-body-sm text-on-surface-variant">Unlimited AI analyses, priority support.</p>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className={`w-full bg-on-primary-fixed text-white flex items-center justify-center gap-2 py-2.5 rounded-lg text-title-sm shadow-ambient-sm transition-all duration-normal ease-smooth ${
              isUpgrading ? "opacity-70 cursor-not-allowed" : "hover:shadow-ambient-md hover:brightness-105"
            }`}
          >
            {isUpgrading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            )}
            {isUpgrading ? "Processing..." : "Upgrade Rp 40.000/bulan"}
          </button>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-error text-title-sm font-semibold hover:bg-error-container/20 transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>logout</span>
        Sign Out
      </button>

      {/* Footer */}
      <p className="text-[10px] text-on-surface-variant/40 text-center pt-2">
        JobHunt v1.0.0 · AI-powered by Google Gemini
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * Bottom Navigation
 * ═══════════════════════════════════════════════════════ */
const NAV_ITEMS: { id: NavTab; icon: string; label: string }[] = [
  { id: "home", icon: "home", label: "Home" },
  { id: "skills", icon: "psychology", label: "Skills" },
  { id: "settings", icon: "settings", label: "Settings" },
];

function BottomNav({ activeTab, onTabChange }: { activeTab: NavTab; onTabChange: (tab: NavTab) => void }) {
  return (
    <nav className="flex justify-around items-center bg-surface py-2 ghost-border flex-shrink-0">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-0.5 transition-all duration-normal ease-smooth active:scale-95 ${
              isActive
                ? "text-primary font-bold"
                : "text-on-surface-variant/60 hover:text-primary/80"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                fontSize: "22px",
              }}
            >
              {item.icon}
            </span>
            <span className="font-label text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════
 * Premium info Modal
 * ═══════════════════════════════════════════════════════ */
function PremiumModal({ onClose, currentTier, isUpgrading, onUpgrade }: { 
  onClose: () => void; 
  currentTier: string;
  isUpgrading: boolean;
  onUpgrade: () => void;
}) {
  const features = [
    { name: "Daily AI Scans", free: "5 per day", premium: "20 per day", icon: "query_stats" },
    { name: "Skills Analysis", free: "Basic matching", premium: "Deep domain audit", icon: "psychology" },
    { name: "Career Insights", free: "Standard speed", premium: "Ultra-fast response", icon: "rocket_launch" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-[fadeIn_200ms_ease]">
      <div className="bg-surface rounded-3xl shadow-ambient-lg w-full max-w-[380px] overflow-hidden border border-outline-variant/10">
        <header className="px-6 py-5 bg-gradient-to-br from-surface to-surface-container-low flex justify-between items-center border-b border-outline-variant/10">
          <div>
            <h2 className="text-lg font-headline font-black text-on-surface">Plan Comparison</h2>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-0.5 italic">Upgrade Your Career</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>close</span>
          </button>
        </header>

        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
          {/* Comparison Table */}
          <div className="grid grid-cols-5 gap-y-5">
            <div className="col-span-2"></div>
            <div className="col-span-1.5 text-center text-[10px] font-black tracking-widest uppercase text-on-surface-variant/40 italic">Freemium</div>
            <div className="col-span-1.5 text-center text-[10px] font-black tracking-widest uppercase text-primary/80 italic">Premium</div>

            {features.map((f, i) => (
              <Fragment key={i}>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline" style={{ fontSize: '16px' }}>{f.icon}</span>
                  <span className="text-[11px] font-bold text-on-surface">{f.name}</span>
                </div>
                <div className="col-span-1.5 flex justify-center items-center">
                  <span className="text-[10px] font-medium text-on-surface-variant/60">{f.free}</span>
                </div>
                <div className="col-span-1.5 flex justify-center items-center">
                  <span className="text-[10px] font-bold text-secondary">{f.premium}</span>
                </div>
              </Fragment>
            ))}
          </div>

          <div className="bg-primary/5 rounded-2xl p-4 ghost-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>stars</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Unlimited Access</p>
                <p className="text-[10px] text-on-surface-variant">Unlock the full power of our Cognitive Engine.</p>
              </div>
            </div>
          </div>
        </div>

        {currentTier !== 'premium' && (
          <div className="px-6 py-5 bg-surface-container-lowest">
            <button 
              onClick={onUpgrade}
              disabled={isUpgrading}
              className="btn-primary w-full py-3.5 shadow-ambient-md text-sm flex items-center justify-center gap-2"
            >
              {isUpgrading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              )}
              {isUpgrading ? "Processing..." : "Upgrade Rp 40.000/bulan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
