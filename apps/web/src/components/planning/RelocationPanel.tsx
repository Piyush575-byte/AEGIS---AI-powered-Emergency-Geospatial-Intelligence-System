import type { RelocationPlan, DecisionContextData, SimulationStepId } from '../../types';
import { DataSemanticBadge } from '../common/Badge';
import { Button } from '../common/Button';
import DecisionContext from '../decision-context/DecisionContext';
import {
  mockDecisionContextV1,
  mockDecisionContextV2,
  mockAlternativeEvaluationTable,
  planV1SimulationData,
  planV2SimulationData,
} from '../../data/simulationData';

interface RelocationPanelProps {
  currentStep: SimulationStepId;
  plan: RelocationPlan;
  decisionContext?: DecisionContextData;
  onApprovePlan: (plan: RelocationPlan) => void;
  onModifyPlan?: () => void;
  onRejectPlan?: () => void;
  onAdvanceSimulation?: () => void;
}

export default function RelocationPanel({
  currentStep,
  plan,
  decisionContext = mockDecisionContextV1,
  onApprovePlan,
  onModifyPlan,
  onRejectPlan,
  onAdvanceSimulation,
}: RelocationPanelProps) {
  const isState1to3 = currentStep <= 3;
  const isState6or7 = currentStep === 6 || currentStep === 7;
  const isState8 = currentStep === 8;
  const isState9or10 = currentStep >= 9;

  const activePlan = isState9or10 ? planV2SimulationData : plan || planV1SimulationData;
  const activeContext = isState9or10 ? mockDecisionContextV2 : decisionContext;

  const handleApprove = () => {
    const approved: RelocationPlan = {
      ...activePlan,
      status: 'approved',
      approvedBy: 'District Collector & Chairperson, DDMA Wayanad',
      approvalTimestamp: new Date(),
    };
    onApprovePlan(approved);
  };

  const handleReject = () => {
    if (onRejectPlan) onRejectPlan();
  };

  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden flex flex-col">
      {/* ============================================================ */}
      {/* 1. ADVISORY HEADER & SIMULATION STATUS                       */}
      {/* ============================================================ */}
      <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            currentStep === 7 ? 'bg-red-600' : isState9or10 ? 'bg-blue-700' : 'bg-indigo-700'
          }`}></div>
          <div>
            <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-900 leading-tight">
              {isState9or10 ? 'DYNAMIC REASSIGNMENT ADVISORY' : 'PROACTIVE RELOCATION ADVISORY'}
            </div>
            <div className="text-[13px] font-extrabold text-slate-900 leading-tight">
              {isState1to3
                ? 'Mundakkai Corridor — Assessment Phase'
                : isState6or7
                ? 'Relocation Plan V1 — INVALIDATED (Bridge Breach)'
                : isState8
                ? 'Candidate Alternative Search in Progress'
                : `Relocation Plan V${activePlan.version} — Mundakkai Corridor`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <DataSemanticBadge type="AEGIS_RECOMMENDATION" className="text-[8px] px-1 py-0" />
          <span
            className={`aegis-badge text-[9px] font-extrabold ${
              currentStep === 5 || currentStep === 10
                ? 'aegis-badge-safe'
                : currentStep === 6 || currentStep === 7
                ? 'aegis-badge-critical'
                : 'aegis-badge-warning'
            }`}
          >
            {currentStep === 1
              ? 'BASELINE'
              : currentStep === 2
              ? 'HAZARD ESCALATION'
              : currentStep === 3
              ? 'AUDIT IN PROGRESS'
              : currentStep === 4
              ? 'PENDING V1 APPROVAL'
              : currentStep === 5
              ? '✓ PLAN V1 APPROVED'
              : currentStep === 6
              ? '⚡ R104 BLOCKED'
              : currentStep === 7
              ? '✕ PLAN V1 INVALIDATED'
              : currentStep === 8
              ? 'EVALUATING ALTERNATIVES'
              : currentStep === 9
              ? 'PENDING V2 APPROVAL'
              : '✓ PLAN V2 APPROVED'}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* ============================================================ */}
        {/* 2. OPERATIONAL TARGET & CAPACITY SUMMARY                     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Target Habitation</span>
            <div className="font-extrabold text-slate-900 text-xs">
              Mundakkai <span className="text-red-700 font-bold">(94.2% Risk)</span>
            </div>
            <div className="text-[10px] text-slate-600 font-mono-code">427 HH · 1,495 Persons</div>
          </div>

          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Sector Usable Capacity</span>
            <div className="font-extrabold text-emerald-900 text-xs">1,760 Beds Available</div>
            <div className="text-[10px] text-slate-600 font-mono-code">Net Surplus: +265 Beds</div>
          </div>

          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Dependency Status</span>
            <div className="font-extrabold text-slate-900 text-xs font-mono-code">
              {currentStep >= 6 ? (
                <span className="text-red-700">R104 Severed (150 Affected)</span>
              ) : (
                <span className="text-emerald-700">100% Feasible</span>
              )}
            </div>
            <div className="text-[10px] text-slate-600 font-mono-code">
              {currentStep >= 6 ? '150 Evacuees Severed' : '1,495 Assigned'}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STATE 6 & 7: CAUSAL INVALIDATION ALERT BOX                   */}
        {/* ============================================================ */}
        {isState6or7 && (
          <div className="p-3 rounded bg-red-50 border-2 border-red-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-950 uppercase flex items-center gap-1.5">
                <span>⚡</span>
                <span>CRITICAL FIELD EVENT: ROUTE R104 STRUCTURAL BREACH</span>
              </span>
              <span className="text-[9px] font-mono-code font-bold bg-red-200 text-red-900 px-1.5 py-0.5 rounded">
                14:20 IST · Field Officer Report
              </span>
            </div>

            <div className="text-xs text-red-900 leading-snug">
              Culvert abutment failure at <strong>Route R104 KM 4.2</strong> confirmed by on-scene revenue squad. Route is completely impassable for vehicular traffic.
            </div>

            {/* Causal Chain Display */}
            <div className="p-2 rounded bg-white border border-red-200 text-[10.5px] text-slate-800 space-y-1">
              <div className="text-[9px] font-extrabold uppercase text-slate-500">Causal Operational Chain</div>
              <div className="font-mono-code font-bold text-red-900 flex items-center gap-1 flex-wrap">
                <span>Field Report</span>
                <span>→</span>
                <span>R104 BLOCKED</span>
                <span>→</span>
                <span>Constraint FAILED</span>
                <span>→</span>
                <span className="bg-red-100 px-1 rounded">150 Persons Severed</span>
                <span>→</span>
                <span className="bg-red-800 text-white px-1 rounded">Plan V1 Invalidated</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10.5px] text-red-900 font-medium italic">
                "AEGIS does not continue an infeasible plan. Dynamic replanning required."
              </span>
              {onAdvanceSimulation && (
                <button
                  type="button"
                  onClick={onAdvanceSimulation}
                  className="px-2.5 py-1 text-[10px] font-extrabold bg-red-800 text-white rounded hover:bg-red-900 transition-colors shadow-xs"
                >
                  Evaluate Alternatives ▶
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STATE 8: CANDIDATE ALTERNATIVE SEARCH TABLE                  */}
        {/* ============================================================ */}
        {isState8 && (
          <div className="p-3 rounded bg-amber-50 border border-amber-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                <span>🔍</span>
                <span>DYNAMIC ALTERNATIVE EVALUATION</span>
              </span>
              <span className="text-[9px] font-mono-code font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                Multi-Criteria Filter Active
              </span>
            </div>

            <div className="text-[11px] text-amber-900">
              Evaluating candidate corridors to reallocate 150 displaced residents while preserving remaining allocations:
            </div>

            <div className="space-y-1.5">
              {mockAlternativeEvaluationTable.map((row, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border text-xs flex items-center justify-between gap-2 ${
                    row.evaluationResult === 'VIABLE'
                      ? 'bg-white border-emerald-300'
                      : row.evaluationResult === 'REJECTED'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-[11.5px]">{row.candidateName}</div>
                    <div className="text-[10px] text-slate-500 font-mono-code">
                      via {row.candidateRouteName} · {row.distanceKm} · {row.capacityStatus}
                    </div>
                    {row.rejectionReason && (
                      <div className="text-[9.5px] text-red-800 italic mt-0.5">
                        {row.rejectionReason}
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-extrabold px-2 py-1 rounded shrink-0 ${
                      row.evaluationResult === 'VIABLE'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : row.evaluationResult === 'REJECTED'
                        ? 'bg-red-100 text-red-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {row.evaluationResult}
                  </span>
                </div>
              ))}
            </div>

            {onAdvanceSimulation && (
              <div className="pt-1 text-right">
                <Button variant="primary" size="sm" onClick={onAdvanceSimulation}>
                  Formulate Plan V2 Recommendation ▶
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. MULTI-SHELTER ALLOCATION MATRIX (Plan V1 or Plan V2)       */}
        {/* ============================================================ */}
        {!isState1to3 && !isState8 && (
          <div>
            <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
              <span>
                {isState9or10 ? 'Plan V2 Rebalanced Allocations' : 'Designated Shelter Distribution'}
              </span>
              <span className="text-slate-500 font-medium">
                {isState9or10 ? '1,495 / 1,495 (100% Reassigned)' : '100% (1,495 / 1,495 Allocated)'}
              </span>
            </div>

            <div className="space-y-1.5">
              {activePlan.allocations.map((alloc, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2 rounded border text-xs transition-colors ${
                    isState6or7 && alloc.shelterId === 'shelter-meppadi-hss'
                      ? 'bg-red-50 border-red-300'
                      : isState9or10 && alloc.shelterId === 'shelter-kalpetta-hall'
                      ? 'bg-blue-50/70 border-blue-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-[12px] flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isState6or7 && alloc.shelterId === 'shelter-meppadi-hss'
                            ? 'bg-red-600'
                            : 'bg-emerald-700'
                        }`}
                      ></span>
                      <span>{alloc.shelterName}</span>
                    </div>
                    <div className="text-[10.5px] text-slate-500 font-mono-code">
                      {alloc.distanceKm} km transit via {alloc.transitRouteName || 'verified road'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-slate-900 text-[12.5px] font-mono-code">
                      {alloc.persons} persons
                    </div>
                    <div className="text-[10px] font-bold space-x-2">
                      <span className={alloc.capacityOk ? 'text-emerald-700' : 'text-red-700'}>
                        Capacity {alloc.capacityOk ? '✓' : '✗'}
                      </span>
                      <span
                        className={
                          isState6or7 && alloc.shelterId === 'shelter-meppadi-hss'
                            ? 'text-red-700'
                            : alloc.routeOk
                            ? 'text-emerald-700'
                            : 'text-red-700'
                        }
                      >
                        Route {isState6or7 && alloc.shelterId === 'shelter-meppadi-hss' ? '✕ (R104 Blocked)' : '✓'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* V1 → V2 Plan Diff Display in State 9 & 10 */}
            {isState9or10 && (
              <div className="mt-2 p-2 rounded bg-blue-50/60 border border-blue-200 text-[10.5px] text-blue-950 space-y-1">
                <div className="font-extrabold text-[9.5px] uppercase tracking-wider text-blue-900">
                  Plan V1 → Plan V2 Reassignment Diff
                </div>
                <div className="grid grid-cols-3 gap-1 font-mono-code text-[10px]">
                  <div className="p-1 bg-white rounded border border-blue-100">
                    <span className="text-slate-500 block">Kalpetta Hall</span>
                    <strong className="text-emerald-800">503 → 612 (+109)</strong>
                  </div>
                  <div className="p-1 bg-white rounded border border-blue-100">
                    <span className="text-slate-500 block">St. Mary's Vythiri</span>
                    <strong className="text-emerald-800">380 → 503 (+123)</strong>
                  </div>
                  <div className="p-1 bg-white rounded border border-blue-100">
                    <span className="text-slate-500 block">Meppadi Govt HSS</span>
                    <strong className="text-amber-900">612 → 380 (-232)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. REUSABLE DATA-DRIVEN DECISION CONTEXT (Step 3 Component)  */}
        {/* ============================================================ */}
        <DecisionContext data={activeContext} />

        {/* ============================================================ */}
        {/* 5. STATUTORY HUMAN APPROVAL SECTION (District Collector)    */}
        {/* ============================================================ */}
        {currentStep === 4 && (
          <div className="pt-2 border-t-2 border-slate-200 space-y-2.5">
            <div className="human-approval-banner p-3">
              <div className="human-approval-title text-[11px] text-amber-950 font-extrabold flex items-center gap-1.5">
                <span>⚠</span>
                <span>STATUTORY HUMAN APPROVAL REQUIRED (PLAN V1)</span>
              </div>
              <div className="human-approval-subtitle text-[10.5px] text-amber-900 leading-normal mt-0.5">
                AEGIS recommendation is advisory. Relocation execution requires statutory authorization under the DM Act.<br />
                <strong>Statutory Authority:</strong> District Collector & District Magistrate (Wayanad DDMA)
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="success"
                size="sm"
                className="flex-1 font-extrabold text-xs py-2 shadow-xs"
                onClick={handleApprove}
              >
                ✓ APPROVE PLAN V1 [DISTRICT COLLECTOR]
              </Button>
              <Button variant="secondary" size="sm" className="px-3 text-xs" onClick={onModifyPlan}>
                MODIFY
              </Button>
              <Button variant="danger" size="sm" className="px-3 text-xs" onClick={handleReject}>
                REJECT
              </Button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="p-3 rounded bg-emerald-50 border-2 border-emerald-400 text-xs text-emerald-950 space-y-1">
            <div className="font-extrabold flex items-center gap-1.5 text-emerald-900 text-[12px]">
              <span>✓</span>
              <span>RELOCATION PLAN V1 APPROVED & MOBILIZED</span>
            </div>
            <div className="text-[11px] text-emerald-900">
              <strong>Statutory Sign-off:</strong> District Collector & Chairperson, DDMA Wayanad (13:45 IST)
            </div>
            <div className="text-[10px] text-emerald-700 font-mono-code flex items-center justify-between pt-1 border-t border-emerald-200">
              <span>Status: Active Operational Movement Vectors</span>
              <span className="font-bold text-emerald-800">SHA-256 Audit Event #5 Recorded</span>
            </div>
          </div>
        )}

        {currentStep === 9 && (
          <div className="pt-2 border-t-2 border-slate-200 space-y-2.5">
            <div className="human-approval-banner p-3">
              <div className="human-approval-title text-[11px] text-blue-950 font-extrabold flex items-center gap-1.5">
                <span>⚠</span>
                <span>STATUTORY REASSIGNMENT APPROVAL REQUIRED (PLAN V2)</span>
              </div>
              <div className="human-approval-subtitle text-[10.5px] text-blue-900 leading-normal mt-0.5">
                AEGIS formulated Plan V2 to bypass severed Route R104. Review the reassignment diff before statutory concurrence.<br />
                <strong>Statutory Authority:</strong> District Collector & District Magistrate (Wayanad DDMA)
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="success"
                size="sm"
                className="flex-1 font-extrabold text-xs py-2 shadow-xs bg-blue-800 hover:bg-blue-900 text-white"
                onClick={handleApprove}
              >
                ✓ APPROVE REASSIGNMENT (PLAN V2) [COLLECTOR]
              </Button>
              <Button variant="secondary" size="sm" className="px-3 text-xs" onClick={onModifyPlan}>
                MODIFY
              </Button>
              <Button variant="danger" size="sm" className="px-3 text-xs" onClick={handleReject}>
                REJECT
              </Button>
            </div>
          </div>
        )}

        {currentStep === 10 && (
          <div className="p-3 rounded bg-emerald-50 border-2 border-emerald-400 text-xs text-emerald-950 space-y-2">
            <div className="font-extrabold flex items-center gap-1.5 text-emerald-900 text-[12px]">
              <span>✓</span>
              <span>PLAN V2 RESILIENT REASSIGNMENT APPROVED & PROMULGATED</span>
            </div>
            <div className="text-[11px] text-emerald-900">
              <strong>Statutory Sign-off:</strong> District Collector & Chairperson, DDMA Wayanad (14:24 IST)
            </div>
            <div className="text-[10px] text-emerald-700 font-mono-code flex items-center justify-between pt-1 border-t border-emerald-200">
              <span>Status: Resilient Movement Corridors Active via R212 / R318</span>
              <span className="font-bold text-emerald-800">SHA-256 Audit Event #10 Recorded</span>
            </div>
            <div className="pt-1.5 flex items-center justify-between bg-emerald-100/70 p-2 rounded border border-emerald-300">
              <span className="text-[10.5px] font-bold text-emerald-950">
                Demo Next Step: Inspect Cryptographic Decision Trail
              </span>
              <a
                href="/system/audit-log"
                className="px-2.5 py-1 rounded bg-navy-900 text-white font-extrabold text-[10.5px] hover:bg-navy-800 transition-colors shadow-xs"
              >
                VIEW FORENSIC AUDIT TRAIL ▶
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
