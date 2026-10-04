import React, { useState } from 'react';
import {
  Database,
  Sparkles,
  Layers,
  Scale,
  TrendingUp,
  GraduationCap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const MethodologyView: React.FC = () => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const workflowSteps = [
    {
      num: 1,
      shortLabel: 'DATA',
      title: 'Collect verified labour-market data',
      desc: 'We gather official filings from government sources, including job postings from National Career Service (NCS), worker registers from e-Shram, and accredited training records from MSDE.',
      icon: Database,
      badge: 'Official Sources'
    },
    {
      num: 2,
      shortLabel: 'CLEAN',
      title: 'Clean and organize the data',
      desc: 'Information is checked to remove duplicates, correct spelling, format dates, and verify that administrative boundaries correspond to verified official records.',
      icon: Sparkles,
      badge: 'Quality Check'
    },
    {
      num: 3,
      shortLabel: 'STANDARDIZE',
      title: 'Standardize skills and locations',
      desc: 'Different job titles for the same trade (e.g. "Python Developer", "Python Engineer") are grouped into consistent skill categories, aligned with India\'s 36 States/UTs and 786 official districts.',
      icon: Layers,
      badge: 'Standardization'
    },
    {
      num: 4,
      shortLabel: 'COMPARE',
      title: 'Compare demand with available supply',
      desc: 'For each specific district and skill, we look at employers seeking workers alongside the number of qualified workers available in that same area.',
      icon: Scale,
      badge: 'Boundary Alignment'
    },
    {
      num: 5,
      shortLabel: 'FIND GAPS',
      title: 'Identify potential skill gaps',
      desc: 'When job openings substantially outnumber available workers, a potential skill shortage is highlighted. When worker availability matches or exceeds demand, it is marked as balanced or sufficient.',
      icon: ShieldCheck,
      badge: 'Deficit Analysis'
    },
    {
      num: 6,
      shortLabel: 'FORECAST',
      title: 'Forecast future demand when enough historical data exists',
      desc: 'If a location has consistent multi-period records, the system looks at the trend to estimate what employer demand may look like over the coming 6 to 12 months.',
      icon: TrendingUp,
      badge: 'Future Outlook'
    },
    {
      num: 7,
      shortLabel: 'PLANNING',
      title: 'Provide training-planning insights',
      desc: 'Skill councils and education providers receive clear guidance showing where creating additional training seats or vocational courses may help meet anticipated local hiring needs.',
      icon: GraduationCap,
      badge: 'Decision Support'
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          How SkillPulse Works
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          A clear, step-by-step explanation of how the system turns official employment records into easy-to-understand guidance for education and workforce planning.
        </p>
      </div>

      {/* Visual Flow Banner */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Visual Analytical Flow
          </span>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Plain-Language Process
          </span>
        </div>

        {/* Desktop Step Flow */}
        <div className="hidden lg:grid grid-cols-6 gap-2 text-center text-xs">
          {[
            { label: 'DATA', sub: 'Verified Filings' },
            { label: 'CLEAN', sub: 'Format & Check' },
            { label: 'COMPARE', sub: 'Match Demand & Supply' },
            { label: 'FIND SKILL GAPS', sub: 'Identify Shortages' },
            { label: 'FORECAST', sub: 'Expected Demand' },
            { label: 'PLANNING INSIGHT', sub: 'Training Advisory' },
          ].map((item, idx) => (
            <div key={idx} className="relative flex flex-col items-center">
              <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[10px] inline-flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="font-bold text-white text-[11px]">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.sub}</p>
              </div>
              {idx < 5 && (
                <div className="hidden" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile / Tablet Step Flow */}
        <div className="lg:hidden flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-slate-800 text-indigo-300 font-bold">DATA</span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-indigo-300 font-bold">CLEAN</span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-indigo-300 font-bold">COMPARE</span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-indigo-300 font-bold">FIND SKILL GAPS</span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-indigo-300 font-bold">FORECAST</span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-emerald-300 font-bold">PLANNING INSIGHT</span>
        </div>
      </div>

      {/* 7 Core Steps in Plain English */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          The 7 Key Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {step.num}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                      <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">{step.shortLabel}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                    {step.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pl-10">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why This Matters to Planners & Citizens */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 sm:p-6 text-slate-800 space-y-2">
        <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Core Principle: Honest Decision Support</span>
        </h3>
        <p className="text-xs text-emerald-900/90 leading-relaxed">
          SkillPulse provides decision-makers with grounded evidence about local employer demand and worker availability.
          It never invents fake data or forces rigid quotas. Where data is unavailable for a district, it transparently tells you so, ensuring every policy recommendation is trustworthy.
        </p>
      </div>

      {/* Advanced Technical Details Collapsed Accordion (CLOSED by default) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FileCode className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Technical Details & Mathematical Reference
              </span>
              <span className="text-[11px] text-slate-500">
                Optional reference for data scientists, statisticians, and auditors (Closed by default)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600">
              {showTechnicalDetails ? 'Hide Technical Information' : 'Show Technical Information'}
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </div>
        </button>

        {showTechnicalDetails && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/60 space-y-4 text-xs text-slate-700 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Workforce Supply Formulation</span>
                <code className="text-[11px] text-indigo-700 bg-indigo-50/70 px-2 py-1 rounded block font-mono">
                  Supply_eff = Workers_reg + (Placed_cert × 0.70)
                </code>
                <p className="text-[11px] text-slate-600">
                  Separates active seekers in e-Shram from institutional cohorts, weighting certified placed graduates by historical retention.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Potential Skill Gap</span>
                <code className="text-[11px] text-indigo-700 bg-indigo-50/70 px-2 py-1 rounded block font-mono">
                  Gap = Demand - Supply_eff
                </code>
                <p className="text-[11px] text-slate-600">
                  Evaluated strictly on identical spatial and temporal boundaries. Positive numbers indicate shortages (&gt;+15%); negative indicate surpluses (&lt;-15%).
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Trend Estimation (OLS)</span>
                <code className="text-[11px] text-indigo-700 bg-indigo-50/70 px-2 py-1 rounded block font-mono">
                  y(t) = β₀ + β₁·t
                </code>
                <p className="text-[11px] text-slate-600">
                  Evaluated using MAE, RMSE, and R² variance with Student's t distribution confidence intervals. Requires n ≥ 4 historical periods.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              Note: The backend maintains complete econometric and statistical validation routines. All parameters are available to technical researchers upon request.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
