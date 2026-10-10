import { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ArrowRight, 
  Building2,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import type { RecommendationData } from '../../services/api';

interface RecommendationPanelProps {
  recommendation: RecommendationData | null;
  onApprove: (notes?: string) => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
  onModify: (notes?: string) => Promise<void>;
  onRequestChanges?: (reason: string) => Promise<void>;
  isProcessing: boolean;
  planVersion: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function RecommendationPanel({
  recommendation,
  onApprove,
  onReject,
  onModify,
  onRequestChanges,
  isProcessing,
  planVersion,
  isOpen = true,
  onClose,
}: RecommendationPanelProps) {
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyNotes, setModifyNotes] = useState('Approved with operational stipulation: PWD to maintain continuous patrol on Route R4 bypass corridor.');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Alternative shelter facility requested by local incident command.');

  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [requestChangesReason, setRequestChangesReason] = useState('Verify alternate corridor before approval.');

  if (!isOpen) return null;

  if (!recommendation) {
    return (
      <div id="recommendation-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Building2 className="w-9 h-9 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-200">No Active Recommendation Pending Review</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Baseline evacuation Plan V1 is currently operational. When an incident or route blockage occurs, AEGIS automatically evaluates alternatives and formulates an explainable recommendation.
        </p>
      </div>
    );
  }

  const isApproved = recommendation.status === 'approved' || planVersion === 2;
  const isRejected = recommendation.status === 'rejected';

  return (
    <div id="recommendation-panel" className="bg-[#FFFFFF] border border-[#D9E1EA] rounded-xl p-6 text-[#172033] shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E1EA] pb-4">
        <div>
          <span className="text-[11px] font-semibold text-[#2563A6] uppercase tracking-wider">
            Operational Decision Support
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-[#172033] mt-0.5">
            Can I safely approve this recommendation?
          </h2>
          <p className="text-sm text-[#526174] mt-0.5">
            AEGIS evaluated feasible alternative shelter corridors following the Route R1 bridge failure.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-[#718096] hover:text-[#172033] rounded-md hover:bg-[#F8FAFC] self-start sm:self-center transition cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Immediate Key Facts Matrix */}
      <div className="bg-[#F8FAFC] border border-[#D9E1EA] rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
          Proposed Assignment
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-base md:text-lg font-bold text-[#172033]">
          <div className="bg-[#FFFFFF] px-3.5 py-1.5 rounded-md border border-[#D9E1EA] shadow-xs">
            Chooralmala (120 People)
          </div>
          <ArrowRight className="w-4 h-4 text-[#718096] hidden sm:block shrink-0" />
          <div className="bg-[#ECFDF3] border border-[#ABEFC6] px-3.5 py-1.5 rounded-md text-[#027A48] shadow-xs">
            Vythiri Government Higher Secondary School (Gamma)
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-[#D9E1EA]">
          <div>
            <span className="text-[#718096] block text-[11px]">Recommended Route</span>
            <span className="font-bold text-[#172033]">Route R4 (16.4 km)</span>
          </div>
          <div>
            <span className="text-[#718096] block text-[11px]">Route Condition</span>
            <span className="font-bold text-[#027A48]">CLEAR (Traversable)</span>
          </div>
          <div>
            <span className="text-[#718096] block text-[11px]">Capacity Headroom</span>
            <span className="font-bold text-[#027A48]">+205 Available</span>
          </div>
          <div>
            <span className="text-[#718096] block text-[11px]">Medical Capability</span>
            <span className="font-bold text-[#027A48]">Medical Support Available</span>
          </div>
        </div>
      </div>

      {/* WHY THIS OPTION? */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#2563A6]">
          WHY THIS OPTION?
        </h3>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2.5 text-[#172033]">
              <span className="w-5 h-5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                <Check className="w-3.5 h-3.5" />
              </span>
              <div>
                <strong className="text-[#172033]">Enough capacity:</strong> +205 available headroom for 120 evacuees (325 total facility capacity).
              </div>
            </li>
            <li className="flex items-start gap-2.5 text-[#172033]">
              <span className="w-5 h-5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                <Check className="w-3.5 h-3.5" />
              </span>
              <div>
                <strong className="text-[#172033]">Route is currently clear:</strong> Route R4 bypass corridor has zero active landslides or breaches.
              </div>
            </li>
            <li className="flex items-start gap-2.5 text-[#172033]">
              <span className="w-5 h-5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                <Check className="w-3.5 h-3.5" />
              </span>
              <div>
                <strong className="text-[#172033]">Medical support available:</strong> Emergency trauma care team stationed on-site at Vythiri GHSS.
              </div>
            </li>
            <li className="flex items-start gap-2.5 text-[#172033]">
              <span className="w-5 h-5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                <Check className="w-3.5 h-3.5" />
              </span>
              <div>
                <strong className="text-[#172033]">Feasible alternative to blocked R1:</strong> Avoids severed bridge at KM 4.2 entirely.
              </div>
            </li>
          </ul>
        </div>

      {/* Immediate Decision Actions Section (First Thing After Operational Facts) */}
      <div className="bg-[#F8FAFC] border border-[#D9E1EA] rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#172033]">
              DDMA DECISION REQUIRED
            </div>
            <p className="text-xs text-[#526174] mt-0.5">
              Approving this recommendation will commit Plan V2 and reroute 120 evacuees to Vythiri GHSS.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isApproved ? (
              <div className="bg-[#ECFDF3] border border-[#ABEFC6] text-[#027A48] px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#027A48]" />
                <span>PLAN V2 COMMITTED</span>
              </div>
            ) : isRejected ? (
              <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#B42318] px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs">
                <XCircle className="w-4 h-4 text-[#B42318]" />
                <span>REJECTED</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onApprove()}
                  disabled={isProcessing}
                  className="bg-[#2563A6] hover:bg-[#1D4F80] active:bg-[#174A7C] text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>APPROVE RECOMMENDATION</span>
                </button>
                <button
                  onClick={() => setShowRequestChangesModal(true)}
                  disabled={isProcessing}
                  className="bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#D9E1EA] text-[#172033] font-medium text-xs px-3 py-2.5 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1 inline text-[#526174]" />
                  <span>Request changes</span>
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                  className="bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#B42318] font-medium text-xs px-3 py-2.5 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1 inline text-[#B42318]" />
                  <span>Reject</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Technical Evidence, Alternatives & Calculations */}
      <div className="space-y-3 pt-1">
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#718096]">
          Technical Evidence & Analysis
        </div>

        {/* REJECTED ALTERNATIVES CONSIDERED */}
        <details className="group bg-[#F8FAFC] border border-[#D9E1EA] rounded-xl p-3.5 text-xs shadow-xs" open>
          <summary className="cursor-pointer text-[#172033] font-bold flex items-center justify-between select-none">
            <span>REJECTED ALTERNATIVES CONSIDERED (3 Options Evaluated)</span>
            <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform text-[#718096]" />
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#D9E1EA]">
            <div className="p-2.5 bg-[#FFFFFF] rounded-lg border border-[#D9E1EA]">
              <div className="flex justify-between items-center">
                <strong className="text-[#172033]">Vellarmala LP School (Beta)</strong>
                <span className="text-[9.5px] font-bold text-[#B42318] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA]">
                  INSUFFICIENT
                </span>
              </div>
              <p className="text-[#526174] text-[11px] mt-1">
                Rejected: Available headroom (60) is less than the 120 required evacuees.
              </p>
            </div>

            <div className="p-2.5 bg-[#FFFFFF] rounded-lg border border-[#D9E1EA]">
              <div className="flex justify-between items-center">
                <strong className="text-[#172033]">Attamala Community Centre (Delta)</strong>
                <span className="text-[9.5px] font-bold text-[#B54708] bg-[#FFFAEB] px-1.5 py-0.5 rounded border border-[#FEDF89]">
                  DEGRADED
                </span>
              </div>
              <p className="text-[#526174] text-[11px] mt-1">
                Rejected: Access Route R3 roadbed compromised by slope soil saturation.
              </p>
            </div>

            <div className="p-2.5 bg-[#FFFFFF] rounded-lg border border-[#D9E1EA]">
              <div className="flex justify-between items-center">
                <strong className="text-[#172033]">Meppadi Community Hall (Alpha)</strong>
                <span className="text-[9.5px] font-bold text-[#B42318] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA]">
                  SEVERED
                </span>
              </div>
              <p className="text-[#526174] text-[11px] mt-1">
                Rejected: Primary access Route R1 bridge destroyed at KM 4.2.
              </p>
            </div>
          </div>
        </details>

        {/* Progressive Disclosure: MCDA breakdown */}
        <details className="group bg-[#F8FAFC] border border-[#D9E1EA] rounded-xl p-3.5 text-xs shadow-xs">
          <summary className="cursor-pointer text-[#526174] hover:text-[#172033] font-semibold flex items-center justify-between select-none">
            <span>View scoring details (MCDA mathematical breakdown)</span>
            <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform text-[#718096]" />
          </summary>
          <div className="mt-3 pt-3 border-t border-[#D9E1EA] space-y-2.5 text-[#526174]">
            <p className="text-[11.5px] text-[#718096]">
              Multi-Criteria Decision Analysis (MCDA) weights: Distance (40%), Available Headroom (30%), Safety/Hazard Clearance (20%), Medical Availability (10%).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#D9E1EA] bg-[#FFFFFF] rounded-lg overflow-hidden">
                <thead>
                  <tr className="border-b border-[#D9E1EA] bg-[#EEF3F8] text-[#526174] font-semibold">
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Shelter Candidate</th>
                    <th className="py-2 px-3">Route</th>
                    <th className="py-2 px-3">Distance</th>
                    <th className="py-2 px-3">Headroom</th>
                    <th className="py-2 px-3">Medical</th>
                    <th className="py-2 px-3">MCDA Composite Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E1EA]">
                  <tr className="font-semibold text-[#027A48] bg-[#ECFDF3]">
                    <td className="py-2 px-3">#1 (Recommended)</td>
                    <td className="py-2 px-3">Vythiri GHSS (Gamma)</td>
                    <td className="py-2 px-3">R4</td>
                    <td className="py-2 px-3">16.4 km</td>
                    <td className="py-2 px-3">+205</td>
                    <td className="py-2 px-3">Yes</td>
                    <td className="py-2 px-3 font-mono font-bold">1.000</td>
                  </tr>
                  <tr className="text-[#526174]">
                    <td className="py-2 px-3">#2 (Rejected)</td>
                    <td className="py-2 px-3">Attamala (Delta)</td>
                    <td className="py-2 px-3">R3</td>
                    <td className="py-2 px-3">12.1 km</td>
                    <td className="py-2 px-3">+40</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3 font-mono">0.620</td>
                  </tr>
                  <tr className="text-[#526174]">
                    <td className="py-2 px-3">#3 (Rejected)</td>
                    <td className="py-2 px-3">Vellarmala (Beta)</td>
                    <td className="py-2 px-3">R2</td>
                    <td className="py-2 px-3">8.2 km</td>
                    <td className="py-2 px-3">-60</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3 font-mono">0.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </div>

      {/* Modify Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[2000]">
          <div className="bg-[#FFFFFF] border border-[#D9E1EA] rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-base font-bold text-[#172033]">Record Statutory Operational Modification</h3>
            <p className="text-xs text-[#526174]">
              Specify operational directives or stipulations accompanying Plan V2 approval.
            </p>
            <textarea
              value={modifyNotes}
              onChange={(e) => setModifyNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#F8FAFC] border border-[#D9E1EA] rounded p-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#2563A6]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModifyModal(false)}
                className="px-3 py-1.5 border border-[#D9E1EA] text-[#526174] rounded text-xs hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onModify(modifyNotes);
                  setShowModifyModal(false);
                }}
                className="px-3 py-1.5 bg-[#2563A6] hover:bg-[#1D4F80] text-white rounded text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm & Commit Plan V2
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[2000]">
          <div className="bg-[#FFFFFF] border border-[#D9E1EA] rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-base font-bold text-[#172033]">Record Recommendation Rejection</h3>
            <p className="text-xs text-[#526174]">
              Provide the statutory rationale for declining this relocation proposal.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full bg-[#F8FAFC] border border-[#D9E1EA] rounded p-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#B42318]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 border border-[#D9E1EA] text-[#526174] rounded text-xs hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onReject(rejectReason);
                  setShowRejectModal(false);
                }}
                className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#B42318] rounded text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showRequestChangesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[2000]">
          <div className="bg-[#FFFFFF] border border-[#D9E1EA] rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-[#B54708]">
              <Edit3 className="w-4 h-4" />
              <h3 className="text-base font-bold text-[#172033]">Request Changes on Recommendation</h3>
            </div>
            <p className="text-xs text-[#526174]">
              Specify operational concerns or request corridor/shelter re-evaluation. A real audit record (<code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">CHANGES_REQUESTED</code>) will be committed to the SHA-256 ledger.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-[#172033] mb-1">Operational Rationale / Directive</label>
              <textarea
                value={requestChangesReason}
                onChange={(e) => setRequestChangesReason(e.target.value)}
                placeholder="e.g. Verify alternate corridor or assess medical readiness before approval..."
                rows={3}
                className="w-full bg-[#F8FAFC] border border-[#D9E1EA] rounded p-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#2563A6]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRequestChangesModal(false)}
                className="px-3 py-1.5 border border-[#D9E1EA] text-[#526174] rounded text-xs hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (onRequestChanges) {
                    await onRequestChanges(requestChangesReason);
                  }
                  setShowRequestChangesModal(false);
                }}
                disabled={!requestChangesReason.trim() || isProcessing}
                className="px-3 py-1.5 bg-[#B54708] hover:bg-[#92400E] text-white rounded text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                Submit Request & Log Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

