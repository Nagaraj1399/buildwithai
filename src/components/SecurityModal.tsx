import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Terminal, 
  Lock, 
  FileCode, 
  CheckCircle, 
  Copy, 
  AlertTriangle 
} from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'threats' | 'rules' | 'deploy' | 'owasp'>('threats');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Isolated user profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Isolated user interactions (entries, chat turns, AI reflections)
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Isolated user reflections
      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Default deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

  const cloudRunDeploySnippet = `# 1. Enable Google Cloud APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com

# 2. Configure Secret Manager for GEMINI_API_KEY
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Cloud Run Service Account Access
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \\
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor"

# 4. Deploy service to Cloud Run with Campaign Labeling
gcloud run deploy gemini-reflection-app \\
  --source . \\
  --region asia-southeast1 \\
  --allow-unauthenticated \\
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \\
  --update-labels=dev-tutorial=cloud-run-ai-challenge`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-stone-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-stone-900">
                Production Directives &amp; Threat Model
              </h2>
              <p className="text-xs text-stone-500">
                OWASP Top 10 • Agentic Threat Matrix • Cloud Run Verification
              </p>
            </div>
          </div>
          <button
            id="close-security-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('threats')}
            className={`py-3 px-3 border-b-2 font-medium transition ${
              activeTab === 'threats'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            5 Threat Zones Analysis
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-3 border-b-2 font-medium transition ${
              activeTab === 'rules'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Firestore Rules
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-3 px-3 border-b-2 font-medium transition ${
              activeTab === 'deploy'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Cloud Run Deployment
          </button>
          <button
            onClick={() => setActiveTab('owasp')}
            className={`py-3 px-3 border-b-2 font-medium transition ${
              activeTab === 'owasp'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            OWASP Defenses
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 text-stone-700 text-xs leading-relaxed space-y-4">
          {activeTab === 'threats' && (
            <div className="space-y-4">
              <p className="text-stone-600">
                Structured agentic threat modeling mapping risks to countermeasures across the five core application zones:
              </p>
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-800 font-semibold">
                    <tr>
                      <th className="p-3">Threat Zone</th>
                      <th className="p-3">Identified Attack Scenario</th>
                      <th className="p-3">Countermeasure &amp; Defensive Standard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr className="hover:bg-stone-50/50">
                      <td className="p-3 font-semibold text-stone-900 whitespace-nowrap">
                        1. Input Surfaces
                      </td>
                      <td className="p-3 text-stone-600">
                        Oversized prompt injections, JSON poisoning, or malicious script tags submitted in reflection content.
                      </td>
                      <td className="p-3 text-stone-700">
                        Defensive null-safe body parsing, payload sanitization, 10,000 char bounding, and zero-crash undefined-stripping.
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50/50">
                      <td className="p-3 font-semibold text-stone-900 whitespace-nowrap">
                        2. Planning &amp; Reasoning
                      </td>
                      <td className="p-3 text-stone-600">
                        Indirect prompt injection attempting to override system behavior or exfiltrate model configuration.
                      </td>
                      <td className="p-3 text-stone-700">
                        Framing user input strictly as narrative reflection; strict delimiters in system instruction to isolate commands from data.
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50/50">
                      <td className="p-3 font-semibold text-stone-900 whitespace-nowrap">
                        3. Tool &amp; Server Execution
                      </td>
                      <td className="p-3 text-stone-600">
                        Unauthorized API invocation, SSRF, or credential escalation at backend endpoints.
                      </td>
                      <td className="p-3 text-stone-700">
                        Strict internal proxying via <code className="bg-stone-100 px-1 py-0.5 rounded">/api/reflect</code> with zero client access to Gemini secrets.
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50/50">
                      <td className="p-3 font-semibold text-stone-900 whitespace-nowrap">
                        4. Memory &amp; State
                      </td>
                      <td className="p-3 text-stone-600">
                        Cross-user interaction reading, unauthenticated writes, or orphaned journal records in Firestore.
                      </td>
                      <td className="p-3 text-stone-700">
                        Owner-bound Firestore security rules (<code className="bg-stone-100 px-1 py-0.5 rounded">request.auth.uid == userId</code>), zero insecure defaults, and verified atomic persistence.
                      </td>
                    </tr>
                    <tr className="hover:bg-stone-50/50">
                      <td className="p-3 font-semibold text-stone-900 whitespace-nowrap">
                        5. Inter-System Comm
                      </td>
                      <td className="p-3 text-stone-600">
                        Gemini quota starvation (429), temporary service unavailability (503), or key exposure.
                      </td>
                      <td className="p-3 text-stone-700">
                        4-tier Resilient Model Fallback Ladder (<code className="bg-amber-50 text-amber-800 px-1 rounded">3.6-flash</code> &rarr; <code className="bg-stone-100 px-1 rounded">3.1-flash-lite</code> &rarr; <code className="bg-stone-100 px-1 rounded">flash-latest</code> &rarr; <code className="bg-stone-100 px-1 rounded">3.7-flash</code>) with error recovery matrix.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-stone-600">
                  Deployed Firestore security rules enforcing complete user isolation and zero insecure defaults:
                </p>
                <button
                  onClick={() => copyToClipboard(firestoreRulesSnippet, 'rules')}
                  className="flex items-center gap-1 rounded bg-stone-100 px-2 py-1 text-stone-600 hover:bg-stone-200 transition font-mono text-[11px]"
                >
                  {copied === 'rules' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copied === 'rules' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-stone-900 text-stone-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {firestoreRulesSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-stone-600">
                  Production Cloud Run commands with Secret Manager integration and mandatory campaign label:
                </p>
                <button
                  onClick={() => copyToClipboard(cloudRunDeploySnippet, 'deploy')}
                  className="flex items-center gap-1 rounded bg-stone-100 px-2 py-1 text-stone-600 hover:bg-stone-200 transition font-mono text-[11px]"
                >
                  {copied === 'deploy' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copied === 'deploy' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-stone-900 text-stone-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {cloudRunDeploySnippet}
              </pre>
            </div>
          )}

          {activeTab === 'owasp' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <h4 className="font-semibold text-stone-900 text-xs">OWASP A01: Broken Access Control</h4>
                <p className="mt-1 text-stone-600 text-[11px]">
                  All database paths strictly require matching <code className="bg-white px-1 rounded">request.auth.uid == userId</code>. Blanket collection queries are rejected.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <h4 className="font-semibold text-stone-900 text-xs">OWASP A03 / LLM02: Input Validation</h4>
                <p className="mt-1 text-stone-600 text-[11px]">
                  Payloads are sanitized, trimmed, and stripped of undefined keys before hitting database drivers or Gemini prompt builders.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <h4 className="font-semibold text-stone-900 text-xs">OWASP LLM01: Prompt Injection Defense</h4>
                <p className="mt-1 text-stone-600 text-[11px]">
                  User reflections are isolated with protective system prompts that enforce narrative analysis and forbid command execution.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <h4 className="font-semibold text-stone-900 text-xs">Secret Management &amp; Zero Hardcoding</h4>
                <p className="mt-1 text-stone-600 text-[11px]">
                  All sensitive credentials reside in Cloud Secret Manager and server-side process environments. No browser exposure.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-3 bg-stone-50 flex items-center justify-between text-xs">
          <span className="text-stone-500 font-mono text-[11px]">
            Cloud Run AI Challenge • challenge1-496221
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
