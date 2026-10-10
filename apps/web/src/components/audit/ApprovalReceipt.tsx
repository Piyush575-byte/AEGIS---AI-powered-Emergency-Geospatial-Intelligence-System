import React from 'react';

interface ApprovalReceiptProps {
  planVersion: 'V1' | 'V2';
  onInspectEvent: (eventId: string) => void;
}

export const ApprovalReceipt: React.FC<ApprovalReceiptProps> = ({
  planVersion,
  onInspectEvent,
}) => {
  const isV1 = planVersion === 'V1';

  return (
    <div className="bg-white border-2 border-slate-300 rounded shadow-xs overflow-hidden text-xs">
      <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700 px-1.5 py-0.5 rounded">
            STATUTORY APPROVAL RECEIPT
          </span>
          <span className="font-bold text-xs">
            {isV1 ? 'Relocation Plan V1 (Pre-Incident)' : 'Relocation Plan V2 (Dynamic Reassignment)'}
          </span>
        </div>
        <span className="text-[10px] font-mono-code font-bold text-slate-300">
          {isV1 ? 'DEC-WYD-MUN-001' : 'DEC-WYD-MUN-002'}
        </span>
      </div>

      <div className="p-3 space-y-2.5 bg-slate-50/50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Statutory Authority</span>
            <div className="font-extrabold text-slate-900 text-xs">District Collector & DM</div>
            <div className="text-[10px] text-slate-600">Chairperson, DDMA Wayanad</div>
          </div>

          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Statutory Mandate</span>
            <div className="font-bold text-slate-900 text-xs">DM Act, 2005</div>
            <div className="text-[10px] text-slate-600">Sections 30 & 34</div>
          </div>

          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Execution Timestamp</span>
            <div className="font-bold text-slate-900 font-mono-code">{isV1 ? '13:45 IST' : '14:24 IST'}</div>
            <div className="text-[10px] text-slate-600">Operational Log Entry</div>
          </div>

          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Audit Chain Proof</span>
            <div className="font-extrabold text-emerald-800 flex items-center gap-1 font-mono-code">
              <span>✓</span>
              <span>{isV1 ? 'EVT-05-APPROVED' : 'EVT-10-APPROVED'}</span>
            </div>
            <button
              type="button"
              onClick={() => onInspectEvent(isV1 ? 'evt-05-collector-approval' : 'evt-10-v2-approval')}
              className="text-[10px] text-navy-900 underline font-bold hover:text-navy-700 mt-0.5 block"
            >
              Inspect Block Proof ▶
            </button>
          </div>
        </div>

        <div className="p-2 rounded bg-white border border-slate-200 text-[10.5px] text-slate-700 leading-snug flex items-center justify-between gap-2">
          <span>
            <strong>Formal Declaration:</strong> "In exercise of statutory powers vested under the Disaster Management Act 2005, the undersigned approves the proactive evacuation allocation of 1,495 residents from Mundakkai corridor to designated relief facilities."
          </span>
          <span className="text-[9.5px] font-mono-code font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-300 shrink-0">
            DIGITAL SEAL: VERIFIED
          </span>
        </div>
      </div>
    </div>
  );
};

export default ApprovalReceipt;
