import React from 'react';
import { DataCoverageStatus } from '../types';
import { CheckCircle2, AlertCircle, Info, ShieldCheck, Check, Minus } from 'lucide-react';

interface DataCoverageCardProps {
  coverage: DataCoverageStatus | null;
  className?: string;
  compact?: boolean;
  domain?: 'all' | 'demand' | 'supply' | 'training' | 'forecast' | 'gaps';
}

export const DataCoverageCard: React.FC<DataCoverageCardProps> = ({
  coverage,
  className = '',
  compact = false,
  domain = 'all'
}) => {
  if (!coverage) return null;

  const isUnavailable = coverage.demandStatus === 'UNAVAILABLE' && coverage.workerSupplyStatus === 'UNAVAILABLE' && coverage.trainingStatus === 'UNAVAILABLE';
  const hasDemandOnly = coverage.demandStatus === 'AVAILABLE' && coverage.workerSupplyStatus === 'UNAVAILABLE';
  const hasSupplyOnly = coverage.demandStatus === 'UNAVAILABLE' && (coverage.workerSupplyStatus === 'AVAILABLE' || coverage.trainingStatus === 'AVAILABLE');
  const isDemandVerified = coverage.demandVerificationStatus === 'VERIFIED_INGESTED';

  // Domain-specific date display text (ensures Supply never leaks Demand dates)
  let periodText = 'Records available';
  if (domain === 'supply') {
    periodText = coverage.supplyDate && coverage.supplyDate !== 'Unavailable'
      ? `Supply data period: ${coverage.supplyDate}`
      : 'Supply data period: Unavailable';
  } else if (domain === 'demand') {
    periodText = coverage.demandDate && coverage.demandDate !== 'Unavailable'
      ? `Demand data period: ${coverage.demandDate}`
      : 'Demand data period: Unavailable';
  } else if (domain === 'training') {
    periodText = coverage.trainingDate && coverage.trainingDate !== 'Unavailable'
      ? `Training data period: ${coverage.trainingDate}`
      : 'Training data period: Unavailable';
  } else {
    if (coverage.workerSupplyStatus === 'UNAVAILABLE' && coverage.demandStatus === 'AVAILABLE') {
      periodText = coverage.demandDate && coverage.demandDate !== 'Unavailable'
        ? `Demand period: ${coverage.demandDate} (Supply: Unavailable)`
        : 'Supply: Unavailable';
    } else if (coverage.latestDate && coverage.latestDate !== 'Unavailable') {
      periodText = `Latest observed data: ${coverage.latestDate}`;
    } else {
      periodText = 'Data period: Unavailable';
    }
  }

  // Verification-aware status badge text
  let badgeText = 'Labour Data Unavailable';
  if (isUnavailable) {
    badgeText = 'Labour Data Unavailable';
  } else if (hasDemandOnly) {
    badgeText = isDemandVerified
      ? 'Partial Data — Demand Available, Supply Unavailable'
      : 'Partial Data — Demand Available, Verification Pending';
  } else if (hasSupplyOnly) {
    badgeText = 'Partial Data — Supply Available, Demand Unavailable';
  } else if (coverage.gapStatus === 'NON_COMPARABLE') {
    badgeText = isDemandVerified
      ? 'Partial Data — Demand Available, Supply Non-Comparable'
      : 'Partial Data — Demand Available, Verification Pending';
  } else if (coverage.demandStatus === 'AVAILABLE' && coverage.workerSupplyStatus === 'AVAILABLE') {
    badgeText = isDemandVerified
      ? 'Verified Data — Demand & Supply Available'
      : 'Data Available — Verification Pending';
  }

  if (compact) {
    if (isUnavailable) {
      return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-medium">District verified</span>
          <span className="text-amber-700">• Labour-market data unavailable for this district.</span>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="font-medium">{coverage.districtName}, {coverage.stateName}</span>
        <span className="text-emerald-700">• {periodText}</span>
      </div>
    );
  }

  // Full detailed card when district has unavailable data
  if (isUnavailable) {
    return (
      <div className={`bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5 text-slate-800 space-y-3 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/90 text-amber-900 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              District verified
            </span>
            <span className="text-xs text-amber-800">
              Official Local Government Directory (LGD) record verified
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
            {coverage.districtName}, {coverage.stateName}
          </span>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-amber-950 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Labour-market data unavailable for this district
          </h4>
          <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
            This district is an official administrative unit of India, but verified workforce and training records have not yet been ingested for this district.
          </p>
        </div>

        {/* 4-Dimension Availability Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2 rounded bg-white/80 border border-amber-200 text-center">
            <span className="text-[10px] text-slate-500 block">Job Demand</span>
            <span className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Minus className="w-3 h-3" /> Unavailable
            </span>
          </div>
          <div className="p-2 rounded bg-white/80 border border-amber-200 text-center">
            <span className="text-[10px] text-slate-500 block">Workforce Supply</span>
            <span className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Minus className="w-3 h-3" /> Unavailable
            </span>
          </div>
          <div className="p-2 rounded bg-white/80 border border-amber-200 text-center">
            <span className="text-[10px] text-slate-500 block">Skill Gap</span>
            <span className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Minus className="w-3 h-3" /> Cannot calculate
            </span>
          </div>
          <div className="p-2 rounded bg-white/80 border border-amber-200 text-center">
            <span className="text-[10px] text-slate-500 block">Training Capacity</span>
            <span className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Minus className="w-3 h-3" /> Unavailable
            </span>
          </div>
        </div>

        {/* Zero Fake Data Notice */}
        <div className="p-2.5 bg-white/90 rounded-lg border border-amber-200 text-[11px] text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            Zero-Fake-Data Standard:
          </div>
          <p>
            Missing data is <strong>NOT zero</strong>. We never display false zeros (Demand = 0, Supply = 0, Gap = 0) when official filings are absent.
            <span className="block text-slate-500 mt-0.5">
              {domain === 'supply'
                ? 'Supply records baseline: Ingestion pending from official registries'
                : periodText}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Partial or Non-Comparable Data Available
  if (hasDemandOnly || hasSupplyOnly || coverage.gapStatus === 'NON_COMPARABLE') {
    return (
      <div className={`bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5 text-slate-800 space-y-3 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 text-xs font-semibold">
              <Info className="w-3.5 h-3.5 text-blue-700" />
              {badgeText}
            </span>
            <span className="text-xs text-blue-800">
              {coverage.districtName}, {coverage.stateName}
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-blue-200">
            {periodText}
          </span>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-blue-950">
            {hasDemandOnly
              ? 'Demand data available. Comparable workforce data is not available for this selection, so a skill gap cannot be calculated.'
              : hasSupplyOnly
              ? 'Workforce data available. Comparable demand data is not available for this selection.'
              : 'Demand records exist, but comparable workforce records are unavailable on identical geographic boundaries.'}
          </h4>
        </div>

        {/* 4-Dimension Availability Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="p-2 rounded bg-white/80 border border-blue-200 text-center">
            <span className="text-[10px] text-slate-500 block">Job Demand</span>
            {coverage.demandStatus === 'AVAILABLE' ? (
              <span className="font-semibold text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" /> Available
              </span>
            ) : (
              <span className="font-medium text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                <Minus className="w-3.5 h-3.5" /> Unfiled
              </span>
            )}
          </div>

          <div className="p-2 rounded bg-white/80 border border-blue-200 text-center">
            <span className="text-[10px] text-slate-500 block">Workforce Supply</span>
            {coverage.workerSupplyStatus === 'AVAILABLE' ? (
              <span className="font-semibold text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" /> Available
              </span>
            ) : (
              <span className="font-medium text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                <Minus className="w-3.5 h-3.5" /> Unfiled
              </span>
            )}
          </div>

          <div className="p-2 rounded bg-white/80 border border-blue-200 text-center">
            <span className="text-[10px] text-slate-500 block">Potential Skill Gap</span>
            <span className="font-medium text-amber-700 flex items-center justify-center gap-1 mt-0.5">
              <Minus className="w-3.5 h-3.5" /> Cannot calculate
            </span>
          </div>

          <div className="p-2 rounded bg-white/80 border border-blue-200 text-center">
            <span className="text-[10px] text-slate-500 block">Training Capacity</span>
            {coverage.trainingStatus === 'AVAILABLE' ? (
              <span className="font-semibold text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" /> Available
              </span>
            ) : (
              <span className="font-medium text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                <Minus className="w-3.5 h-3.5" /> Unfiled
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full Active Data Available
  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {badgeText}
          </span>
          <span className="font-medium text-slate-900">
            {coverage.districtName}, {coverage.stateName}
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          {periodText}
        </span>
      </div>
      <p className="text-[11px] text-slate-600">
        Empirical records verified across primary source documents.
      </p>
    </div>
  );
};
