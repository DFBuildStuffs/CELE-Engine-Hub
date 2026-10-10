import { Badge, SubjectCode } from '../types';

export const CELE_SUBJECTS: Record<SubjectCode, { name: string; fullTitle: string; color: string; badgeBg: string; badgeBorder: string; badgeText: string }> = {
  SEC: {
    name: 'SEC',
    fullTitle: 'Structural Engineering & Construction',
    color: 'orange',
    badgeBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-600 dark:text-orange-400',
  },
  HPGE: {
    name: 'HPGE',
    fullTitle: 'Hydraulics & Geotechnical Engineering',
    color: 'yellow',
    badgeBg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    badgeBorder: 'border-yellow-500/30',
    badgeText: 'text-yellow-700 dark:text-yellow-400',
  },
  MSTE: {
    name: 'MSTE',
    fullTitle: 'Mathematics, Surveying & Transportation',
    color: 'amber',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-600 dark:text-amber-400',
  },
};

export const ALL_BADGES: Badge[] = [
  {
    id: 'badge_first_step',
    title: 'First Step Reviewee',
    description: 'Joined CELE Board Engine and configured engineering profile.',
    icon: 'Compass',
    category: 'achievement',
    unlockedColor: 'from-orange-500 to-amber-500',
  },
  {
    id: 'badge_first_exam',
    title: 'Exam Pioneer',
    description: 'Completed your first full PRC-style CELE mock exam.',
    icon: 'CheckCircle2',
    category: 'achievement',
    unlockedColor: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'badge_sec_master',
    title: 'Structural Titan',
    description: 'Passed a Structural Engineering & Construction (SEC) exam with 70%+ score.',
    icon: 'Building2',
    category: 'mastery',
    unlockedColor: 'from-orange-600 to-amber-600',
  },
  {
    id: 'badge_hpge_wizard',
    title: 'Geotech & Hydraulics Ace',
    description: 'Mastered Hydraulics & Geotechnical Engineering (HPGE) with passing honors.',
    icon: 'Waves',
    category: 'mastery',
    unlockedColor: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'badge_mste_ace',
    title: 'Surveying & Math Maestro',
    description: 'Excelled in MSTE with high precision and tape correction accuracy.',
    icon: 'Ruler',
    category: 'mastery',
    unlockedColor: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'badge_streak_3',
    title: '3-Day Fire Streak',
    description: 'Maintained consistent civil engineering review for 3 consecutive days.',
    icon: 'Flame',
    category: 'streak',
    unlockedColor: 'from-orange-500 to-yellow-400',
  },
  {
    id: 'badge_perfect_score',
    title: 'PRC Topnotcher (100%)',
    description: 'Achieved a perfect 100% score on any comprehensive board mock test.',
    icon: 'Award',
    category: 'achievement',
    unlockedColor: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'badge_century_solver',
    title: 'Century Solver (10+ Exams)',
    description: 'Finished 10 or more practice exams to cement engineering fundamentals.',
    icon: 'Target',
    category: 'achievement',
    unlockedColor: 'from-orange-600 to-yellow-500',
  },
  {
    id: 'badge_author',
    title: 'Board Exam Contributor',
    description: 'Created and deployed a custom CELE exam package with diagrams.',
    icon: 'FileUp',
    category: 'author',
    unlockedColor: 'from-amber-600 to-orange-500',
  },
];

export const CELE_JSON_TEMPLATE_SINGLE = `{
  "questions": [
    {
      "order": 1,
      "questionText": "A rectangular reinforced concrete beam has $b = 300\\\\text{ mm}$ and effective depth $d = 500\\\\text{ mm}$. If $f'_c = 28\\\\text{ MPa}$, calculate concrete nominal shear strength: $$V_c = 0.17 \\\\lambda \\\\sqrt{f'_c} b_w d$$",
      "questionFigureUrl": null,
      "choices": [
        { "label": "A", "text": "$134.9\\\\text{ kN}$" },
        { "label": "B", "text": "$145.2\\\\text{ kN}$" },
        { "label": "C", "text": "$122.4\\\\text{ kN}$" },
        { "label": "D", "text": "$158.6\\\\text{ kN}$" }
      ],
      "correctAnswer": "A",
      "solutionText": "Using $V_c = 0.17(1.0)\\\\sqrt{28}(300)(500) = 134.9\\\\text{ kN}$. Choice A is correct.",
      "solutionFigureUrl": null
    }
  ]
}`;

export const CELE_JSON_TEMPLATE_FULL_EXAM = `{
  "title": "November 2024 CELE Mock Examination - Structural Engineering",
  "subject": "SEC",
  "timeLimit": 120,
  "passingScore": 70,
  "solutionVisibility": "after_submission",
  "description": "Board exam review covering reinforced concrete and structural analysis.",
  "questions": [
    {
      "order": 1,
      "questionText": "Determine the maximum factored moment for a simply supported beam with $L = 6\\\\text{ m}$ under $w_u = 43.2\\\\text{ kN/m}$: $$M_u = \\\\frac{w_u L^2}{8}$$",
      "questionFigureUrl": null,
      "choices": [
        { "label": "A", "text": "$194.4\\\\text{ kN}\\\\cdot\\\\text{m}$" },
        { "label": "B", "text": "$202.8\\\\text{ kN}\\\\cdot\\\\text{m}$" },
        { "label": "C", "text": "$216.0\\\\text{ kN}\\\\cdot\\\\text{m}$" },
        { "label": "D", "text": "$185.0\\\\text{ kN}\\\\cdot\\\\text{m}$" }
      ],
      "correctAnswer": "A",
      "solutionText": "$$M_u = \\\\frac{43.2 \\\\times 36}{8} = 194.4\\\\text{ kN}\\\\cdot\\\\text{m}$$",
      "solutionFigureUrl": null
    }
  ]
}`;
