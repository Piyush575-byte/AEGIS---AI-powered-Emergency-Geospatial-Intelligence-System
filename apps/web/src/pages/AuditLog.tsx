import { useState, useMemo } from 'react';
import type { AuditEvent } from '../types';
import { canonicalAuditEvents } from '../data/simulationData';
import { verifyAuditChain, GENESIS_HASH, type VerificationResult } from '../utils/cryptoAudit';
import { DataSemanticBadge } from '../components/common/Badge';
import AuditVerificationBanner from '../components/audit/AuditVerificationBanner';
import CausalChainView from '../components/audit/CausalChainView';
import ApprovalReceipt from '../components/audit/ApprovalReceipt';
import AuditTimeline from '../components/audit/AuditTimeline';
import AuditEventDetail from '../components/audit/AuditEventDetail';

export default function AuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>(canonicalAuditEvents);
  const [selectedEventId, setSelectedEventId] = useState<string>('evt-06-r104-fail');
  const [filterOrigin, setFilterOrigin] = useState<string>('ALL');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTamperedDemo, setIsTamperedDemo] = useState<boolean>(false);
  const [activeReceiptPlan, setActiveReceiptPlan] = useState<'V1' | 'V2'>('V2');

  // Compute live verification result
  const verification: VerificationResult = useMemo(() => {
    return verifyAuditChain(events);
  }, [events]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.eventId === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  // Filtered event list
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterOrigin !== 'ALL' && ev.originType !== filterOrigin) return false;
      if (filterPlan === 'V1' && ev.planVersion !== 1 && ev.planId !== 'plan-v1') return false;
      if (filterPlan === 'V2' && ev.planVersion !== 2 && ev.planId !== 'plan-v2') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ev.title.toLowerCase().includes(q) ||
          ev.actorName.toLowerCase().includes(q) ||
          ev.affectedEntityId.toLowerCase().includes(q) ||
          ev.reason.toLowerCase().includes(q) ||
          ev.eventId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, filterOrigin, filterPlan, searchQuery]);

  // Live recalculate verification
  const handleVerifyChain = () => {
    const res = verifyAuditChain(events);
    if (res.isValid) {
      alert(`✓ AUDIT CHAIN VERIFIED: All ${res.totalEvents} cryptographic hashes verified against Genesis.`);
    } else {
      alert(`✕ AUDIT INTEGRITY FAILURE: ${res.diagnosticNarrative}`);
    }
  };

  // Tamper demonstration handlers
  const handleSimulateTamper = () => {
    const tampered = events.map((ev) => {
      if (ev.eventId === 'evt-06-r104-fail') {
        return {
          ...ev,
          title: '[UNAUTHORIZED EDIT] Route R104 Minor Puddle (Falsified Clear)',
          reason: 'Falsified record attempting to conceal bridge failure.',
          payloadSummary: 'FALSIFIED_PAYLOAD|R104_PASSABLE|TAMPER_INJECTED',
          verificationStatus: 'TAMPERED' as const,
        };
      }
      return ev;
    });
    setEvents(tampered);
    setIsTamperedDemo(true);
    setSelectedEventId('evt-06-r104-fail');
  };

  const handleRestoreChain = () => {
    setEvents(canonicalAuditEvents);
    setIsTamperedDemo(false);
  };

  const handleInspectEventFromNode = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const tipHash = events[events.length - 1]?.currentHash || '';

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-xs">
      {/* ============================================================ */}
      {/* 1. PAGE HEADER                                              */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Forensic Decision History & Immutable Audit Ledger
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-navy-900 text-white font-mono-code">
              STEP 5 FORENSIC LAYER
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Cryptographically linked event stream preserving the complete causal chain: Source Telemetry → Derived Analysis → Constraint Validation → Plan Invalidation → Dynamic Reassignment → Human Statutory Approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSemanticBadge type="DEMO_DATA" />
          <span className="text-[10px] font-mono-code font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-300">
            SHA-256 LINKED LEDGER
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CRYPTOGRAPHIC HASH-CHAIN INTEGRITY VERIFICATION BANNER    */}
      {/* ============================================================ */}
      <AuditVerificationBanner
        verification={verification}
        isTampered={isTamperedDemo}
        genesisHash={GENESIS_HASH}
        tipHash={tipHash}
        onVerify={handleVerifyChain}
        onSimulateTamper={handleSimulateTamper}
        onRestore={handleRestoreChain}
      />

      {/* ============================================================ */}
      {/* 3. INTERACTIVE CAUSAL CHAIN FLOWCHART                        */}
      {/* ============================================================ */}
      <CausalChainView
        selectedEventId={selectedEventId}
        onSelectEvent={handleInspectEventFromNode}
      />

      {/* ============================================================ */}
      {/* 4. PLAN EVOLUTION & STATUTORY APPROVAL RECEIPTS              */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Plan V1 → Plan V2 Reassignment Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
          <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>⚖</span>
              <span>Plan Evolution History: Plan V1 → Plan V2 Reassignment Matrix</span>
            </div>
            <span className="text-[10.5px] font-mono-code font-bold text-slate-600">
              Target Baseline: 1,495 / 1,495 (100% Constant)
            </span>
          </div>

          <div className="p-3 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9.5px]">
                  <th className="p-2">Shelter Facility</th>
                  <th className="p-2">Plan V1 (Pre-Incident)</th>
                  <th className="p-2">Plan V2 (Post-Bridge Failure)</th>
                  <th className="p-2">Net Delta</th>
                  <th className="p-2">Causal Forensic Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono-code text-[11px]">
                <tr>
                  <td className="p-2 font-bold text-slate-900 font-sans">Meppadi Govt. HSS</td>
                  <td className="p-2 text-slate-700">612 persons (via R104)</td>
                  <td className="p-2 text-amber-900 font-bold">380 persons (local bypass)</td>
                  <td className="p-2 text-red-700 font-bold">−232 persons</td>
                  <td className="p-2 text-slate-600 font-sans italic text-[10.5px]">
                    Route R104 culvert bridge collapsed at KM 4.2; vehicular transit severed.
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900 font-sans">Kalpetta Community Hall</td>
                  <td className="p-2 text-slate-700">503 persons (via R212)</td>
                  <td className="p-2 text-emerald-900 font-bold">612 persons (Primary)</td>
                  <td className="p-2 text-emerald-700 font-bold">+109 persons</td>
                  <td className="p-2 text-slate-600 font-sans italic text-[10.5px]">
                    Reassigned as Primary Hub via intact northern arterial (R212); District Hospital link.
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900 font-sans">St. Mary's School Vythiri</td>
                  <td className="p-2 text-slate-700">380 persons (via R318)</td>
                  <td className="p-2 text-emerald-900 font-bold">503 persons (Secondary)</td>
                  <td className="p-2 text-emerald-700 font-bold">+123 persons</td>
                  <td className="p-2 text-slate-600 font-sans italic text-[10.5px]">
                    Absorbs secondary evacuee balance via verified Chooralmala bypass (R318).
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                  <td className="p-2 font-sans">Total Displaced Allocation</td>
                  <td className="p-2 text-slate-800">1,495 / 1,495 (100%)</td>
                  <td className="p-2 text-emerald-900">1,495 / 1,495 (100%)</td>
                  <td className="p-2 text-slate-800">0 (Balanced)</td>
                  <td className="p-2 font-sans text-emerald-800 text-[10.5px]">
                    Zero evacuees stranded. Complete demographic baseline preserved.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Statutory Approval Receipts Switcher (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between bg-slate-100 p-1 rounded border border-slate-200">
            <span className="text-[9.5px] font-black uppercase text-slate-600 px-1.5">
              Statutory Concurrence Receipt:
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveReceiptPlan('V1')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                  activeReceiptPlan === 'V1'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Plan V1 Receipt (13:45)
              </button>
              <button
                type="button"
                onClick={() => setActiveReceiptPlan('V2')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                  activeReceiptPlan === 'V2'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Plan V2 Receipt (14:24)
              </button>
            </div>
          </div>

          <ApprovalReceipt
            planVersion={activeReceiptPlan}
            onInspectEvent={handleInspectEventFromNode}
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. FORENSIC EVENT TIMELINE & DETAIL INSPECTOR                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Interactive Chronological Event Stream (7 Cols) */}
        <div className="lg:col-span-7">
          <AuditTimeline
            events={filteredEvents}
            selectedEventId={selectedEventId}
            filterOrigin={filterOrigin}
            filterPlan={filterPlan}
            searchQuery={searchQuery}
            onSelectEvent={setSelectedEventId}
            onFilterOriginChange={setFilterOrigin}
            onFilterPlanChange={setFilterPlan}
            onSearchQueryChange={setSearchQuery}
          />
        </div>

        {/* Right: Forensic Detail Inspector Panel (5 Cols) */}
        <div className="lg:col-span-5">
          <AuditEventDetail event={selectedEvent} />
        </div>
      </div>
    </div>
  );
}
