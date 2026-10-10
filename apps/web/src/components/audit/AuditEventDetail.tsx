import React from 'react';
import type { AuditEvent } from '../../types';
import { DataSemanticBadge } from '../common/Badge';

interface AuditEventDetailProps {
  event: AuditEvent;
}

export const AuditEventDetail: React.FC<AuditEventDetailProps> = ({ event }) => {
  return (
    <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden flex flex-col h-full text-xs">
      <div className="px-3.5 py-2.5 bg-navy-950 text-white flex items-center justify-between">
        <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
          <span>🔍</span>
          <span>Forensic Event Inspector</span>
        </div>
        <span className="text-[10px] font-mono-code font-bold bg-navy-800 px-2 py-0.5 rounded">
          SEQ #{event.sequenceNumber}
        </span>
      </div>

      <div className="p-3.5 space-y-3 overflow-y-auto max-h-[640px]">
        {/* Classification & Identification */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-extrabold uppercase text-slate-500">Classification</span>
            <DataSemanticBadge type={event.classification} />
          </div>
          <div className="font-extrabold text-slate-900 text-sm">
            {event.title}
          </div>
          <div className="text-[10.5px] font-mono-code text-slate-500">
            Event ID: {event.eventId} · Type: {event.eventType}
          </div>
        </div>

        {/* Actor Authority & Mandate */}
        <div className="space-y-1 border-b border-slate-200 pb-2.5">
          <div className="text-[9.5px] font-extrabold uppercase text-slate-500">Actor & Statutory Mandate</div>
          <div className="font-bold text-slate-900 text-xs">
            {event.actorName} ({event.actor})
          </div>
          <div className="text-[10.5px] text-slate-600">
            <strong>Origin Category:</strong> {event.originType.replace('_', ' ')}
          </div>
          {event.actorRole === 'DISTRICT_COLLECTOR' && (
            <div className="text-[10.5px] text-emerald-900 bg-emerald-50 p-1.5 rounded border border-emerald-200 mt-1">
              <strong>Statutory Basis:</strong> Sections 30 & 34 of Disaster Management Act, 2005 (Exclusive Human Executive Authority).
            </div>
          )}
        </div>

        {/* Source Evidence & Confidence */}
        <div className="space-y-1 border-b border-slate-200 pb-2.5">
          <div className="text-[9.5px] font-extrabold uppercase text-slate-500">Source Evidence & Telemetry</div>
          <div className="text-slate-800 text-xs leading-snug">
            {event.sourceEvidence}
          </div>
          <div className="text-[10.5px] text-slate-500 font-mono-code">
            Confidence Rating: <strong className="text-slate-800 uppercase">{event.confidence}</strong>
          </div>
        </div>

        {/* Affected Entity & State Transition */}
        <div className="space-y-1 border-b border-slate-200 pb-2.5">
          <div className="text-[9.5px] font-extrabold uppercase text-slate-500">Affected Operational Entity</div>
          <div className="font-bold text-slate-900 text-xs">
            {event.affectedEntityName}
          </div>
          <div className="text-[10.5px] font-mono-code text-slate-600">
            Entity ID: <strong className="text-navy-900">{event.affectedEntityId}</strong>
          </div>
          {event.previousState && event.newState && (
            <div className="mt-1 p-1.5 bg-slate-50 rounded border border-slate-200 font-mono-code text-[11px] flex items-center gap-1.5">
              <span className="text-slate-600">{event.previousState}</span>
              <span className="text-slate-400">→</span>
              <strong className="text-blue-900">{event.newState}</strong>
            </div>
          )}
        </div>

        {/* Reason & Operational Impact */}
        <div className="space-y-1.5 border-b border-slate-200 pb-2.5">
          <div>
            <span className="text-[9.5px] font-extrabold uppercase text-slate-500 block">Forensic Rationale</span>
            <p className="text-slate-800 text-xs leading-snug">{event.reason}</p>
          </div>
          <div>
            <span className="text-[9.5px] font-extrabold uppercase text-slate-500 block">Operational Consequence</span>
            <p className="text-slate-800 text-xs leading-snug">{event.consequence}</p>
          </div>
        </div>

        {/* Cryptographic Hash Chaining Verification */}
        <div className="p-2.5 bg-slate-900 text-slate-100 rounded space-y-1.5 font-mono-code text-[10px]">
          <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Cryptographic Proof (SHA-256)</span>
            <span
              className={
                event.verificationStatus === 'VALID'
                  ? 'text-emerald-400 font-bold'
                  : 'text-red-400 font-bold animate-pulse'
              }
            >
              {event.verificationStatus === 'VALID' ? '✓ HASH MATCH' : '⚠ DIGEST MISMATCH'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Previous Block Hash (Pointer):</span>
            <div className="text-slate-300 break-all bg-slate-950 p-1 rounded border border-slate-800 text-[9.5px]">
              {event.previousHash}
            </div>
          </div>

          <div>
            <span className="text-slate-500 block">Current Immutable Block Hash:</span>
            <div className="text-emerald-400 break-all bg-slate-950 p-1 rounded border border-slate-800 text-[9.5px]">
              {event.currentHash}
            </div>
          </div>

          <div className="pt-1 text-[9px] text-slate-400 border-t border-slate-800">
            Canonical Digest Payload: {event.payloadSummary}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditEventDetail;
