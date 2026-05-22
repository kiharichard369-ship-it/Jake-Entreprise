import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: number; // percentage
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, icon, iconBg = 'bg-blue-50', trend, sub, accent = 'border-blue-500' }: StatCardProps) {
  return (
    <div className={`card p-5 border-l-4 ${accent} flex items-start gap-4`}>
      {icon && (
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
        {(trend !== undefined || sub) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(trend)}%
              </span>
            )}
            {sub && <span className="text-xs text-gray-400">{sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
