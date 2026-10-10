import type { ActionableInsight } from '../../types';

interface InsightCardProps {
  data: ActionableInsight;
  onAction?: (actionId: string) => void;
}

function InsightCard({ data, onAction }: InsightCardProps) {
  const handleClick = () => {
    if (onAction) {
      onAction(data.id);
    }
  };

  const isCritical = data.priority === 'critical';
  const isHigh = data.priority === 'high';

  return (
    <div className={`p-3.5 rounded-xl border bg-white shadow-xs flex flex-col gap-2.5 transition-all ${
      isCritical
        ? 'border-l-4 border-l-[#B42318] border-[#FECACA] bg-[#FEF2F2]/30'
        : isHigh
        ? 'border-l-4 border-l-[#B54708] border-[#FEDF89] bg-[#FFFAEB]/30'
        : 'border-l-4 border-l-[#2563A6] border-[#D9E1EA]'
    }`}>
      {/* 1. Header: Badge, Title & Freshness */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isCritical
              ? 'bg-[#FEF2F2] text-[#B42318] border border-[#FECACA]'
              : isHigh
              ? 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]'
              : 'bg-[#EFF6FF] text-[#2563A6] border border-[#BFDBFE]'
          }`}>
            {isCritical ? '● Critical' : isHigh ? '▲ High' : 'Notice'}
          </span>
          <h4 className="text-xs font-extrabold text-black leading-snug">
            {data.title}
          </h4>
        </div>
        <span className="text-[10.5px] text-black font-bold font-mono shrink-0 whitespace-nowrap">
          {data.freshness}
        </span>
      </div>

      {/* 2. Narrative Content: Incident & Operational Impact */}
      <div className="text-[11.5px] space-y-1.5 leading-relaxed">
        <div className="text-black">
          <strong className="text-black font-extrabold mr-1">Incident:</strong>
          {data.whatHappened}
        </div>
        <div className="text-black">
          <strong className="text-black font-extrabold mr-1">Operational Impact:</strong>
          {data.whyItMatters}
        </div>
      </div>

      {/* 3. Footer: Source & Clean Action Button */}
      <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-2">
        <span className="text-[10px] text-black font-semibold font-mono truncate" title={data.source}>
          Source: {data.source}
        </span>
        <button
          type="button"
          onClick={handleClick}
          className="px-3 py-1 rounded-lg text-xs font-bold text-black bg-white border border-black/20 hover:bg-black/5 transition shadow-xs whitespace-nowrap cursor-pointer shrink-0"
        >
          {data.actionLabel}
        </button>
      </div>
    </div>
  );
}

interface InsightsPanelProps {
  insights: ActionableInsight[];
  onAction?: (actionId: string) => void;
}

export default function InsightsPanel({ insights, onAction }: InsightsPanelProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between pb-1">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5">
          <span>Operational Situation Alerts</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
        </div>
        <span className="text-[9.5px] font-mono text-black font-bold bg-black/5 px-2 py-0.5 rounded border border-black/15">
          DERIVED SENSOR DATA
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {insights.map((insight) => (
          <InsightCard key={insight.id} data={insight} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

