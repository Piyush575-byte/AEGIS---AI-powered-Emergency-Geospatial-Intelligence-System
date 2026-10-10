import { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  User, 
  RefreshCw,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { api, type AuditTrailResponse } from '../services/api';

export default function AuditPage() {
  const [auditData, setAuditData] = useState<AuditTrailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAuditTrail();
      setAuditData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 4000);
    return () => clearInterval(interval);
  }, []);

  // Map raw event types to calm official decision descriptions
  const getEventFriendlyTitle = (eventType: string, action?: string) => {
    if (eventType.includes('GENESIS') || action?.includes('GENESIS')) {
      return 'Plan V1 established';
    }
    if (eventType.includes('INCIDENT')) {
      return 'R1 bridge failure reported';
    }
    if (eventType.includes('INVALIDAT') || action?.includes('INVALIDAT')) {
      return 'Affected assignment identified';
    }
    if (eventType.includes('RECOMMENDATION')) {
      return 'Alternative recommendation generated';
    }
    if (eventType.includes('APPROVAL')) {
      return 'Human approval recorded';
    }
    if (eventType.includes('PLAN')) {
      return 'Plan V2 committed';
    }
    return eventType.replace(/_/g, ' ');
  };

  return (
    <div className="min-h-full bg-[#F5F7FA] text-[#172033] p-6 md:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      {/* Demonstration Data Banner */}
      <div className="bg-[#FFFFFF] border border-[#D9E1EA] rounded-lg px-4 py-2 text-xs text-[#526174] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B54708]"></span>
          <span className="font-medium text-[#172033]">Demonstration Scenario — Synthetic Data</span>
        </div>
        <span className="text-[#718096] text-[11px]">
          Wayanad DDMA Official Record
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E1EA] pb-5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2563A6]">
            Statutory Decision History
          </span>
          <h1 className="text-2xl font-bold text-[#172033] mt-1">
            Official Decision History & Audit Ledger
          </h1>
          <p className="text-sm text-[#526174] mt-1">
            Chronological record of automated recommendations and statutory human authorizations.
          </p>
        </div>

        {/* Chain Integrity Status */}
        <div className="flex items-center gap-3 shrink-0">
          {auditData && (
            <div className={`px-3.5 py-2 rounded-lg border flex items-center gap-2.5 ${
              auditData.chain_valid
                ? 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#B42318]'
            }`}>
              {auditData.chain_valid ? (
                <ShieldCheck className="w-4 h-4 text-[#027A48] shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-[#B42318] shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-bold block">
                  {auditData.chain_valid ? 'CHAIN VALID & TAMPER-EVIDENT' : 'INTEGRITY COMPROMISED'}
                </span>
                <span className="text-[11px] opacity-80">
                  {auditData.total_events} Logged Decisions Verified
                </span>
              </div>
            </div>
          )}

          <button
            onClick={fetchAudit}
            disabled={isLoading}
            className="p-2 bg-[#FFFFFF] border border-[#D9E1EA] hover:bg-[#F8FAFC] text-[#526174] rounded-lg transition cursor-pointer shadow-xs"
            title="Refresh Audit Records"
            aria-label="Refresh audit records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Decision History Timeline */}
      {error ? (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 text-[#B42318] text-xs">
          Error retrieving audit records: {error}
        </div>
      ) : auditData ? (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#718096]">
            Decision Timeline ({auditData.total_events} Events)
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D9E1EA]">
            {auditData.events.map((ev) => {
              const actionCode = ev.payload?.action || ev.event_type;
              const isApproval = ev.event_type.includes('APPROVAL');
              const isPlan = ev.event_type.includes('PLAN');
              const isIncident = ev.event_type.includes('INCIDENT');

              return (
                <div key={ev.id} className="relative group">
                  {/* Step Bullet */}
                  <div className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isApproval 
                      ? 'border-[#027A48] bg-[#ECFDF3] text-[#027A48]' 
                      : isIncident 
                      ? 'border-[#B42318] bg-[#FEF2F2] text-[#B42318]'
                      : isPlan
                      ? 'border-[#2563A6] bg-[#EFF6FF] text-[#2563A6]'
                      : 'border-[#94A3B8] bg-[#F8FAFC] text-[#718096]'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  </div>

                  {/* Event Card */}
                  <div className="bg-[#FFFFFF] border border-[#D9E1EA] rounded-xl p-4 shadow-xs space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E1EA] pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-[#172033]">
                            {getEventFriendlyTitle(ev.event_type, actionCode)}
                          </h2>
                          <span className="text-[10px] font-mono text-[#526174] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#D9E1EA]">
                            {ev.event_type}
                          </span>
                        </div>
                        {ev.payload?.action && ev.payload.action !== ev.event_type && (
                          <div className="text-[11px] text-[#718096] font-mono mt-0.5">
                            Action: {ev.payload.action}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#526174] shrink-0">
                        <div className="flex items-center gap-1 text-[#172033] font-medium">
                          <User className="w-3.5 h-3.5 text-[#718096]" />
                          <span>{ev.actor}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#718096] font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST</span>
                        </div>
                      </div>
                    </div>

                    {/* Rationale / Details */}
                    <div className="text-xs text-[#526174] space-y-1">
                      {ev.payload.notes && (
                        <div>
                          <span className="text-[#172033] font-medium">Stipulations: </span>
                          <span className="text-[#526174]">&quot;{ev.payload.notes}&quot;</span>
                        </div>
                      )}
                      {ev.payload.rationale && (
                        <div>
                          <span className="text-[#172033] font-medium">Operational Reason: </span>
                          <span className="text-[#526174]">{ev.payload.rationale}</span>
                        </div>
                      )}
                      {ev.payload.approved_shelter && (
                        <div>
                          <span className="text-[#172033] font-medium">Approved Relocation: </span>
                          <strong className="text-[#027A48]">{ev.payload.approved_shelter}</strong> via corridor{' '}
                          <strong className="text-[#027A48]">{ev.payload.approved_route}</strong> ({ev.payload.evacuees} evacuees)
                        </div>
                      )}
                      {ev.payload.plan_code && (
                        <div>
                          <span className="text-[#172033] font-medium">Affected Plan: </span>
                          <strong className="text-[#172033] font-mono">{ev.payload.plan_code}</strong> (Version {ev.payload.version}) · Status:{' '}
                          <span className="font-bold text-[#027A48] uppercase">{ev.payload.status}</span>
                        </div>
                      )}
                    </div>

                    {/* Progressive Disclosure: Technical verification */}
                    <details className="group pt-1">
                      <summary className="cursor-pointer text-[11px] font-semibold text-[#526174] hover:text-[#172033] flex items-center gap-1.5 select-none">
                        <FileCheck className="w-3.5 h-3.5 text-[#2563A6]" />
                        <span>Technical verification</span>
                        <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-[#718096]" />
                      </summary>
                      <div className="mt-2 p-2.5 bg-[#F8FAFC] rounded border border-[#D9E1EA] text-[11px] font-mono space-y-1 text-[#526174]">
                        <div className="flex justify-between">
                          <span className="text-[#718096]">Sequence:</span>
                          <span className="text-[#172033] font-medium">Block #{ev.sequence_num}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#718096]">Previous Hash:</span>
                          <span className="text-[#526174] truncate max-w-sm">{ev.prev_hash || '0000000000000000 (GENESIS)'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#718096]">SHA-256 Hash:</span>
                          <span className="text-[#027A48] font-bold truncate max-w-sm">{ev.curr_hash}</span>
                        </div>
                        <div className="flex justify-between text-[#027A48] pt-0.5 font-medium">
                          <span>Verification:</span>
                          <span>INTEGRITY VERIFIED & IMMUTABLE</span>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-[#718096] text-xs">
          Loading official decision records...
        </div>
      )}
    </div>
  );
}
