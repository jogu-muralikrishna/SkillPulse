import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  badge?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  badge
}) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 tracking-normal">{label}</span>
        {badge ? (
          badge
        ) : Icon ? (
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <Icon className="w-4 h-4" />
          </div>
        ) : null}
      </div>

      <div className="my-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>

      {(subtext || trend) && (
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          {trend && (
            <span
              className={`font-semibold tabular-nums ${
                trend.isPositive ? 'text-emerald-600' : 'text-slate-600'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};
