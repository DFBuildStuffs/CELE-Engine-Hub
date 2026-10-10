import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFilePath = path.join(dataDir, 'cele_store.json');

// Clean Initial Blank Slate
const DEFAULT_STORE = {
  users: [],
  exams: [],
  attempts: []
};

// Load or initialize store
function getStore() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const data = fs.readFileSync(dbFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading store file, resetting to defaults:', err);
  }
  saveStore(DEFAULT_STORE);
  return DEFAULT_STORE;
}

function saveStore(store: any) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing store file:', err);
  }
}

// REST API Endpoints
// 1. Users
app.get('/api/users', (req: Request, res: Response) => {
  const store = getStore();
  res.json({ success: true, users: store.users });
});

app.post('/api/users/login', (req: Request, res: Response) => {
  const { email, name } = req.body;
  const store = getStore();
  let user = store.users.find((u: any) => u.email?.toLowerCase() === email?.toLowerCase());

  if (!user && name && email) {
    user = {
      id: 'usr_' + Date.now(),
      name,
      title: 'Registered CELE Reviewee',
      email,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      role: 'student',
      xp: 100,
      streakDays: 1,
      examsTaken: 0,
      createdExamsCount: 0,
      avgScore: 0,
      unlockedBadges: ['badge_first_step']
    };
    store.users.push(user);
    saveStore(store);
  }

  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(404).json({ success: false, message: 'User not found. Provide name to register.' });
  }
});

app.post('/api/users/update', (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  const store = getStore();
  const idx = store.users.findIndex((u: any) => u.id === userId);
  if (idx !== -1) {
    store.users[idx] = { ...store.users[idx], ...updates };
    saveStore(store);
    res.json({ success: true, user: store.users[idx] });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// 2. Exams
app.get('/api/exams', (req: Request, res: Response) => {
  const store = getStore();
  res.json({ success: true, exams: store.exams });
});

app.get('/api/exams/:id', (req: Request, res: Response) => {
  const store = getStore();
  const exam = store.exams.find((e: any) => e.id === req.params.id);
  if (exam) {
    res.json({ success: true, exam });
  } else {
    res.status(404).json({ success: false, message: 'Exam not found' });
  }
});

app.post('/api/exams', (req: Request, res: Response) => {
  const newExam = req.body;
  if (!newExam.title || !newExam.questions || !Array.isArray(newExam.questions)) {
    return res.status(400).json({ success: false, message: 'Invalid exam payload. Title and questions array required.' });
  }

  const store = getStore();
  // Check if exists or assign id
  const examId = newExam.id || 'cele-' + Date.now();
  const examRecord = {
    ...newExam,
    id: examId,
    createdAt: newExam.createdAt || new Date().toISOString().split('T')[0],
    downloadsCount: newExam.downloadsCount || 0,
    attemptsCount: newExam.attemptsCount || 0
  };

  const existingIdx = store.exams.findIndex((e: any) => e.id === examId);
  if (existingIdx !== -1) {
    store.exams[existingIdx] = examRecord;
  } else {
    store.exams.unshift(examRecord);
  }

  // Update author createdExamsCount
  if (newExam.authorId) {
    const user = store.users.find((u: any) => u.id === newExam.authorId);
    if (user) {
      user.createdExamsCount = (user.createdExamsCount || 0) + 1;
      user.xp = (user.xp || 0) + 200; // Bonus XP for authoring an exam
      if (!user.unlockedBadges.includes('badge_author')) {
        user.unlockedBadges.push('badge_author');
      }
    }
  }

  saveStore(store);
  res.json({ success: true, exam: examRecord });
});

app.delete('/api/exams/:id', (req: Request, res: Response) => {
  const store = getStore();
  const examId = req.params.id;
  store.exams = store.exams.filter((e: any) => e.id !== examId);
  saveStore(store);
  res.json({ success: true, message: 'Exam deleted successfully' });
});

// 3. Exam Attempts & Recording
app.post('/api/attempts', (req: Request, res: Response) => {
  const attempt = req.body;
  const store = getStore();
  const attemptRecord = {
    ...attempt,
    id: 'att_' + Date.now(),
    completedAt: new Date().toISOString()
  };

  store.attempts.unshift(attemptRecord);

  // Update exam attempts count
  const exam = store.exams.find((e: any) => e.id === attempt.examId);
  if (exam) {
    exam.attemptsCount = (exam.attemptsCount || 0) + 1;
  }

  // Update user stats and XP
  if (attempt.userId) {
    const user = store.users.find((u: any) => u.id === attempt.userId);
    if (user) {
      user.examsTaken = (user.examsTaken || 0) + 1;
      const earnedXp = Math.round(100 + (attempt.percentage || 0) * 1.5 + (attempt.passed ? 50 : 0));
      user.xp = (user.xp || 0) + earnedXp;

      // Update avgScore
      const userAttempts = store.attempts.filter((a: any) => a.userId === user.id);
      const totalPct = userAttempts.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0);
      user.avgScore = Math.round(totalPct / userAttempts.length);

      // Check badges
      if (!user.unlockedBadges.includes('badge_first_exam')) {
        user.unlockedBadges.push('badge_first_exam');
      }
      if (attempt.passed && attempt.subject === 'SEC' && !user.unlockedBadges.includes('badge_sec_master')) {
        user.unlockedBadges.push('badge_sec_master');
      }
      if (attempt.passed && attempt.subject === 'HPGE' && !user.unlockedBadges.includes('badge_hpge_wizard')) {
        user.unlockedBadges.push('badge_hpge_wizard');
      }
      if (attempt.passed && attempt.subject === 'MSTE' && !user.unlockedBadges.includes('badge_mste_ace')) {
        user.unlockedBadges.push('badge_mste_ace');
      }
      if (attempt.percentage === 100 && !user.unlockedBadges.includes('badge_perfect_score')) {
        user.unlockedBadges.push('badge_perfect_score');
      }
      if (user.examsTaken >= 10 && !user.unlockedBadges.includes('badge_century_solver')) {
        user.unlockedBadges.push('badge_century_solver');
      }
    }
  }

  saveStore(store);
  res.json({ success: true, attempt: attemptRecord });
});

app.get('/api/attempts', (req: Request, res: Response) => {
  const store = getStore();
  const userId = req.query.userId;
  if (userId) {
    const filtered = store.attempts.filter((a: any) => a.userId === userId);
    return res.json({ success: true, attempts: filtered });
  }
  res.json({ success: true, attempts: store.attempts });
});

// 4. Leaderboard & Stats
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const store = getStore();
  const sortedUsers = [...store.users].sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0));
  res.json({ success: true, leaderboard: sortedUsers });
});

// Development vs Production static Vite serving
async function setupServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`CELE Board Engine server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
});
