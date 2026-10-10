import { Clock, MapPin } from 'lucide-react';
import type { IncidentData } from '../../services/api';

interface SituationSectionProps {
  r1Blocked: boolean;
  incident: IncidentData | null;
  lastUpdated: Date;
}

export default function SituationSection({
  r1Blocked,
  incident,
  lastUpdated,
}: SituationSectionProps) {
  return (
    <div className={`rounded-lg border p-5 shadow-sm flex flex-col justify-between h-full transition-colors ${
      r1Blocked
        ? 'bg-red-950/40 border-red-800/80 text-slate-100'
        : 'bg-slate-900/90 border-slate-800 text-slate-100'
    }`}>
      <div className="space-y-3">
        {/* Step / Category Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. What Happened?
          </span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            r1Blocked
              ? 'bg-red-600 text-white'
              : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
          }`}>
            {r1Blocked ? 'CRITICAL INCIDENT' : 'STABLE'}
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-white leading-tight">
            {r1Blocked ? 'R1 Bridge Failure' : 'Baseline Corridor Monitoring'}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Chooralmala → Meppadi corridor
          </p>
        </div>

        {/* Operational Status Detail */}
        <div className={`p-3 rounded-md border text-sm ${
          r1Blocked
            ? 'bg-red-950/80 border-red-700/80 text-red-100'
            : 'bg-slate-950/70 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase text-slate-400">Route Status</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              r1Blocked ? 'bg-red-900 text-red-100' : 'bg-emerald-900 text-emerald-100'
            }`}>
              {r1Blocked ? 'BLOCKED' : 'CLEAR'}
            </span>
          </div>
          <div className="text-xs leading-relaxed text-slate-300">
            {r1Blocked
              ? (incident?.description || 'Primary transit bridge on Route R1 destroyed at KM 4.2 by flash flood.')
              : 'All monitored evacuation corridors operational. No active route blockage.'}
          </div>
        </div>
      </div>

      {/* Timestamp & Location Footer */}
      <div className="border-t border-slate-800/80 pt-3 mt-3 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>Wayanad District</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST</span>
        </div>
      </div>
    </div>
  );
}
