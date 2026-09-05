import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Sparkles, 
  Database, 
  ArrowRight, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface LandingPageProps {
  onOpenSecurityModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenSecurityModal }) => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(
        err?.message || 'Google Sign-In was cancelled or failed. Please check your browser popup settings and retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Subtle Accent */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-100/40 via-stone-50 to-stone-50 pointer-events-none" />

      <div className="w-full max-w-4xl text-center">
        {/* Security Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3.5 py-1 text-xs font-medium text-amber-900 shadow-sm backdrop-blur mb-6">
          <Shield className="h-3.5 w-3.5 text-amber-700" />
          <span>Cloud Run AI Challenge Compliant • User Data Isolation</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 leading-tight">
          Reflect Deeply. Converse Freely.
          <span className="block text-amber-700 font-serif italic mt-1">
            Zero Data Bleed.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-stone-600 leading-relaxed">
          A secure, multi-turn AI journaling companion powered by{' '}
          <strong className="font-semibold text-stone-900">Gemini 3.6 Flash</strong> with a
          4-tier resilient fallback ladder and private, owner-isolated{' '}
          <strong className="font-semibold text-stone-900">Cloud Firestore</strong> storage.
        </p>

        {/* Error Alert if any */}
        {authError && (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-left text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Authentication Alert</p>
              <p className="mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Sign In CTA */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            id="google-signin-btn"
            onClick={handleSignIn}
            disabled={loading}
            className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-stone-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-stone-800 hover:shadow-md active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Connecting securely...
              </span>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign In with Google</span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </>
            )}
          </button>

          <button
            id="view-threat-model-btn"
            onClick={onOpenSecurityModal}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <Lock className="h-4 w-4 text-stone-500" />
            <span>Audit Security &amp; Directives</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-stone-900">
              Resilient Fallback Ladder
            </h3>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Powered by <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded font-mono">gemini-3.6-flash</code> with automated failover through <code className="text-stone-800 bg-stone-100 px-1 py-0.5 rounded font-mono">3.1-flash-lite</code> and <code className="text-stone-800 bg-stone-100 px-1 py-0.5 rounded font-mono">3.7-flash</code> to prevent outages.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-stone-900">
              Owner-Isolated Firestore
            </h3>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Every journal entry, summary, and conversation turn is stored under{' '}
              <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono">/users/{'{userId}'}/interactions</code>, protected by strict server-evaluated rules.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-stone-900">
              Zero Credential Leakage
            </h3>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Passwords are never collected. All Gemini AI requests execute server-side through Secret Manager credentials without exposing keys to client browsers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
