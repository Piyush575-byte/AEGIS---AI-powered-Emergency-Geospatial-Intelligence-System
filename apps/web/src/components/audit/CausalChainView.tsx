import React from 'react';

interface CausalNode {
  id: string;
  eventId: string;
  stepNumber: number;
  time: string;
  label: string;
  sublabel: string;
  actor: string;
  type: 'trigger' | 'incident' | 'constraint' | 'impact' | 'invalidation' | 'evaluation' | 'plan' | 'approval' | 'active';
}

const CAUSAL_NODES: CausalNode[] = [
  {
    id: 'node-field-report',
    eventId: 'evt-06-r104-fail',
    stepNumber: 6,
    time: '14:20 IST',
    label: 'FIELD REPORT',
    sublabel: 'Bridge Culvert Breach',
    actor: 'Field Squad (Vythiri)',
    type: 'trigger',
  },
  {
    id: 'node-r104-blocked',
    eventId: 'evt-06-r104-fail',
    stepNumber: 6,
    time: '14:20 IST',
    label: 'R104 BLOCKED',
    sublabel: 'Impassable at KM 4.2',
    actor: 'PWD / Revenue Squad',
    type: 'incident',
  },
  {
    id: 'node-constraint-failed',
    eventId: 'evt-07-v1-invalidation',
    stepNumber: 7,
    time: '14:21 IST',
    label: 'CONSTRAINT FAILED',
    sublabel: 'Route Viability Violated',
    actor: 'AEGIS Advisory Engine',
    type: 'constraint',
  },
  {
    id: 'node-150-affected',
    eventId: 'evt-07-v1-invalidation',
    stepNumber: 7,
    time: '14:21 IST',
    label: '150 EVACUEES SEVERED',
    sublabel: 'Transit to Meppadi Lost',
    actor: 'Demographic Baseline',
    type: 'impact',
  },
  {
    id: 'node-v1-invalidated',
    eventId: 'evt-07-v1-invalidation',
    stepNumber: 7,
    time: '14:21 IST',
    label: 'PLAN V1 INVALIDATED',
    sublabel: 'Causal Failure Logged',
    actor: 'AEGIS Advisory Engine',
    type: 'invalidation',
  },
  {
    id: 'node-alt-search',
    eventId: 'evt-08-alternative-search',
    stepNumber: 8,
    time: '14:22 IST',
    label: 'ALTERNATIVE SEARCH',
    sublabel: 'R212 & R318 Evaluated',
    actor: 'Multi-Criteria Engine',
    type: 'evaluation',
  },
  {
    id: 'node-v2-generated',
    eventId: 'evt-09-plan-v2',
    stepNumber: 9,
    time: '14:23 IST',
    label: 'PLAN V2 GENERATED',
    sublabel: 'Rebalanced Allocations',
    actor: 'AEGIS Advisory Engine',
    type: 'plan',
  },
  {
    id: 'node-collector-approval',
    eventId: 'evt-10-v2-approval',
    stepNumber: 10,
    time: '14:24 IST',
    label: 'COLLECTOR APPROVAL',
    sublabel: 'Statutory DM Act Concurrence',
    actor: 'District Collector (DDMA)',
    type: 'approval',
  },
  {
    id: 'node-v2-active',
    eventId: 'evt-10-v2-approval',
    stepNumber: 10,
    time: '14:24 IST',
    label: 'PLAN V2 ACTIVE',
    sublabel: '1,495 / 1,495 Promulgated',
    actor: 'Incident Commander',
    type: 'active',
  },
];

interface CausalChainViewProps {
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

export const CausalChainView: React.FC<CausalChainViewProps> = ({
  selectedEventId,
  onSelectEvent,
}) => {
  const getNodeContainerStyle = (type: CausalNode['type'], isSelected: boolean) => {
    if (isSelected) {
      if (type === 'trigger' || type === 'incident') {
        return 'bg-red-100 border-red-600 ring-2 ring-red-500 shadow-xs';
      }
      if (type === 'constraint' || type === 'impact' || type === 'invalidation') {
        return 'bg-amber-100 border-amber-600 ring-2 ring-amber-500 shadow-xs';
      }
      return 'bg-blue-100/90 border-blue-600 ring-2 ring-blue-500 shadow-xs';
    }

    switch (type) {
      case 'trigger':
      case 'incident':
        return 'bg-red-50 border-red-200 hover:bg-red-100/80';
      case 'constraint':
      case 'impact':
      case 'invalidation':
        return 'bg-amber-50 border-amber-200 hover:bg-amber-100/80';
      case 'evaluation':
        return 'bg-slate-50 border-slate-200 hover:bg-slate-100';
      case 'plan':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'approval':
      case 'active':
        return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
      default:
        return 'bg-slate-50 border-slate-200 hover:bg-slate-100';
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs p-3 space-y-2">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
            ⚡ Forensic Causal Sequence: R104 Breach → Plan V1 Invalidation → Plan V2 Dynamic Reassignment
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono-code">
          Click any node to inspect audit event
        </span>
      </div>

      {/* Horizontal Scrollable Causal Graph */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-thin">
        {CAUSAL_NODES.map((node, idx) => {
          const isSelected = selectedEventId === node.eventId;
          const isIncidentType = node.type === 'trigger' || node.type === 'incident';
          const isWarningType = node.type === 'constraint' || node.type === 'impact' || node.type === 'invalidation';
          const isPlanType = node.type === 'plan' || node.type === 'evaluation';
          const isSuccessType = node.type === 'approval' || node.type === 'active';

          return (
            <React.Fragment key={node.id}>
              <button
                type="button"
                onClick={() => onSelectEvent(node.eventId)}
                className={`p-2 rounded border text-left shrink-0 transition-all flex flex-col min-w-[135px] cursor-pointer ${getNodeContainerStyle(
                  node.type,
                  isSelected
                )}`}
              >
                {/* Header: Step Number & Timestamp */}
                <div className="flex items-center justify-between text-[9.5px] font-mono-code font-bold mb-0.5">
                  <span
                    className={
                      isSelected
                        ? isIncidentType
                          ? 'text-red-950'
                          : isWarningType
                          ? 'text-amber-950'
                          : 'text-navy-950'
                        : isIncidentType
                        ? 'text-red-900'
                        : isWarningType
                        ? 'text-amber-900'
                        : 'text-slate-600'
                    }
                  >
                    S{node.stepNumber}
                  </span>
                  <span
                    className={
                      isSelected
                        ? isIncidentType
                          ? 'text-red-900'
                          : 'text-slate-700'
                        : 'text-slate-500'
                    }
                  >
                    {node.time}
                  </span>
                </div>

                {/* Primary Action Label */}
                <div
                  className={`font-black text-[11px] leading-tight mb-0.5 ${
                    isSelected
                      ? isIncidentType
                        ? 'text-red-950'
                        : isWarningType
                        ? 'text-amber-950'
                        : isPlanType
                        ? 'text-navy-950'
                        : 'text-emerald-950'
                      : isIncidentType
                      ? 'text-red-950'
                      : isWarningType
                      ? 'text-amber-950'
                      : isPlanType
                      ? 'text-blue-950'
                      : isSuccessType
                      ? 'text-emerald-950'
                      : 'text-slate-900'
                  }`}
                >
                  {node.label}
                </div>

                {/* Secondary Context Sublabel */}
                <div
                  className={`text-[9.5px] font-bold leading-tight ${
                    isSelected
                      ? isIncidentType
                        ? 'text-red-900'
                        : isWarningType
                        ? 'text-amber-900'
                        : 'text-blue-900'
                      : isIncidentType
                      ? 'text-red-800'
                      : isWarningType
                      ? 'text-amber-800'
                      : 'text-slate-700'
                  }`}
                >
                  {node.sublabel}
                </div>

                {/* Actor & Authority Provenance */}
                <div
                  className={`text-[8.5px] font-mono-code mt-1 truncate ${
                    isSelected
                      ? isIncidentType
                        ? 'text-red-800 font-semibold'
                        : 'text-slate-700 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  {node.actor}
                </div>
              </button>

              {idx < CAUSAL_NODES.length - 1 && (
                <span className="text-slate-400 font-black text-sm shrink-0 select-none">
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CausalChainView;
