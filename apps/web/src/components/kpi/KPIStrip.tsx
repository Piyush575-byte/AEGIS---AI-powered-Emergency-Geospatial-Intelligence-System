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
      if (data.id === 'gap') return 'border-l-4 border-l-amber-600 bg-amber-50/60 ring-1 ring-amber-200';
      if (data.id === 'pending') return 'border-l-4 border-l-blue-700 bg-blue-50/60 ring-1 ring-blue-200';
    }
    switch (data.id) {
      case 'high-risk':
        return 'border-l-4 border-l-red-600 bg-red-50/30';
      case 'vulnerable':
        return 'border-l-4 border-l-slate-600 bg-white';
      case 'shelter-cap':
        return 'border-l-4 border-l-emerald-600 bg-emerald-50/30';
      default:
        return 'border-l-4 border-l-slate-400 bg-white';
    }
  };

  const getProvenanceLabel = () => {
    switch (data.id) {
      case 'high-risk': return 'GSI / IMD telemetry';
      case 'vulnerable': return 'Census / Panchayat registry';
      case 'shelter-cap': return 'DDMA shelter registry';
      case 'gap': return 'Calculated capacity deficit';
      case 'pending': return 'Statutory action required';
      default: return 'AEGIS verified feed';
    }
  };

  return (
    <div className={`flex-1 min-w-[190px] border border-slate-200 rounded-lg px-3.5 py-2.5 shadow-xs flex flex-col justify-between ${getCardStyle()}`}>
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <span className="text-[13px] font-semibold text-slate-700 leading-tight">
          {data.label}
        </span>
        {data.classification && (
          <DataSemanticBadge type={data.classification} className="text-[11px] px-1.5 py-0 leading-none" />
        )}
      </div>

      <div className="flex items-baseline justify-between my-1">
        <span className="text-[26px] font-bold tracking-tight text-slate-900 font-mono tabular-nums leading-none">
          {data.value.toLocaleString('en-IN')}
        </span>
        {data.trend && (
          <span className={`text-[12px] font-semibold tabular-nums ${
            data.status === 'critical' ? 'text-red-700' :
            data.status === 'warning' ? 'text-amber-700' :
            data.status === 'safe' ? 'text-emerald-700' : 'text-slate-600'
          }`}>
            {data.trend === 'up' ? '▲ Increasing' : data.trend === 'down' ? '▼ Decreasing' : '— Stable'}
          </span>
        )}
      </div>

      <div className="text-[12px] text-slate-600 mt-1 pt-1 border-t border-slate-200 truncate" title={getProvenanceLabel()}>
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
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-stretch gap-3 overflow-x-auto shrink-0">
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
