import React from 'react';
import type { VerificationResult } from '../../utils/cryptoAudit';

interface AuditVerificationBannerProps {
  verification: VerificationResult;
  isTampered: boolean;
  genesisHash: string;
  tipHash: string;
  onVerify: () => void;
  onSimulateTamper: () => void;
  onRestore: () => void;
}

export const AuditVerificationBanner: React.FC<AuditVerificationBannerProps> = ({
  verification,
  isTampered,
  genesisHash,
  tipHash,
  onVerify,
  onSimulateTamper,
  onRestore,
}) => {
  return (
    <div
      className={`p-3.5 rounded border-2 transition-all shadow-xs ${
        verification.isValid
          ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950'
          : 'bg-red-50/90 border-red-500 text-red-950'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0 ${
              verification.isValid ? 'bg-emerald-700' : 'bg-red-700 animate-pulse'
            }`}
          >
            {verification.isValid ? '✓' : '!'}
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <span>
                {verification.isValid
                  ? `AUDIT INTEGRITY: ${verification.verifiedCount} / ${verification.totalEvents} IMMUTABLE HASHES VERIFIED`
                  : `CRYPTOGRAPHIC TAMPERING DETECTED AT SEQUENCE #${verification.brokenSequence}`}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  verification.isValid
                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                    : 'bg-red-200 text-red-900 border border-red-300'
                }`}
              >
                {verification.isValid ? '✓ VALID' : '✕ INTEGRITY BREACH'}
              </span>
            </div>
            <div className="text-[11.5px] mt-0.5 leading-snug">
              {verification.diagnosticNarrative}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onVerify}
            className="px-2.5 py-1 text-[10.5px] font-extrabold uppercase rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 transition-colors shadow-xs"
            title="Recalculate SHA-256 hash-chain integrity from Genesis to tip"
          >
            🔍 Verify Audit Chain
          </button>

          {!isTampered ? (
            <button
              type="button"
              onClick={onSimulateTamper}
              className="px-2.5 py-1 text-[10.5px] font-extrabold uppercase rounded bg-red-100 hover:bg-red-200 border border-red-300 text-red-900 transition-colors shadow-xs"
              title="Simulate modifying Event #6 in memory to verify cryptographic tamper detection"
            >
              ⚠ Test Tamper Detection
            </button>
          ) : (
            <button
              type="button"
              onClick={onRestore}
              className="px-2.5 py-1 text-[10.5px] font-extrabold uppercase rounded bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
              title="Restore canonical unmodified audit ledger"
            >
              ↺ Restore Canonical Ledger
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-300/60 text-[10px] font-mono-code text-slate-600 flex items-center justify-between flex-wrap gap-2">
        <span>
          Genesis Hash: <strong className="text-slate-800">{genesisHash.slice(0, 16)}...</strong>
        </span>
        <span>
          Tip Hash (State 10): <strong className="text-slate-800">{tipHash.slice(0, 16)}...</strong>
        </span>
        <span className="text-slate-500 italic">
          "Tamper-evident audit chain for demonstration. Production deployment requires server-side append-only storage, access control, and institutional retention policy."
        </span>
      </div>
    </div>
  );
};

export default AuditVerificationBanner;
