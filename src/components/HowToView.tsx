import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  FileText,
  Sparkles,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  Code2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CELE_JSON_TEMPLATE_FULL_EXAM, CELE_JSON_TEMPLATE_SINGLE } from '../lib/constants';

interface HowToViewProps {
  onLoadTemplateIntoBuilder: (templateStr: string) => void;
}

export const HowToView: React.FC<HowToViewProps> = ({ onLoadTemplateIntoBuilder }) => {
  const [templateTab, setTemplateTab] = useState<'full' | 'single'>('full');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const currentTemplate = templateTab === 'full' ? CELE_JSON_TEMPLATE_FULL_EXAM : CELE_JSON_TEMPLATE_SINGLE;

  const pdfConversionPrompt = `Act as an experienced software developer specializing in web-based examination systems and PDF-to-JSON conversion.
I will provide a PDF and a JSON template. Carefully scan the entire PDF and extract every question, all answer choices, the correct answer, and the corresponding solution.
Requirements:
1. Follow the provided JSON template exactly, including field names, structure, and data types, to ensure compatibility with my exam application.
2. Preserve the original question text, choices, answers, and solutions in their correct order. Do not omit any questions.
3. Exclude all illustrations, diagrams, and images. Retain essential information as text only when it can be accurately transcribed.
4. Format mathematical expressions and formulas using valid LaTeX, properly escaped for JSON.
5. Never guess missing or unreadable content. Flag questions, answers, or solutions that require manual review.
6. Validate the JSON syntax, completeness, and structure before delivery.
Output: Provide a downloadable, import-ready .json file and a brief summary of the number of questions extracted and any unresolved issues. Do not include the entire JSON in the chat response.`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(currentTemplate);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(pdfConversionPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownloadSchema = () => {
    const filename = templateTab === 'full' ? 'cele_exam_template.json' : 'cele_question_template.json';
    const blob = new Blob([currentTemplate], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPromptPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);

    const margin = 54;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;

    const lines = doc.splitTextToSize(pdfConversionPrompt, maxLineWidth);
    doc.text(lines, margin, 72);

    doc.save('CELE_PDF_to_JSON_Prompt.pdf');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          How-To Guide & Schema
        </h1>
      </div>

      {/* PDF to JSON Conversion Prompt Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 dark:text-orange-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                PDF-to-JSON AI Extraction Prompt
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-orange-500" />}
              <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
            </button>
            <button
              onClick={handleDownloadPromptPdf}
              className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Prompt Text Box */}
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap select-all">
          {pdfConversionPrompt}
        </div>
      </div>

      {/* JSON Schema & Template Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                CELE JSON Schema & Templates
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopySchema}
              className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-orange-500" />}
              <span>{copiedSchema ? 'Copied!' : 'Copy Schema'}</span>
            </button>
            <button
              onClick={handleDownloadSchema}
              className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-yellow-500" />
              <span>Download .json</span>
            </button>
            <button
              onClick={() => onLoadTemplateIntoBuilder(currentTemplate)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load into Create Exam</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 w-fit">
          <button
            onClick={() => setTemplateTab('full')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              templateTab === 'full'
                ? 'bg-orange-500 text-white dark:text-black shadow'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Full Exam Package Schema
          </button>
          <button
            onClick={() => setTemplateTab('single')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              templateTab === 'single'
                ? 'bg-orange-500 text-white dark:text-black shadow'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Questions Array Format
          </button>
        </div>

        {/* Code viewer */}
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto leading-relaxed">
          <pre>{currentTemplate}</pre>
        </div>
      </div>

      {/* Rules & Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LaTeX Math Rules */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            LaTeX Math Rules
          </h3>
          <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
            <p>
              • <strong>Inline Formulas:</strong> Wrap in single dollar signs, e.g.{' '}
              <code className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-orange-600 dark:text-orange-400">$f&apos;_c = 28\text&#123; MPa&#125;$</code>.
            </p>
            <p>
              • <strong>Block Equations:</strong> Wrap in double dollar signs, e.g.{' '}
              <code className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-orange-600 dark:text-orange-400">$$V_c = 0.17 \lambda \sqrt&#123;f&apos;_c&#125; b_w d$$</code>.
            </p>
            <p>
              • <strong>Backslashes in JSON:</strong> Ensure backslashes are escaped with double backslashes in raw JSON strings (<code className="bg-zinc-100 dark:bg-zinc-900 px-1 rounded">\\frac</code>, <code className="bg-zinc-100 dark:bg-zinc-900 px-1 rounded">\\sqrt</code>).
            </p>
          </div>
        </div>

        {/* Diagrams & Figures */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            Attaching Engineering Figures
          </h3>
          <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
            <p>
              • <strong>Paste Image (Ctrl+V):</strong> Focus or hover on any question figure slot and press Ctrl+V to attach directly from clipboard.
            </p>
            <p>
              • <strong>Import Image:</strong> Click &quot;Import Image&quot; to upload PNG, JPG, or SVG diagrams.
            </p>
            <p>
              • <strong>In JSON:</strong> Leave <code className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-yellow-600 dark:text-yellow-400">questionFigureUrl: null</code> or embed base64 data URLs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
