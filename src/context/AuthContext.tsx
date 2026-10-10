import React, { createContext, useContext, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { User, Badge } from '../types';
import { api } from '../services/api';
import { ALL_BADGES } from '../lib/constants';
import { auth, signInWithGoogle, logOutFirebase, onAuthStateChanged, testFirestoreConnection } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  users: User[];
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loginAs: (userId: string) => Promise<void>;
  updateCurrentUserProfile: (updates: Partial<User>) => Promise<void>;
  awardXp: (amount: number, reason?: string) => Promise<void>;
  incrementStreak: () => Promise<void>;
  newlyUnlockedBadge: Badge | null;
  clearUnlockedBadge: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);

  // Test Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const profile = await api.syncFirebaseUserProfile({
            uid: fbUser.uid,
            displayName: fbUser.displayName,
            email: fbUser.email,
            photoURL: fbUser.photoURL,
          });
          setCurrentUser(profile);
        } catch (e) {
          console.error('Error syncing Firebase user profile:', e);
        }
      } else {
        setFirebaseUser(null);
        const savedUserStr = localStorage.getItem('cele_current_user_clean_v3');
        if (savedUserStr) {
          try {
            setCurrentUser(JSON.parse(savedUserStr));
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }

      // Load all users for leaderboard / author lookup
      try {
        const allUsers = await api.getUsers();
        setUsers(allUsers);
      } catch (err) {
        console.warn('Could not load users list:', err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        setFirebaseUser(fbUser);
        const profile = await api.syncFirebaseUserProfile({
          uid: fbUser.uid,
          displayName: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
        });
        setCurrentUser(profile);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f97316', '#eab308', '#ffffff'],
        });
      }
    } catch (e) {
      console.error('Login with Google error:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await logOutFirebase();
    setFirebaseUser(null);
    setCurrentUser(null);
    localStorage.removeItem('cele_current_user_clean_v3');
  };

  const loginAs = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('cele_current_user_clean_v3', JSON.stringify(target));
    }
  };

  const updateCurrentUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = await api.updateUser(currentUser.id, updates);
    if (updated) {
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    }
  };

  const awardXp = async (amount: number, reason?: string) => {
    if (!currentUser) return;
    const newXp = (currentUser.xp || 0) + amount;
    const updates: Partial<User> = { xp: newXp };

    // Check if new badges unlocked
    const currentBadges = [...(currentUser.unlockedBadges || [])];
    const newlyEarned: string[] = [];

    if (newXp >= 1000 && !currentBadges.includes('badge_first_step')) {
      newlyEarned.push('badge_first_step');
    }

    if (newlyEarned.length > 0) {
      updates.unlockedBadges = [...currentBadges, ...newlyEarned];
      const badgeObj = ALL_BADGES.find(b => b.id === newlyEarned[0]);
      if (badgeObj) {
        setNewlyUnlockedBadge(badgeObj);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f97316', '#eab308', '#ffffff'],
        });
      }
    }

    await updateCurrentUserProfile(updates);
  };

  const incrementStreak = async () => {
    if (!currentUser) return;
    const newStreak = (currentUser.streakDays || 0) + 1;
    const updates: Partial<User> = { streakDays: newStreak };
    if (newStreak >= 3 && !currentUser.unlockedBadges?.includes('badge_streak_3')) {
      const badgeObj = ALL_BADGES.find(b => b.id === 'badge_streak_3');
      if (badgeObj) {
        updates.unlockedBadges = [...(currentUser.unlockedBadges || []), 'badge_streak_3'];
        setNewlyUnlockedBadge(badgeObj);
        confetti({
          particleCount: 100,
          spread: 80,
          colors: ['#f97316', '#fbbf24', '#ffffff'],
        });
      }
    }
    await updateCurrentUserProfile(updates);
  };

  const clearUnlockedBadge = () => {
    setNewlyUnlockedBadge(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        users,
        isLoading,
        loginWithGoogle,
        logout,
        loginAs,
        updateCurrentUserProfile,
        awardXp,
        incrementStreak,
        newlyUnlockedBadge,
        clearUnlockedBadge,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
