import React from 'react';
import { Award, Flame, CheckCircle2, Building2, Waves, Ruler, Target, FileUp, Sparkles, X } from 'lucide-react';
import { Badge } from '../types';

interface BadgeUnlockedModalProps {
  badge: Badge | null;
  onClose: () => void;
}

export const BadgeUnlockedModal: React.FC<BadgeUnlockedModalProps> = ({ badge, onClose }) => {
  if (!badge) return null;

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-10 h-10 text-orange-400" />;
      case 'Building2': return <Building2 className="w-10 h-10 text-orange-400" />;
      case 'Waves': return <Waves className="w-10 h-10 text-yellow-400" />;
      case 'Ruler': return <Ruler className="w-10 h-10 text-amber-400" />;
      case 'Target': return <Target className="w-10 h-10 text-orange-500" />;
      case 'FileUp': return <FileUp className="w-10 h-10 text-yellow-400" />;
      case 'CheckCircle2': return <CheckCircle2 className="w-10 h-10 text-orange-400" />;
      default: return <Award className="w-10 h-10 text-yellow-400" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-sm w-full bg-zinc-950 border-2 border-orange-500/50 rounded-3xl p-6 text-center shadow-2xl shadow-orange-500/20 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/30 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white bg-zinc-900 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">
          <Sparkles className="w-4 h-4 animate-spin text-yellow-400" />
          Milestone Unlocked!
        </div>

        {/* Badge Icon Hexagon */}
        <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-2 border-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 relative">
          <div className="absolute inset-0 bg-yellow-400/10 rounded-2xl animate-pulse" />
          {renderBadgeIcon(badge.icon)}
        </div>

        <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
          {badge.title}
        </h3>

        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          {badge.description}
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-2.5 px-4 mb-5 text-xs text-zinc-300 flex items-center justify-around">
          <div>
            <span className="block text-zinc-500 font-semibold text-[10px] uppercase">Reward</span>
            <span className="font-bold text-amber-400">+250 CELE XP</span>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div>
            <span className="block text-zinc-500 font-semibold text-[10px] uppercase">Category</span>
            <span className="font-bold text-orange-400 capitalize">{badge.category}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/30 transition transform active:scale-95"
        >
          Claim & Continue Review
        </button>
      </div>
    </div>
  );
};
