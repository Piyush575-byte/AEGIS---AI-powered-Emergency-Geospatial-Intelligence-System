import React from 'react';
import type { AuditEvent, AuditOriginType } from '../../types';
import { AuthorityBadge } from '../common/AuthorityBadge';

interface AuditTimelineProps {
  events: AuditEvent[];
  selectedEventId: string | null;
  filterOrigin: string;
  filterPlan: string;
  searchQuery: string;
  onSelectEvent: (eventId: string) => void;
  onFilterOriginChange: (origin: string) => void;
  onFilterPlanChange: (plan: string) => void;
  onSearchQueryChange: (query: string) => void;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  events,
  selectedEventId,
  filterOrigin,
  filterPlan,
  searchQuery,
  onSelectEvent,
  onFilterOriginChange,
  onFilterPlanChange,
  onSearchQueryChange,
}) => {
  const getOriginBadge = (origin: AuditOriginType) => {
    switch (origin) {
      case 'HUMAN_STATUTORY':
        return (
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
            HUMAN STATUTORY
          </span>
        );
      case 'FIELD_REPORT':
        return (
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-950 border border-blue-300">
            FIELD REPORT
          </span>
        );
      case 'SYSTEM_ADVISORY':
        return (
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
            SYSTEM ADVISORY
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden flex flex-col h-full text-xs">
      {/* Filter Toolbar */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9.5px] font-extrabold uppercase text-slate-500">Origin:</span>
          <button
            type="button"
            onClick={() => onFilterOriginChange('ALL')}
            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
              filterOrigin === 'ALL'
                ? 'bg-navy-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onFilterOriginChange('HUMAN_STATUTORY')}
            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
              filterOrigin === 'HUMAN_STATUTORY'
                ? 'bg-emerald-800 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Human Statutory
          </button>
          <button
            type="button"
            onClick={() => onFilterOriginChange('FIELD_REPORT')}
            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
              filterOrigin === 'FIELD_REPORT'
                ? 'bg-blue-800 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Field Reports
          </button>
          <span className="text-[9.5px] font-extrabold uppercase text-slate-500 ml-2">Plan:</span>
          <button
            type="button"
            onClick={() => onFilterPlanChange('ALL')}
            className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
              filterPlan === 'ALL'
                ? 'bg-navy-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onFilterPlanChange('V1')}
            className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
              filterPlan === 'V1'
                ? 'bg-blue-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Plan V1
          </button>
          <button
            type="button"
            onClick={() => onFilterPlanChange('V2')}
            className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
              filterPlan === 'V2'
                ? 'bg-blue-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Plan V2
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search event / entity..."
            className="px-2 py-0.5 text-[11px] rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-navy-800"
          />
        </div>
      </div>

      {/* Chronological Event Stream */}
      <div className="p-2 space-y-1.5 overflow-y-auto max-h-[620px]">
        {events.map((ev) => {
          const isSelected = ev.eventId === selectedEventId;
          const isTampered = ev.verificationStatus === 'TAMPERED';

          return (
            <div
              key={ev.eventId}
              onClick={() => onSelectEvent(ev.eventId)}
              className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                isSelected
                  ? 'border-navy-900 bg-blue-50/70 ring-1 ring-navy-800 shadow-xs'
                  : isTampered
                  ? 'border-red-400 bg-red-50/80 hover:bg-red-100/60'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono-code font-bold text-[10.5px] text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                    #{ev.sequenceNumber} · {ev.simulatedTimestamp}
                  </span>
                  {getOriginBadge(ev.originType)}
                  <AuthorityBadge role={ev.actorRole} />
                </div>

                <span className="font-mono-code text-[9px] text-slate-500">
                  Hash: {ev.currentHash.slice(0, 8)}...
                </span>
              </div>

              <div className="font-extrabold text-slate-900 text-[12.5px] mb-0.5">
                {ev.title}
              </div>

              <div className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                {ev.reason}
              </div>

              <div className="mt-1.5 pt-1 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono-code">
                <span>
                  Entity: <strong className="text-slate-800">{ev.affectedEntityId}</strong>
                </span>
                {ev.previousState && ev.newState && (
                  <span>
                    {ev.previousState} → <strong className="text-navy-900">{ev.newState}</strong>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditTimeline;
