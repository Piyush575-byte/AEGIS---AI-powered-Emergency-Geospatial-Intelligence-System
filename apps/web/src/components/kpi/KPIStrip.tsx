import React from 'react';
import type { KPIData } from '../../types';
import { DataSemanticBadge } from '../common/Badge';

interface KPICardProps {
  data: KPIData;
  highlight?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ data, highlight = false }) => {
  const getCardStyle = () => {
    if (highlight) {
      if (data.id === 'gap') return 'border-l-4 border-l-amber-600 bg-amber-50/40 ring-1 ring-amber-200';
      if (data.id === 'pending') return 'border-l-4 border-l-blue-800 bg-blue-50/50 ring-1 ring-blue-200';
    }
    switch (data.id) {
      case 'high-risk':
        return 'border-l-4 border-l-red-700 bg-red-50/20';
      case 'vulnerable':
        return 'border-l-4 border-l-slate-600';
      case 'shelter-cap':
        return 'border-l-4 border-l-emerald-700';
      default:
        return 'border-l-4 border-l-slate-400';
    }
  };

  const getProvenanceLabel = () => {
    switch (data.id) {
      case 'high-risk': return 'GSI / IMD Telemetry';
      case 'vulnerable': return 'Census / Panchayat Registry';
      case 'shelter-cap': return 'DDMA Shelter Registry';
      case 'gap': return 'Calculated Capacity Deficit';
      case 'pending': return 'Statutory Action Required';
      default: return 'AEGIS Verified Feed';
    }
  };

  return (
    <div className={`flex-1 min-w-[160px] bg-white border border-slate-200 rounded px-2.5 py-1.5 shadow-xs flex flex-col justify-between ${getCardStyle()}`}>
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 leading-tight">
          {data.label}
        </span>
        {data.classification && (
          <DataSemanticBadge type={data.classification} className="text-[7.5px] px-1 py-0 leading-none" />
        )}
      </div>

      <div className="flex items-baseline justify-between mt-0.5">
        <span className="text-xl font-extrabold tracking-tight text-slate-900 font-mono-code">
          {data.value.toLocaleString('en-IN')}
        </span>
        {data.trend && (
          <span className={`text-[9.5px] font-bold ${
            data.status === 'critical' ? 'text-red-700' :
            data.status === 'warning' ? 'text-amber-700' :
            data.status === 'safe' ? 'text-emerald-700' : 'text-slate-600'
          }`}>
            {data.trend === 'up' ? '▲ Up' : data.trend === 'down' ? '▼ Down' : '— Stable'}
          </span>
        )}
      </div>

      <div className="text-[8.5px] text-slate-500 font-mono-code mt-0.5 pt-0.5 border-t border-slate-100/80 truncate">
        {getProvenanceLabel()}
      </div>
    </div>
  );
};

interface KPIStripProps {
  kpis: KPIData[];
}

export const KPIStrip: React.FC<KPIStripProps> = ({ kpis }) => {
  return (
    <div className="bg-white border-b border-slate-200 px-3 py-1 flex items-stretch gap-2 overflow-x-auto shrink-0">
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.id}
          data={kpi}
          highlight={kpi.id === 'gap' || kpi.id === 'pending'}
        />
      ))}
    </div>
  );
};

export default KPIStrip;
