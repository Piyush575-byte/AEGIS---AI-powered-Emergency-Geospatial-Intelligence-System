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
      <div id="recommendation-panel" className="bg-white border border-slate-300 rounded-2xl p-8 text-center text-slate-700 shadow-xl">
        <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-[18px] font-bold text-[#172033]">No active recommendation pending review</h3>
        <p className="text-[14px] text-slate-600 mt-1.5 max-w-lg mx-auto leading-relaxed">
          Baseline evacuation Plan V1 is currently operational. When an incident or route blockage occurs, AEGIS automatically evaluates alternatives and formulates an explainable recommendation.
        </p>
      </div>
    );
  }

  const isApproved = recommendation.status === 'approved' || planVersion === 2;
  const isRejected = recommendation.status === 'rejected';

  return (
    <div id="recommendation-panel" className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-7 text-[#172033] shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md inline-block mb-1">
            Operational decision support
          </span>
          <h2 className="text-[22px] sm:text-[24px] font-bold text-[#172033] tracking-tight">
            Can I safely approve this recommendation?
          </h2>
          <p className="text-[14px] text-slate-700 mt-1 leading-normal">
            AEGIS evaluated feasible alternative shelter corridors following the Route R1 bridge failure.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 self-start sm:self-center transition cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Immediate Key Facts Matrix */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5">
        <div className="text-xs font-semibold text-slate-700">
          Proposed relocation assignment
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-[16px] sm:text-[17px] font-bold text-[#172033]">
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-2xs">
            Chooralmala (120 people)
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block shrink-0" />
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-[#027A48] shadow-2xs">
            Vythiri Government Higher Secondary School
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-[13px] border-t border-slate-200">
          <div>
            <span className="text-slate-600 block text-xs">Recommended route</span>
            <span className="font-bold text-[#172033] text-[14px]">Route R4 (16.4 km)</span>
          </div>
          <div>
            <span className="text-slate-600 block text-xs">Route condition</span>
            <span className="font-bold text-[#027A48] text-[14px]">Clear (Traversable)</span>
          </div>
          <div>
            <span className="text-slate-600 block text-xs">Capacity headroom</span>
            <span className="font-bold text-[#027A48] text-[14px] tabular-nums">+205 available</span>
          </div>
          <div>
            <span className="text-slate-600 block text-xs">Medical capability</span>
            <span className="font-bold text-[#027A48] text-[14px]">Medical support on-site</span>
          </div>
        </div>
      </div>

      {/* Why This Option? */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
        <h3 className="text-[17px] font-bold text-blue-900">
          Why this recommendation?
        </h3>
        <ul className="space-y-2.5 text-[14px] leading-relaxed">
          <li className="flex items-start gap-3 text-[#172033]">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#027A48] border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5 text-xs">
              <Check className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-slate-900">Enough capacity:</strong> +205 available headroom for 120 evacuees (325 total facility capacity).
            </div>
          </li>
          <li className="flex items-start gap-3 text-[#172033]">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#027A48] border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5 text-xs">
              <Check className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-slate-900">Route is clear:</strong> Route R4 bypass corridor has zero active landslides or breaches.
            </div>
          </li>
          <li className="flex items-start gap-3 text-[#172033]">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#027A48] border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5 text-xs">
              <Check className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-slate-900">Medical support available:</strong> Emergency trauma care team stationed on-site at Vythiri GHSS.
            </div>
          </li>
          <li className="flex items-start gap-3 text-[#172033]">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#027A48] border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5 text-xs">
              <Check className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-slate-900">Feasible alternative:</strong> Avoids severed bridge on Route R1 at KM 4.2 entirely.
            </div>
          </li>
        </ul>
      </div>

      {/* Statutory Decision Actions Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[15px] font-bold text-[#172033]">
              DDMA decision required
            </div>
            <p className="text-[13px] text-slate-700 mt-0.5">
              Approving this recommendation will commit Plan V2 and reroute 120 evacuees to Vythiri GHSS.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isApproved ? (
              <div className="bg-emerald-50 border border-emerald-300 text-[#027A48] px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-[#027A48]" />
                <span>Plan V2 committed</span>
              </div>
            ) : isRejected ? (
              <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-xs">
                <XCircle className="w-5 h-5 text-red-700" />
                <span>Rejected</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onApprove()}
                  disabled={isProcessing}
                  className="bg-[#1D5B99] hover:bg-[#154575] text-white font-bold text-sm px-5 py-3 rounded-lg shadow-sm flex items-center gap-2 transition disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Approve recommendation</span>
                </button>
                <button
                  onClick={() => setShowRequestChangesModal(true)}
                  disabled={isProcessing}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm px-3.5 py-3 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs min-h-[44px]"
                >
                  <Edit3 className="w-4 h-4 mr-1.5 inline text-slate-600" />
                  <span>Request changes</span>
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-semibold text-sm px-3.5 py-3 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs min-h-[44px]"
                >
                  <XCircle className="w-4 h-4 mr-1.5 inline text-red-700" />
                  <span>Reject</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Technical Evidence, Alternatives & Calculations */}
      <div className="space-y-4 pt-1">
        <h4 className="text-[16px] font-bold text-[#172033]">
          Situation evidence & alternatives
        </h4>

        {/* Rejected Alternatives Considered */}
        <details className="group bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm shadow-xs" open>
          <summary className="cursor-pointer text-[#172033] font-bold text-[15px] flex items-center justify-between select-none">
            <span>Rejected alternatives considered (3 options evaluated)</span>
            <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-slate-600" />
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5 pt-3.5 border-t border-slate-200">
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between items-center gap-1">
                <strong className="text-[14px] text-[#172033]">Vellarmala LP School</strong>
                <span className="text-xs font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                  Insufficient
                </span>
              </div>
              <p className="text-slate-700 text-[13px] leading-relaxed">
                Rejected: Available headroom (+60 beds) is less than the required 120 evacuees.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between items-center gap-1">
                <strong className="text-[14px] text-[#172033]">Attamala Community Centre</strong>
                <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  Degraded
                </span>
              </div>
              <p className="text-slate-700 text-[13px] leading-relaxed">
                Rejected: Access Route R3 roadbed compromised by soil saturation.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between items-center gap-1">
                <strong className="text-[14px] text-[#172033]">Meppadi Community Hall</strong>
                <span className="text-xs font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                  Severed
                </span>
              </div>
              <p className="text-slate-700 text-[13px] leading-relaxed">
                Rejected: Primary access Route R1 bridge destroyed at KM 4.2.
              </p>
            </div>
          </div>
        </details>

        {/* Multi-Criteria Decision Analysis Breakdown */}
        <details className="group bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm shadow-xs">
          <summary className="cursor-pointer text-slate-800 hover:text-black font-bold text-[15px] flex items-center justify-between select-none">
            <span>View scoring details (Multi-criteria decision analysis breakdown)</span>
            <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-slate-600" />
          </summary>
          <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-3 text-slate-800">
            <p className="text-[13px] text-slate-700 leading-relaxed">
              MCDA weights: Distance (40%), Available Headroom (30%), Safety/Hazard Clearance (20%), Medical Availability (10%).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border border-slate-200 bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-semibold text-xs">
                    <th className="py-2.5 px-3.5">Rank</th>
                    <th className="py-2.5 px-3.5">Shelter candidate</th>
                    <th className="py-2.5 px-3.5">Route</th>
                    <th className="py-2.5 px-3.5">Distance</th>
                    <th className="py-2.5 px-3.5">Headroom</th>
                    <th className="py-2.5 px-3.5">Medical</th>
                    <th className="py-2.5 px-3.5">Composite score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="font-semibold text-[#027A48] bg-emerald-50/60">
                    <td className="py-2.5 px-3.5">#1 (Recommended)</td>
                    <td className="py-2.5 px-3.5">Vythiri GHSS</td>
                    <td className="py-2.5 px-3.5">R4</td>
                    <td className="py-2.5 px-3.5 tabular-nums">16.4 km</td>
                    <td className="py-2.5 px-3.5 tabular-nums">+205</td>
                    <td className="py-2.5 px-3.5">Yes</td>
                    <td className="py-2.5 px-3.5 font-mono font-bold tabular-nums">1.000</td>
                  </tr>
                  <tr className="text-slate-800">
                    <td className="py-2.5 px-3.5 text-slate-600">#2 (Rejected)</td>
                    <td className="py-2.5 px-3.5">Attamala Centre</td>
                    <td className="py-2.5 px-3.5">R3</td>
                    <td className="py-2.5 px-3.5 tabular-nums">12.1 km</td>
                    <td className="py-2.5 px-3.5 tabular-nums">+40</td>
                    <td className="py-2.5 px-3.5">No</td>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums">0.620</td>
                  </tr>
                  <tr className="text-slate-800">
                    <td className="py-2.5 px-3.5 text-slate-600">#3 (Rejected)</td>
                    <td className="py-2.5 px-3.5">Vellarmala School</td>
                    <td className="py-2.5 px-3.5">R2</td>
                    <td className="py-2.5 px-3.5 tabular-nums">8.2 km</td>
                    <td className="py-2.5 px-3.5 tabular-nums">-60</td>
                    <td className="py-2.5 px-3.5">No</td>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums">0.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </div>

      {/* Modify Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000]">
          <div className="bg-white border border-slate-300 rounded-xl max-w-md w-full p-6 space-y-3.5 shadow-2xl">
            <h3 className="text-[18px] font-bold text-[#172033]">Record operational modification</h3>
            <p className="text-sm text-slate-700">
              Specify operational directives or stipulations accompanying Plan V2 approval.
            </p>
            <textarea
              value={modifyNotes}
              onChange={(e) => setModifyNotes(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-[#172033] focus:outline-none focus:border-blue-600"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowModifyModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onModify(modifyNotes);
                  setShowModifyModal(false);
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
              >
                Confirm approval with notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000]">
          <div className="bg-white border border-slate-300 rounded-xl max-w-md w-full p-6 space-y-3.5 shadow-2xl">
            <h3 className="text-[18px] font-bold text-red-900">Record recommendation rejection</h3>
            <p className="text-sm text-slate-700">
              Provide formal statutory rationale for declining Plan V2 advisory recommendation.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-[#172033] focus:outline-none focus:border-red-600"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onReject(rejectReason);
                  setShowRejectModal(false);
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-semibold hover:bg-red-800 disabled:opacity-50 cursor-pointer"
              >
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showRequestChangesModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000]">
          <div className="bg-white border border-slate-300 rounded-xl max-w-md w-full p-6 space-y-3.5 shadow-2xl">
            <h3 className="text-[18px] font-bold text-amber-900">Request operational modifications</h3>
            <p className="text-sm text-slate-700">
              Specify changes requested from planning and field teams prior to authorization.
            </p>
            <textarea
              value={requestChangesReason}
              onChange={(e) => setRequestChangesReason(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-[#172033] focus:outline-none focus:border-amber-600"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRequestChangesModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
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
                disabled={isProcessing}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-semibold hover:bg-amber-800 disabled:opacity-50 cursor-pointer"
              >
                Submit modification request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
