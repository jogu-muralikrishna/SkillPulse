import React from 'react';
import { QualityLevel } from '../types';
import { ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DataQualityIndicatorProps {
  level: QualityLevel | 'Good' | 'Partial' | 'Limited';
  reason?: string;
  compact?: boolean;
}

export const DataQualityIndicator: React.FC<DataQualityIndicatorProps> = ({ level, reason, compact = false }) => {
  // Map technical levels (High, Medium, Low) to user-friendly labels (Good, Partial, Limited)
  const normalizedLevel = (level === 'High' || level === 'Good')
    ? 'Good'
    : (level === 'Medium' || level === 'Partial')
    ? 'Partial'
    : 'Limited';

  const getColors = () => {
    switch (normalizedLevel) {
      case 'Good':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          icon: CheckCircle2,
          defaultExplanation: 'Good: Enough recent data is available for this analysis.'
        };
      case 'Partial':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          icon: AlertTriangle,
          defaultExplanation: 'Partial: Some information is available, but certain locations or skills are missing.'
        };
      case 'Limited':
      default:
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-800',
          icon: AlertCircle,
          defaultExplanation: 'Limited: There is not enough information to produce a reliable result.'
        };
    }
  };

  const config = getColors();
  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${config.bg} ${config.text} border ${config.border}`}
        title={reason || config.defaultExplanation}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>Data Quality: {normalizedLevel}</span>
      </span>
    );
  }

  return (
    <div className={`p-3 rounded-xl border ${config.bg} ${config.border} text-xs space-y-1`}>
      <div className="flex items-center gap-2 font-bold">
        <Icon className={`w-4 h-4 ${config.text}`} />
        <span className={config.text}>Data Quality: {normalizedLevel}</span>
      </div>
      <p className="text-slate-700 pl-6 leading-relaxed">
        {reason || config.defaultExplanation}
      </p>
    </div>
  );
};
