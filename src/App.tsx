import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { SecurityModal } from './components/SecurityModal';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-600" />
          <p className="font-serif text-sm">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Navigation Header */}
      <Navbar
        user={user}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
      />

      {/* Main Content: Authenticated Dashboard vs Landing Page */}
      <div className="flex-1 flex flex-col">
        {user ? (
          <Dashboard user={user} />
        ) : (
          <LandingPage onOpenSecurityModal={() => setIsSecurityModalOpen(true)} />
        )}
      </div>

      {/* Security & Directives Audit Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}
