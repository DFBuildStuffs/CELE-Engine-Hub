import { Question, SchemaValidationError, SchemaValidationResult } from '../types';

export interface ParseResult {
  questions: Question[];
  metadata: {
    title?: string;
    subject?: 'SEC' | 'HPGE' | 'MSTE';
    timeLimit?: number;
    passingScore?: number;
    description?: string;
    solutionVisibility?: 'per_question' | 'after_submission';
  };
  validation: SchemaValidationResult;
}

export function validateAndNormalizeCeleJson(rawInput: string | object): ParseResult {
  const errors: SchemaValidationError[] = [];
  const warnings: SchemaValidationError[] = [];
  let parsedObj: any;

  // 1. JSON parsing
  if (typeof rawInput === 'string') {
    try {
      parsedObj = JSON.parse(rawInput);
    } catch (err: any) {
      return {
        questions: [],
        metadata: {},
        validation: {
          isValid: false,
          errors: [{ message: `Invalid JSON syntax: ${err.message}`, severity: 'error' }],
          warnings: [],
          stats: { totalQuestions: 0, withQuestionFigure: 0, withSolutionFigure: 0, hasLatexMath: 0 },
        },
      };
    }
  } else {
    parsedObj = rawInput;
  }

  const metadata: ParseResult['metadata'] = {};
  let rawQuestions: any[] = [];

  // 2. Format identification
  if (Array.isArray(parsedObj)) {
    rawQuestions = parsedObj;
  } else if (parsedObj && typeof parsedObj === 'object') {
    if (parsedObj.title) metadata.title = String(parsedObj.title);
    if (parsedObj.exam_title) metadata.title = String(parsedObj.exam_title);
    if (parsedObj.subject && ['SEC', 'HPGE', 'MSTE'].includes(parsedObj.subject)) {
      metadata.subject = parsedObj.subject;
    }
    if (parsedObj.timeLimit || parsedObj.time_limit) {
      metadata.timeLimit = Number(parsedObj.timeLimit || parsedObj.time_limit);
    }
    if (parsedObj.passingScore || parsedObj.passing_score) {
      metadata.passingScore = Number(parsedObj.passingScore || parsedObj.passing_score);
    }
    if (parsedObj.description) metadata.description = String(parsedObj.description);
    if (parsedObj.solutionVisibility || parsedObj.solution_visibility) {
      const vis = String(parsedObj.solutionVisibility || parsedObj.solution_visibility);
      if (vis === 'per_question' || vis === 'after_submission') {
        metadata.solutionVisibility = vis;
      }
    }

    if (Array.isArray(parsedObj.questions)) {
      rawQuestions = parsedObj.questions;
    } else if (Array.isArray(parsedObj.sections)) {
      // Convert lecture sections format into questions format if applicable
      warnings.push({
        message: 'Detected lecture sections format. Converting sections into review questions.',
        severity: 'warning',
      });
      rawQuestions = parsedObj.sections.map((sec: any, idx: number) => {
        const fig = sec.figures?.[0];
        return {
          order: idx + 1,
          questionText: `**${sec.heading}**\n\n${sec.markdownContent || ''}`,
          questionFigureUrl: fig ? null : null,
          choices: [
            { label: 'A', text: 'Concept thoroughly reviewed and verified' },
            { label: 'B', text: 'Needs numerical formula recalculation' },
            { label: 'C', text: 'Structural code check required (NSCP)' },
            { label: 'D', text: 'Alternative derivation applicable' },
          ],
          correctAnswer: 'A',
          solutionText: sec.markdownContent || 'Review section notes and references.',
        };
      });
    } else {
      errors.push({
        message: "Root object must contain a 'questions' array or be an array of questions.",
        severity: 'error',
      });
    }
  } else {
    errors.push({
      message: 'JSON root must be an array or an object.',
      severity: 'error',
    });
  }

  if (rawQuestions.length === 0 && errors.length === 0) {
    errors.push({
      message: 'No questions found in the provided JSON.',
      severity: 'error',
    });
  }

  const normalizedQuestions: Question[] = [];
  let withQuestionFigure = 0;
  let withSolutionFigure = 0;
  let hasLatexMath = 0;

  // 3. Question-level validation
  rawQuestions.forEach((item, index) => {
    const qIndex = index + 1;
    if (!item || typeof item !== 'object') {
      errors.push({
        questionIndex: qIndex,
        message: `Question #${qIndex} is not a valid object.`,
        severity: 'error',
      });
      return;
    }

    // Question Text
    const qText = item.questionText || item.question_text || item.text || item.question || '';
    if (!qText || typeof qText !== 'string' || qText.trim() === '') {
      errors.push({
        questionIndex: qIndex,
        field: 'questionText',
        message: `Question #${qIndex} is missing 'questionText'.`,
        severity: 'error',
      });
    }

    if (qText.includes('$')) {
      hasLatexMath++;
    }

    // Choices
    const rawChoices = item.choices || item.options || [];
    let normalizedChoices: { label: string; text: string }[] = [];

    if (!Array.isArray(rawChoices) || rawChoices.length < 2) {
      errors.push({
        questionIndex: qIndex,
        field: 'choices',
        message: `Question #${qIndex} must have at least 2 multiple-choice options (typically A, B, C, D).`,
        severity: 'error',
      });
    } else {
      const defaultLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
      normalizedChoices = rawChoices.map((c: any, cIdx: number) => {
        let label = defaultLabels[cIdx] || `C${cIdx + 1}`;
        let text = '';
        if (typeof c === 'string') {
          text = c;
        } else if (c && typeof c === 'object') {
          label = (c.label || defaultLabels[cIdx] || 'A').toUpperCase();
          text = c.text || c.choice_text || c.value || '';
        }

        if (!text.trim()) {
          warnings.push({
            questionIndex: qIndex,
            field: `choices[${label}]`,
            message: `Question #${qIndex} choice '${label}' has empty text.`,
            severity: 'warning',
          });
        }
        return { label, text };
      });
    }

    // Correct Answer
    let rawCorrect = (item.correctAnswer || item.correct_answer || item.answer || 'A').toString().toUpperCase().trim();
    if (rawCorrect.length > 1 && rawCorrect.startsWith('CHOICE ')) {
      rawCorrect = rawCorrect.replace('CHOICE ', '').trim();
    }
    const validLabels = normalizedChoices.map(c => c.label);
    if (validLabels.length > 0 && !validLabels.includes(rawCorrect)) {
      warnings.push({
        questionIndex: qIndex,
        field: 'correctAnswer',
        message: `Question #${qIndex} correctAnswer '${rawCorrect}' does not match available choice labels (${validLabels.join(', ')}). Defaulted to '${validLabels[0]}'.`,
        severity: 'warning',
      });
      rawCorrect = validLabels[0];
    }

    // Figures
    const qFig = item.questionFigureUrl || item.question_figure_url || null;
    const solFig = item.solutionFigureUrl || item.solution_figure_url || null;
    if (qFig) withQuestionFigure++;
    if (solFig) withSolutionFigure++;

    // Solution
    const solText = item.solutionText || item.solution_text || item.solution || item.explanation || '';
    if (!solText) {
      warnings.push({
        questionIndex: qIndex,
        field: 'solutionText',
        message: `Question #${qIndex} does not have a step-by-step solution derivation.`,
        severity: 'warning',
      });
    }

    normalizedQuestions.push({
      order: Number(item.order) || qIndex,
      questionText: qText,
      questionFigureUrl: qFig,
      choices: normalizedChoices.length > 0 ? normalizedChoices : [
        { label: 'A', text: 'Option A' },
        { label: 'B', text: 'Option B' },
        { label: 'C', text: 'Option C' },
        { label: 'D', text: 'Option D' },
      ],
      correctAnswer: rawCorrect || 'A',
      solutionText: solText || 'Step-by-step derivation will be added.',
      solutionFigureUrl: solFig,
    });
  });

  return {
    questions: normalizedQuestions,
    metadata,
    validation: {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalQuestions: normalizedQuestions.length,
        withQuestionFigure,
        withSolutionFigure,
        hasLatexMath,
      },
    },
  };
}
