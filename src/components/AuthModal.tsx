import React, { useState } from 'react';
import { X, LogOut, Cloud, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, firebaseUser, loginWithGoogle, logout, loginAsGuest } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSigningIn(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        onClose();
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setError(err?.message || 'Google Sign-In was cancelled or failed. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestSignIn = async () => {
    await loginAsGuest('Guest Reviewee');
    onClose();
  };

  const handleSignOut = async () => {
    await logout();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-md w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900 dark:text-white text-base">Account Center</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Account Details or Sign-In */}
        {firebaseUser ? (
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-orange-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Account Connected
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Cloud Synced
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={firebaseUser.photoURL || currentUser?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=engr'}
                alt={firebaseUser.displayName || 'User'}
                className="w-11 h-11 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800 border-2 border-orange-500"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                  {firebaseUser.displayName || currentUser?.name || 'Reviewee'}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{firebaseUser.email}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-orange-600 dark:text-orange-400 font-mono font-bold">
                  <span>{currentUser?.xp || 0} XP</span>
                  <span>•</span>
                  <span>{currentUser?.createdExamsCount || 0} Exams Created</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2 bg-white dark:bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Sign in with Google to create CELE exams, sync questions across devices, and track review progress.
              </p>

              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Continue with Google'}</span>
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold">
                  <span className="bg-zinc-50 dark:bg-zinc-900 px-2 text-zinc-400">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuestSignIn}
                className="w-full py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <UserIcon className="w-3.5 h-3.5 text-orange-500" />
                <span>Continue as Guest Reviewee</span>
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
