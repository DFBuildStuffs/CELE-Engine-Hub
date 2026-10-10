export type SubjectCode = 'SEC' | 'HPGE' | 'MSTE';

export type AppTab = 'exams' | 'builder' | 'dashboard' | 'leaderboard' | 'milestones' | 'how-to';

export interface Choice {
  label: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface Question {
  order: number;
  questionText: string;
  questionFigureUrl?: string | null;
  choices: Choice[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D'
  solutionText?: string;
  solutionFigureUrl?: string | null;
}

export interface Exam {
  id: string;
  title: string;
  subject: SubjectCode;
  description?: string;
  timeLimit: number; // in minutes
  passingScore: number; // percentage, e.g. 70
  createdAt: string;
  authorId?: string;
  authorName?: string;
  downloadsCount?: number;
  attemptsCount?: number;
  questions: Question[];
}

export interface User {
  id: string;
  name: string;
  title?: string;
  email: string;
  avatar: string;
  role: 'student' | 'reviewer' | 'admin';
  xp: number;
  streakDays: number;
  examsTaken: number;
  createdExamsCount: number;
  avgScore: number;
  unlockedBadges: string[];
}

export interface Attempt {
  id: string;
  examId: string;
  examTitle: string;
  subject: SubjectCode;
  userId: string;
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  completedAt: string;
  userAnswers?: Record<number, string>;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'achievement' | 'streak' | 'mastery' | 'author';
  unlockedColor: string;
}

export interface Milestone {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  description: string;
  completed: boolean;
}

export interface SchemaValidationError {
  questionIndex?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaValidationError[];
  warnings: SchemaValidationError[];
  stats: {
    totalQuestions: number;
    withQuestionFigure: number;
    withSolutionFigure: number;
    hasLatexMath: number;
  };
}
