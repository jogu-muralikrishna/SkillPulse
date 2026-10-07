import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Scale,
  LineChart,
  GraduationCap,
  Sliders,
  ListOrdered,
  MapPin,
  Bot,
  GitFork,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isForecastGroupActive = ['forecast', 'planner', 'simulator', 'priority'].includes(currentView);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              SP
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block">SkillPulse</span>
              <span className="text-[11px] text-slate-400 font-medium block">Labour-Market Intelligence</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {/* Main Intelligence Views */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                onNavigate('dashboard');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentView === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
              <span>Executive Dashboard</span>
            </button>

            <button
              onClick={() => {
                onNavigate('demand');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'demand'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <TrendingUp className={`w-4 h-4 shrink-0 ${currentView === 'demand' ? 'text-white' : 'text-slate-400'}`} />
              <span>Demand Analysis</span>
            </button>

            <button
              onClick={() => {
                onNavigate('supply');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'supply'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 ${currentView === 'supply' ? 'text-white' : 'text-slate-400'}`} />
              <span>Supply Analysis</span>
            </button>

            <button
              onClick={() => {
                onNavigate('gaps');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'gaps'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Scale className={`w-4 h-4 shrink-0 ${currentView === 'gaps' ? 'text-white' : 'text-slate-400'}`} />
              <span>Skill Gaps</span>
            </button>
          </nav>

          {/* Forecasting & Planning Sub-group */}
          <div className="space-y-1">
            <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Forecasting & Planning
            </div>

            <button
              onClick={() => {
                onNavigate('forecast');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'forecast'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LineChart className={`w-4 h-4 shrink-0 ${currentView === 'forecast' ? 'text-white' : 'text-slate-400'}`} />
              <span>Demand Forecast</span>
            </button>

            <button
              onClick={() => {
                onNavigate('planner');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'planner'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <GraduationCap className={`w-4 h-4 shrink-0 ${currentView === 'planner' ? 'text-white' : 'text-slate-400'}`} />
              <span>Training Planner</span>
            </button>

            <button
              onClick={() => {
                onNavigate('simulator');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Sliders className={`w-4 h-4 shrink-0 ${currentView === 'simulator' ? 'text-white' : 'text-slate-400'}`} />
              <span>What-If Simulator</span>
            </button>

            <button
              onClick={() => {
                onNavigate('priority');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'priority'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <ListOrdered className={`w-4 h-4 shrink-0 ${currentView === 'priority' ? 'text-white' : 'text-slate-400'}`} />
              <span>Skill Priority Index</span>
            </button>
          </div>

          {/* Geographic Map */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigate('location');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'location'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <MapPin className={`w-4 h-4 shrink-0 ${currentView === 'location' ? 'text-white' : 'text-slate-400'}`} />
              <span>Geographic Map</span>
            </button>
          </div>

          {/* SkillPulse Assistant */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <button
              onClick={() => {
                onNavigate('assistant');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'assistant'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/80 hover:text-white border border-indigo-800/50'
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>SkillPulse Assistant</span>
            </button>
          </div>

          {/* Reference & Methodology */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <button
              onClick={() => {
                onNavigate('normalization');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'normalization'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <GitFork className={`w-4 h-4 shrink-0 ${currentView === 'normalization' ? 'text-white' : 'text-slate-400'}`} />
              <span>Skill Normalization</span>
            </button>

            <button
              onClick={() => {
                onNavigate('methodology');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'methodology'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <span>Methodology & Limits</span>
            </button>

            <button
              onClick={() => {
                onNavigate('data-sources');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                currentView === 'data-sources'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <span>Data Sources Catalog</span>
            </button>
          </div>
        </div>

        {/* Clean, Non-Technical Footer */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">SkillPulse</p>
          <p className="mt-0.5 text-slate-400">Labour-Market Intelligence</p>
        </div>
      </aside>
    </>
  );
};
