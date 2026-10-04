import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { DemandView } from './views/DemandView';
import { SupplyView } from './views/SupplyView';
import { SkillGapView } from './views/SkillGapView';
import { ForecastView } from './views/ForecastView';
import { TrainingPlannerView } from './views/TrainingPlannerView';
import { WhatIfSimulatorView } from './views/WhatIfSimulatorView';
import { SkillPriorityView } from './views/SkillPriorityView';
import { LocationView } from './views/LocationView';
import { AssistantView } from './views/AssistantView';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [simulatorParams, setSimulatorParams] = useState<{
    skill?: string;
    state?: string;
    district?: string;
  }>({});

  const handleNavigate = (view: string, params?: any) => {
    // If user attempted to navigate to an unlisted/removed technical page, redirect gracefully to dashboard
    if (['normalization', 'data-sources', 'methodology', 'sources'].includes(view)) {
      setCurrentView('dashboard');
      return;
    }
    setCurrentView(view);
    if (view === 'simulator' && params) {
      setSimulatorParams(params);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'demand':
        return <DemandView />;
      case 'supply':
        return <SupplyView />;
      case 'gaps':
        return <SkillGapView />;
      case 'forecast':
        return <ForecastView onNavigateToAssistant={() => handleNavigate('assistant')} />;
      case 'planner':
        return (
          <TrainingPlannerView
            onNavigateToSimulator={(skill, state, district) =>
              handleNavigate('simulator', { skill, state, district })
            }
          />
        );
      case 'simulator':
        return (
          <WhatIfSimulatorView
            initialSkill={simulatorParams.skill}
            initialState={simulatorParams.state}
            initialDistrict={simulatorParams.district}
          />
        );
      case 'priority':
        return <SkillPriorityView />;
      case 'location':
        return <LocationView />;
      case 'assistant':
        return <AssistantView />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Main Layout Container with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
