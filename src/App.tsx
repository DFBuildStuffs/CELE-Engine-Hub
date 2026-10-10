import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ExamsDirectory } from './components/ExamsDirectory';
import { ExamBuilderWizard } from './components/ExamBuilderWizard';
import { ExamSimulator } from './components/ExamSimulator';
import { DashboardView } from './components/DashboardView';
import { LeaderboardView } from './components/LeaderboardView';
import { GamificationView } from './components/GamificationView';
import { HowToView } from './components/HowToView';
import { FigureLightbox } from './components/FigureLightbox';
import { AuthModal } from './components/AuthModal';
import { BadgeUnlockedModal } from './components/BadgeUnlockedModal';
import { Exam, AppTab } from './types';
import { api } from './services/api';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

function MainApp() {
  const { newlyUnlockedBadge, clearUnlockedBadge } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('exams');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);

  // Active Modes & Modals
  const [activeExamSimulator, setActiveExamSimulator] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [lightboxData, setLightboxData] = useState<{ url: string; title?: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Exams on Mount
  useEffect(() => {
    async function loadExams() {
      setIsLoadingExams(true);
      try {
        const data = await api.getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams:', err);
      } finally {
        setIsLoadingExams(false);
      }
    }
    loadExams();
  }, []);

  // Deploy or Update Exam
  const handleDeployExam = async (exam: Exam) => {
    const saved = await api.saveExam(exam);
    setExams(prev => {
      const idx = prev.findIndex(e => e.id === saved.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setEditingExam(null);
    setActiveTab('exams');
  };

  // Delete Exam
  const handleDeleteExam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this deployed CELE exam?')) return;
    await api.deleteExam(id);
    setExams(prev => prev.filter(e => e.id !== id));
    showToast('Exam removed from archive.', 'info');
  };

  // Export Exam JSON Package
  const handleExportExam = (exam: Exam) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exam, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${exam.title.replace(/\s+/g, '_')}_CELE.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported complete JSON package.', 'success');
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-orange-500 selection:text-white transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-bold text-xs flex items-center gap-3 animate-in slide-in-from-bottom-3 ${
          toast.type === 'error'
            ? 'bg-red-600'
            : toast.type === 'info'
            ? 'bg-zinc-800 border border-zinc-700'
            : 'bg-orange-500 text-white'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-white" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-orange-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Lightbox / Zoom Dialog */}
      {lightboxData && (
        <FigureLightbox
          imageUrl={lightboxData.url}
          title={lightboxData.title}
          onClose={() => setLightboxData(null)}
        />
      )}

      {/* Simulator Modal */}
      {activeExamSimulator && (
        <ExamSimulator
          exam={activeExamSimulator}
          onClose={() => setActiveExamSimulator(null)}
          onOpenLightbox={(url, title) => setLightboxData({ url, title })}
        />
      )}

      {/* Multi-User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Milestone Unlocked Modal */}
      <BadgeUnlockedModal
        badge={newlyUnlockedBadge}
        onClose={clearUnlockedBadge}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        examsCount={exams.length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar (No header menu, clean title, streak, theme toggle, and auth button) */}
        <TopBar
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'exams' && (
            <ExamsDirectory
              exams={exams}
              onTakeExam={exam => setActiveExamSimulator(exam)}
              onEditExam={exam => {
                setEditingExam(exam);
                setActiveTab('builder');
              }}
              onDeleteExam={handleDeleteExam}
              onExportExam={handleExportExam}
              onCreateNew={() => {
                setEditingExam(null);
                setActiveTab('builder');
              }}
              onOpenLightbox={(url, title) => setLightboxData({ url, title })}
            />
          )}

          {activeTab === 'builder' && (
            <ExamBuilderWizard
              initialExam={editingExam}
              onDeployExam={handleDeployExam}
              onCancel={() => {
                setEditingExam(null);
                setActiveTab('exams');
              }}
              onOpenLightbox={(url, title) => setLightboxData({ url, title })}
              showToast={showToast}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              onTakeExamById={id => {
                const target = exams.find(e => e.id === id);
                if (target) setActiveExamSimulator(target);
              }}
              onExploreExams={() => setActiveTab('exams')}
            />
          )}

          {activeTab === 'leaderboard' && <LeaderboardView />}

          {activeTab === 'milestones' && <GamificationView />}

          {activeTab === 'how-to' && (
            <HowToView
              onLoadTemplateIntoBuilder={() => {
                setEditingExam(null);
                setActiveTab('builder');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
