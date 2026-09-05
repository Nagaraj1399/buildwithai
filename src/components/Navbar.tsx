import React from 'react';
import { User } from 'firebase/auth';
import { 
  BookOpen, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  Database, 
  Info 
} from 'lucide-react';
import { signOutUser } from '../lib/firebase';

interface NavbarProps {
  user: User | null;
  onOpenSecurityModal: () => void;
  entriesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onOpenSecurityModal,
  entriesCount = 0 
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold tracking-tight text-stone-900">
                Reflection AI
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                <Sparkles className="h-3 w-3" />
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="hidden text-xs text-stone-500 sm:block">
              Private Journal &amp; Cloud Run AI Challenge
            </p>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center gap-3">
          {/* Security & Directives Button */}
          <button
            id="security-directives-btn"
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            title="View Threat Model, Security Rules & Production Directives"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden md:inline">Security &amp; Directives</span>
          </button>

          {user && (
            <>
              {/* Firestore Isolation indicator */}
              <div className="hidden items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 sm:flex">
                <Database className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-mono text-[11px]">User-Isolated DB</span>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full border border-stone-300 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-xs font-medium text-white">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden flex-col text-left lg:flex">
                  <span className="text-xs font-medium text-stone-900 leading-tight">
                    {user.displayName || 'Journal Author'}
                  </span>
                  <span className="max-w-[140px] truncate text-[11px] text-stone-500 leading-tight">
                    {user.email}
                  </span>
                </div>

                {/* Sign out */}
                <button
                  id="signout-btn"
                  onClick={() => signOutUser()}
                  className="flex items-center gap-1 rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  title="Sign out of your account"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
