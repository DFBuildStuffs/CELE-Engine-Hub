import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Attempt, Exam, User } from '../types';

const STORAGE_KEY_EXAMS = 'cele_exams_clean_v3';
const STORAGE_KEY_ATTEMPTS = 'cele_attempts_clean_v3';
const STORAGE_KEY_USERS = 'cele_users_clean_v3';
const STORAGE_KEY_CURRENT_USER = 'cele_current_user_clean_v3';

export const api = {
  // 1. Sync User Profile with Firestore
  async syncFirebaseUserProfile(fbUser: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }): Promise<User> {
    const userDocRef = doc(db, 'users', fbUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const existing = snap.data() as User;
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(existing));
        return existing;
      } else {
        const newUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Civil Engineer',
          title: 'Registered Reviewee',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fbUser.uid)}`,
          role: 'reviewer',
          xp: 0,
          streakDays: 1,
          examsTaken: 0,
          createdExamsCount: 0,
          avgScore: 0,
          unlockedBadges: [],
        };
        await setDoc(userDocRef, newUser);
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(newUser));
        return newUser;
      }
    } catch (error) {
      console.warn('Sync user profile Firestore error, using fallback:', error);
      const fallbackUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Civil Engineer',
        title: 'Registered Reviewee',
        email: fbUser.email || '',
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fbUser.uid)}`,
        role: 'reviewer',
        xp: 0,
        streakDays: 1,
        examsTaken: 0,
        createdExamsCount: 0,
        avgScore: 0,
        unlockedBadges: [],
      };
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const userDocRef = doc(db, 'users', userId);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const updated = { ...snap.data(), ...updates } as User;
        await setDoc(userDocRef, updated, { merge: true });
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updated));
        return updated;
      }
    } catch (error) {
      console.warn('Update user Firestore error:', error);
    }

    const local = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (local) {
      const parsed = { ...JSON.parse(local), ...updates };
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(parsed));
      return parsed;
    }
    return null;
  },

  async getUsers(): Promise<User[]> {
    const colRef = collection(db, 'users');
    try {
      const snap = await getDocs(colRef);
      const list: User[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as User);
      });
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(list));
      return list;
    } catch (error) {
      console.warn('Get users Firestore error, using cache:', error);
    }
    const cached = localStorage.getItem(STORAGE_KEY_USERS);
    return cached ? JSON.parse(cached) : [];
  },

  // 2. Exams Cloud Repository (Blank Slate)
  async getExams(): Promise<Exam[]> {
    const colRef = collection(db, 'exams');
    try {
      const snap = await getDocs(colRef);
      const list: Exam[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as Exam);
      });
      localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(list));
      return list;
    } catch (error: any) {
      if (error?.code === 'permission-denied' || String(error?.message).includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.LIST, 'exams');
      }
      console.warn('Get exams Firestore error, using local fallback:', error);
    }
    const cached = localStorage.getItem(STORAGE_KEY_EXAMS);
    return cached ? JSON.parse(cached) : [];
  },

  async saveExam(exam: Exam): Promise<Exam> {
    const localExams: Exam[] = JSON.parse(localStorage.getItem(STORAGE_KEY_EXAMS) || '[]');
    const idx = localExams.findIndex(e => e.id === exam.id);
    if (idx !== -1) localExams[idx] = exam;
    else localExams.unshift(exam);
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(localExams));

    const examDocRef = doc(db, 'exams', exam.id);
    try {
      await setDoc(examDocRef, exam);

      if (exam.authorId) {
        try {
          const authorDocRef = doc(db, 'users', exam.authorId);
          const authorSnap = await getDoc(authorDocRef);
          if (authorSnap.exists()) {
            const authorData = authorSnap.data() as User;
            const newBadges = [...(authorData.unlockedBadges || [])];
            if (!newBadges.includes('badge_author')) newBadges.push('badge_author');

            await setDoc(
              authorDocRef,
              {
                createdExamsCount: (authorData.createdExamsCount || 0) + 1,
                xp: (authorData.xp || 0) + 200,
                unlockedBadges: newBadges,
              },
              { merge: true }
            );
          }
        } catch {
          // ignore author user sync error
        }
      }
    } catch (error: any) {
      if (error?.code === 'permission-denied' || String(error?.message).includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.WRITE, `exams/${exam.id}`);
      }
      console.warn('Firestore saveExam error:', error);
    }

    return exam;
  },

  async deleteExam(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'exams', id));
    } catch (error: any) {
      if (error?.code === 'permission-denied' || String(error?.message).includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.DELETE, `exams/${id}`);
      }
      console.warn('Delete exam Firestore error:', error);
    }
    const localExams: Exam[] = JSON.parse(localStorage.getItem(STORAGE_KEY_EXAMS) || '[]');
    const filtered = localExams.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(filtered));
    return true;
  },

  // 3. Attempts & Scores
  async recordAttempt(attempt: Omit<Attempt, 'id' | 'completedAt'>): Promise<Attempt> {
    const attemptId = 'att_' + Date.now();
    const newAttempt: Attempt = {
      ...attempt,
      id: attemptId,
      completedAt: new Date().toISOString(),
    };

    const localAtt: Attempt[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ATTEMPTS) || '[]');
    localAtt.unshift(newAttempt);
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(localAtt));

    try {
      await setDoc(doc(db, 'attempts', attemptId), newAttempt);

      if (attempt.userId) {
        try {
          const userDocRef = doc(db, 'users', attempt.userId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const u = userSnap.data() as User;
            const newXp = (u.xp || 0) + Math.round(100 + (attempt.percentage || 0) * 1.5 + (attempt.passed ? 50 : 0));
            const newBadges = [...(u.unlockedBadges || [])];
            if (!newBadges.includes('badge_first_exam')) newBadges.push('badge_first_exam');
            if (attempt.passed && attempt.subject === 'SEC' && !newBadges.includes('badge_sec_master')) newBadges.push('badge_sec_master');
            if (attempt.passed && attempt.subject === 'HPGE' && !newBadges.includes('badge_hpge_wizard')) newBadges.push('badge_hpge_wizard');
            if (attempt.passed && attempt.subject === 'MSTE' && !newBadges.includes('badge_mste_ace')) newBadges.push('badge_mste_ace');
            if (attempt.percentage === 100 && !newBadges.includes('badge_perfect_score')) newBadges.push('badge_perfect_score');

            await setDoc(
              userDocRef,
              {
                examsTaken: (u.examsTaken || 0) + 1,
                xp: newXp,
                unlockedBadges: newBadges,
              },
              { merge: true }
            );
          }
        } catch {
          // ignore user attempt update error
        }
      }
    } catch (error: any) {
      if (error?.code === 'permission-denied' || String(error?.message).includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.WRITE, `attempts/${attemptId}`);
      }
      console.warn('Record attempt error:', error);
    }

    return newAttempt;
  },

  async getAttempts(userId?: string): Promise<Attempt[]> {
    try {
      const snap = await getDocs(collection(db, 'attempts'));
      const list: Attempt[] = [];
      snap.forEach(d => list.push(d.data() as Attempt));
      if (list.length > 0) {
        if (userId) return list.filter(a => a.userId === userId);
        return list;
      }
    } catch (error: any) {
      if (error?.code === 'permission-denied' || String(error?.message).includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.LIST, 'attempts');
      }
      // Local fallback
    }
    const localAtt: Attempt[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ATTEMPTS) || '[]');
    if (userId) return localAtt.filter(a => a.userId === userId);
    return localAtt;
  },

  async getLeaderboard(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: User[] = [];
      snap.forEach(d => list.push(d.data() as User));
      return list.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    } catch (error: any) {
      if (error?.code === 'permission-denied' || String(error?.message).includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
      // Fallback
    }
    const localUsers: User[] = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    return localUsers.sort((a, b) => (b.xp || 0) - (a.xp || 0));
  },
};
