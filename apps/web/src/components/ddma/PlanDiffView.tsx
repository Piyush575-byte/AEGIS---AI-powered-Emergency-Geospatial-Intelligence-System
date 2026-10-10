import { History, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import type { PlanDiffResponse } from '../../services/api';

interface PlanDiffViewProps {
  planDiff: PlanDiffResponse | null;
}

export default function PlanDiffView({ planDiff }: PlanDiffViewProps) {
  if (!planDiff) {
    return null;
  }

  const { plan_v1, plan_v2, differences, has_v2 } = planDiff;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-slate-100 shadow-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">
              Plan Evolution: Previous Plan vs Updated Plan
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official operational record comparing Baseline Plan V1 against Revised Plan V2.
          </p>
        </div>
        <div className="text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 shrink-0">
          <span className="text-slate-400">Triggering Event: </span>
          <span className="text-red-400 font-bold">R1 Bridge Severance</span>
        </div>
      </div>

      {/* Side-by-Side Comparison: Previous Plan vs Updated Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PREVIOUS PLAN (Plan V1) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
              <History className="w-4 h-4 text-slate-400" />
              <span>PREVIOUS PLAN (Plan V1)</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
              {plan_v1.status === 'invalidated' ? 'NO LONGER FEASIBLE (INVALIDATED)' : 'ACTIVE BASELINE'}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Habitation & Evacuees</span>
              <div className="font-bold text-slate-100">
                Chooralmala ({plan_v1.allocated_population} people)
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Assigned Shelter</span>
              <div className={`font-semibold ${differences.shelter_changed ? 'line-through text-red-300' : 'text-slate-200'}`}>
                {plan_v1.shelter_name}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Evacuation Route</span>
              <div className={`font-semibold ${differences.route_changed ? 'line-through text-red-300' : 'text-slate-200'}`}>
                Route {plan_v1.route_code}: {plan_v1.route_name}
              </div>
              <div className="text-xs text-red-400 font-medium mt-0.5">
                Route status: {plan_v1.route_status.toUpperCase()}
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-2 text-xs text-slate-400">
              <span className="text-slate-400 font-medium">Reason for Invalidation: </span>
              <span className="text-slate-200">Route R1 bridge washed out at KM 4.2. Path blocked.</span>
            </div>
          </div>
        </div>

        {/* UPDATED PLAN (Plan V2) */}
        <div className={`border rounded-lg p-5 space-y-4 ${
          has_v2
            ? 'bg-blue-950/20 border-blue-800/80'
            : 'bg-slate-950/50 border-slate-800 border-dashed text-slate-400'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
              <CheckCircle2 className={`w-4 h-4 ${has_v2 ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>UPDATED PLAN (Plan V2)</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
              has_v2
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              {has_v2 ? 'APPROVED & ACTIVE' : 'PENDING DDMA APPROVAL'}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Habitation & Evacuees</span>
              <div className="font-bold text-slate-100">
                Chooralmala ({plan_v2?.allocated_population || 120} people)
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Assigned Shelter</span>
              <div className="font-bold text-emerald-300">
                {plan_v2?.shelter_name || 'Vythiri Government Higher Secondary School (Gamma)'}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Evacuation Route</span>
              <div className="font-bold text-emerald-300">
                Route {plan_v2?.route_code || 'R4'}: {plan_v2?.route_name || 'Bypass via Vythiri'}
              </div>
              <div className="text-xs text-emerald-400 font-medium mt-0.5">
                Route status: CLEAR
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-2 text-xs text-slate-400">
              <span className="text-slate-400 font-medium">Statutory Status: </span>
              <span className="text-slate-200">
                {has_v2
                  ? `Authorized by ${plan_v2?.approved_by || 'District Authority'}`
                  : 'Awaiting human authorization'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary: WHAT CHANGED? */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          WHAT CHANGED?
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-slate-900 rounded border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Shelter Destination</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-white">
              <span className="line-through text-slate-400 font-normal">Meppadi</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Vythiri GHSS</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Transit Route</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-white">
              <span className="line-through text-slate-400 font-normal">Route R1</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Route R4</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">People Affected</span>
            <div className="mt-1 font-bold text-white">
              <span>120 Evacuees</span>
              <span className="text-xs text-emerald-400 font-normal ml-2">Safely Reallocated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
