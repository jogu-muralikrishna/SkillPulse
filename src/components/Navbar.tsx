import React from 'react';
import { Menu, Bot } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onOpenMobileMenu: () => void;
  onNavigate: (view: string) => void;
}

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Executive Dashboard',
  demand: 'Demand Analysis',
  supply: 'Supply Analysis',
  gaps: 'Skill Gaps',
  forecast: 'Demand Forecast',
  planner: 'Training Planner',
  simulator: 'What-If Simulator',
  priority: 'Skill Priority Index',
  location: 'Geographic Map',
  assistant: 'SkillPulse Assistant',
};

export const Navbar: React.FC<NavbarProps> = ({ currentView, onOpenMobileMenu, onNavigate }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200">
      {/* Zone 1: Wordmark + mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden hover:bg-slate-100 cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-left group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            SP
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            SkillPulse
          </span>
        </button>
      </div>

      {/* Zone 2: Breadcrumb / Section Context */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span>Labour-Market Intelligence</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span className="text-slate-800 font-semibold">{VIEW_TITLES[currentView] || 'Overview'}</span>
      </div>

      {/* Zone 3: Direct Action to SkillPulse Assistant */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('assistant')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          <Bot className="w-4 h-4 text-indigo-600" />
          <span>SkillPulse Assistant</span>
        </button>
      </div>
    </header>
  );
};
