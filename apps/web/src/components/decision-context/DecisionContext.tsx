import { useState } from 'react';
import type { DecisionContextData } from '../../types';
import { DataSemanticBadge } from '../common/Badge';

interface DecisionContextProps {
  data: DecisionContextData;
  initialExpanded?: boolean;
}

type TabKey = 'evidence' | 'findings' | 'constraints' | 'alternatives' | 'uncertainties';

export default function DecisionContext({
  data,
  initialExpanded = false,
}: DecisionContextProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [activeTab, setActiveTab] = useState<TabKey>('findings');

  return (
    <div className="rounded border border-indigo-200 bg-indigo-50/40 overflow-hidden text-xs">
      {/* ============================================================ */}
      {/* 1. COLLAPSED AT-A-GLANCE HEADER ROW                          */}
      {/* ============================================================ */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-950 flex items-center justify-between hover:bg-indigo-50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-indigo-950 text-[11px] flex items-center gap-1.5">
            <span>🔍</span>
            <span>WHY THIS PLAN? (Decision Context)</span>
          </span>
          <span className="text-[10px] text-indigo-900 font-medium bg-white/90 px-2 py-0.5 rounded border border-indigo-200 font-mono-code">
            Capacity ✓ · Route viability ✓ · Distance · Medical coverage
          </span>
        </div>
        <span className="text-[9.5px] font-bold text-indigo-700 shrink-0 ml-2">
          {isExpanded ? 'HIDE ▲' : 'EXPAND EVIDENCE ▼'}
        </span>
      </button>

      {/* ============================================================ */}
      {/* 2. EXPANDED MULTI-CRITERIA EVIDENCE DOSSIER                 */}
      {/* ============================================================ */}
      {isExpanded && (
        <div className="bg-white border-t border-indigo-200 flex flex-col">
          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 px-2 pt-1 gap-1 overflow-x-auto text-[10.5px]">
            <button
              type="button"
              onClick={() => setActiveTab('findings')}
              className={`px-2.5 py-1.5 font-bold border-b-2 transition-colors ${
                activeTab === 'findings'
                  ? 'border-indigo-800 text-indigo-900 bg-white rounded-t'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Findings & Problem
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`px-2.5 py-1.5 font-bold border-b-2 transition-colors ${
                activeTab === 'evidence'
                  ? 'border-indigo-800 text-indigo-900 bg-white rounded-t'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Source Evidence ({data.evidence.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('constraints')}
              className={`px-2.5 py-1.5 font-bold border-b-2 transition-colors ${
                activeTab === 'constraints'
                  ? 'border-indigo-800 text-indigo-900 bg-white rounded-t'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Constraints & Criteria ({data.constraints.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('alternatives')}
              className={`px-2.5 py-1.5 font-bold border-b-2 transition-colors ${
                activeTab === 'alternatives'
                  ? 'border-indigo-800 text-indigo-900 bg-white rounded-t'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Alternatives ({data.alternatives.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('uncertainties')}
              className={`px-2.5 py-1.5 font-bold border-b-2 transition-colors ${
                activeTab === 'uncertainties'
                  ? 'border-indigo-800 text-indigo-900 bg-white rounded-t'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              5. Uncertainties & Impact
            </button>
          </div>

          {/* Tab 1: Problem & Derived Findings */}
          {activeTab === 'findings' && (
            <div className="p-3 space-y-2.5">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500">Operational Assessment Objective</span>
                  <DataSemanticBadge type="DERIVED_DATA" className="text-[7.5px] px-1 py-0" />
                </div>
                <div className="text-[11.5px] font-bold text-slate-900 leading-snug">
                  {data.problem.narrative}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[10.5px] text-slate-600">
                  <span><strong>Habitation:</strong> {data.problem.targetHabitation}</span>
                  <span><strong>Risk Severity:</strong> <span className="text-red-700 font-bold">{data.problem.riskSeverity} ({data.problem.riskIndex}%)</span></span>
                </div>
              </div>

              <div>
                <div className="text-[9.5px] uppercase font-bold text-slate-600 mb-1">
                  Derived Operational Conclusions (Synthesized from Telemetry)
                </div>
                <div className="space-y-1.5">
                  {data.derivedFindings.map((finding) => (
                    <div key={finding.id} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-slate-900 text-[11px]">{finding.label}</div>
                        <div className="text-[10.5px] text-slate-700">{finding.finding}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono-code font-bold text-[10px] shrink-0">
                        {finding.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Source Evidence */}
          {activeTab === 'evidence' && (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between text-[9.5px] font-bold uppercase text-slate-600 mb-0.5">
                <span>Authoritative Ground & Remote Telemetry Feeds</span>
                <DataSemanticBadge type="SOURCE_DATA" className="text-[7.5px] px-1 py-0" />
              </div>
              <div className="space-y-1.5">
                {data.evidence.map((ev) => (
                  <div key={ev.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-extrabold text-slate-900 text-[11px]">{ev.sourceAgency}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono-code ${
                        ev.status === 'stale' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {ev.status === 'stale' ? '⚠ Stale Telemetry' : '✓ Verified Feed'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mb-1">{ev.sourceType} · {ev.timestamp}</div>
                    <div className="text-[11px] text-slate-800 bg-white p-1.5 rounded border border-slate-200 font-medium">
                      {ev.observation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Constraints & Criteria */}
          {activeTab === 'constraints' && (
            <div className="p-3 space-y-2.5">
              <div>
                <div className="text-[9.5px] uppercase font-bold text-slate-600 mb-1">
                  Evaluated Operational Constraints
                </div>
                <div className="space-y-1.5">
                  {data.constraints.map((con) => (
                    <div key={con.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-slate-900 text-[11px]">{con.name}</span>
                        <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded ${
                          con.status === 'SATISFIED'
                            ? 'bg-emerald-100 text-emerald-900'
                            : con.status === 'REQUIRES_VERIFICATION'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-red-100 text-red-900'
                        }`}>
                          {con.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mb-1">{con.description}</div>
                      <div className="text-[10.5px] text-slate-700 bg-white p-1 rounded border border-slate-200">
                        <strong className="text-slate-900">Impact:</strong> {con.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[9.5px] uppercase font-bold text-slate-600 mb-1">
                  Configured Multi-Criteria Decision Weights
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {data.criteria.map((crit) => (
                    <div key={crit.id} className="p-1.5 rounded bg-slate-50 border border-slate-200 text-[10px]">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{crit.name}</span>
                        <span className="text-emerald-700 font-bold">✓ Satisfied</span>
                      </div>
                      <div className="text-[9px] text-slate-500">{crit.weightDescription}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Alternatives Considered */}
          {activeTab === 'alternatives' && (
            <div className="p-3 space-y-2">
              <div className="text-[9.5px] uppercase font-bold text-slate-600 mb-0.5">
                Candidate Scenarios & Rejection Rationales
              </div>
              <div className="space-y-2">
                {data.alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className={`p-2.5 rounded border text-xs ${
                      alt.status === 'SELECTED'
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-extrabold text-slate-900 text-[11.5px]">{alt.name}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                        alt.status === 'SELECTED'
                          ? 'bg-emerald-200 text-emerald-900'
                          : alt.status === 'REJECTED'
                          ? 'bg-red-100 text-red-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {alt.status}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-700 mb-1">{alt.summary}</div>
                    <div className="text-[10px] text-slate-600 italic bg-white/80 p-1.5 rounded border border-slate-200">
                      <strong>Rationale:</strong> {alt.reason}
                    </div>
                    {alt.constraintViolations && alt.constraintViolations.length > 0 && (
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {alt.constraintViolations.map((v, i) => (
                          <span key={i} className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800">
                            ✕ {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Uncertainties & Assumptions */}
          {activeTab === 'uncertainties' && (
            <div className="p-3 space-y-2.5 text-xs text-slate-700">
              <div>
                <span className="font-bold text-amber-900 block uppercase text-[9.5px] mb-1">
                  Active Uncertainties & Stale Telemetry
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                  {data.uncertainties.map((u, i) => (
                    <li key={i} className="text-amber-950 font-medium">{u}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold text-slate-900 block uppercase text-[9.5px] mb-1">
                  Baseline Planning Assumptions
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-[10.5px]">
                  {data.assumptions.map((a, i) => (
                    <li key={i} className="text-slate-700">{a}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold text-slate-900 block uppercase text-[9.5px] mb-1">
                  Expected Operational Impacts
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-[10.5px]">
                  {data.impacts.map((imp, i) => (
                    <li key={i} className="text-slate-700">{imp}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] italic text-slate-500">
                "AEGIS provides advisory decision support based on deterministic constraint filtering. Statutory approval is required."
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
