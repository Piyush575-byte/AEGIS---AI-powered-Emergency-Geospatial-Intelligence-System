import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  RotateCcw, 
  Lock, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  Edit3,
  Compass,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import { 
  api, 
  type GeoDataResponse, 
  type PlanAssignmentsResponse, 
  type RecommendationData, 
  type PlanDiffResponse, 
  type IncidentData,
  type RelocationPlanItem
} from '../services/api';
import RecommendationPanel from '../components/ddma/RecommendationPanel';
import LeafletMap from '../components/map/LeafletMap';
import PlanSelectorPopover, { type PlanVersionItem, type PlanStatusType } from '../components/common/PlanSelectorPopover';

export default function DDMADashboard() {
  const [geodata, setGeodata] = useState<GeoDataResponse | null>(null);
  const [assignmentsData, setAssignmentsData] = useState<PlanAssignmentsResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [planDiff, setPlanDiff] = useState<PlanDiffResponse | null>(null);
  const [incident, setIncident] = useState<IncidentData | null>(null);

  // Real plan versions from backend
  const [plansList, setPlansList] = useState<RelocationPlanItem[]>([]);
  const [viewingVersion, setViewingVersion] = useState<number>(1);
  const [isViewingHistorical, setIsViewingHistorical] = useState(false);

  // Status flags
  const [r1Blocked, setR1Blocked] = useState(false);
  const [planVersion, setPlanVersion] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // UI state
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMapFeature, setSelectedMapFeature] = useState<{
    type: string;
    title: string;
    subtitle?: string;
    details?: string;
  } | null>(null);

  // Rejection, modification & request changes modals
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyNotes, setModifyNotes] = useState('Approved with operational stipulation: PWD to maintain continuous patrol on Route R4 bypass corridor.');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Alternative shelter facility requested by local incident command.');
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [requestChangesReason, setRequestChangesReason] = useState('Verify alternate corridor before approval.');

  const wsRef = useRef<WebSocket | null>(null);

  // Refresh all dashboard state from backend
  const refreshDashboard = useCallback(async () => {
    try {
      // 1. Geodata
      const geo = await api.getGeodata();
      setGeodata(geo);
      const r1 = geo.routes.features?.find((r) => r.properties.code === 'R1');
      setR1Blocked(r1?.properties.status === 'blocked');

      // 2. Assignments & Plan Version
      const assign = await api.getAssignments();
      setPlanVersion(assign.version);

      // 3. Available Real Plans
      try {
        const plans = await api.getPlans();
        setPlansList(plans);
      } catch (e) {
        console.warn('Failed to fetch plans from backend:', e);
      }

      // Sync viewing version and assignments unless user has explicitly pinned a historical plan
      setIsViewingHistorical((prevHistorical) => {
        if (!prevHistorical) {
          setAssignmentsData(assign);
          setViewingVersion(assign.version);
        }
        return prevHistorical;
      });

      // 4. Recommendation
      const rec = await api.getLatestRecommendation();
      setRecommendation(rec);

      // 5. Plan Diff
      const diff = await api.getPlanDiff();
      setPlanDiff(diff);

      // 6. Incident
      const inc = await api.getLatestIncident();
      if ('id' in inc) {
        setIncident(inc);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error refreshing DDMA dashboard:', err);
    }
  }, []);

  // Setup WebSocket listener with polling fallback
  useEffect(() => {
    refreshDashboard();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/events`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 15000);
        (socket as any)._pingInterval = pingInterval;
      };

      socket.onmessage = () => {
        refreshDashboard();
      };

      socket.onclose = () => {
        setWsConnected(false);
        if ((socket as any)._pingInterval) {
          clearInterval((socket as any)._pingInterval);
        }
      };

      socket.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      console.warn('WebSocket connection failed, relying on polling:', e);
    }

    const interval = setInterval(refreshDashboard, 3500);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [refreshDashboard]);


  // Simulation Control: Reset Baseline
  const handleReset = async () => {
    setIsProcessing(true);
    setIsViewingHistorical(false);
    setViewingVersion(1);
    setStatusMessage('Resetting scenario to Baseline Plan V1...');
    try {
      await api.resetSimulation();
      await refreshDashboard();
      setStatusMessage('Scenario restored to clean Baseline Plan V1 (Chooralmala → Meppadi via R1: CLEAR).');
    } catch (err: any) {
      setStatusMessage(`Error during reset: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Human Approval Action
  const handleApprove = async (notes?: string) => {
    if (!recommendation) return;
    setIsProcessing(true);
    setStatusMessage('Recording statutory human approval and committing Plan V2...');
    try {
      await api.approveRecommendation(recommendation.recommendation_id, { notes });
      setIsViewingHistorical(false);
      setViewingVersion(2);
      await refreshDashboard();
      setStatusMessage('Statutory approval recorded. Plan V2 is now the active operational plan. Preserved Plan V1 as historical record.');
    } catch (err: any) {
      setStatusMessage(`Approval failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Human Rejection Action
  const handleReject = async (reason?: string) => {
    if (!recommendation) return;
    setIsProcessing(true);
    try {
      await api.rejectRecommendation(recommendation.recommendation_id, { rejection_reason: reason });
      await refreshDashboard();
      setStatusMessage('Recommendation marked as rejected by human authority.');
    } catch (err: any) {
      setStatusMessage(`Rejection failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Human Modification Action
  const handleModify = async (notes?: string) => {
    if (!recommendation) return;
    setIsProcessing(true);
    try {
      await api.modifyRecommendation(recommendation.recommendation_id, { notes });
      await refreshDashboard();
      setStatusMessage('Recommendation approved with statutory operational modifications. Plan V2 active.');
    } catch (err: any) {
      setStatusMessage(`Modification failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Human Request Changes Action
  const handleRequestChanges = async (reason: string) => {
    if (!recommendation) return;
    if (!reason || !reason.trim()) {
      setStatusMessage('Please provide a specific operational reason when requesting changes.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.requestChangesRecommendation(recommendation.recommendation_id, {
        reason: reason.trim()
      });
      await refreshDashboard();
      setStatusMessage('Change request submitted to Field Ingestion / AEGIS engine. Plan V1 preserved.');
    } catch (err: any) {
      setStatusMessage(`Request changes failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Plan Selection from Popover
  const handleSelectPlan = async (selectedVer: number) => {
    setViewingVersion(selectedVer);
    if (selectedVer !== planVersion) {
      setIsViewingHistorical(true);
      const targetPlan = plansList.find((p) => p.version === selectedVer);
      if (targetPlan) {
        try {
          const historicalAssignments = await api.getAssignments(targetPlan.id);
          setAssignmentsData(historicalAssignments);
        } catch (e) {
          console.error('Failed to fetch historical assignments:', e);
        }
      }
    } else {
      setIsViewingHistorical(false);
      try {
        const currentAssignments = await api.getAssignments();
        setAssignmentsData(currentAssignments);
      } catch (e) {
        console.error('Failed to fetch current assignments:', e);
      }
    }
  };

  const primaryAssignment = assignmentsData?.assignments?.[0];
  const affectedCount = primaryAssignment ? primaryAssignment.allocated_population : 120;
  const isV2Active = planVersion === 2;
  const isRecommendationPending = recommendation?.status === 'pending_human_approval' && !isV2Active;
  const isRecommendationRejected = recommendation?.status === 'rejected' && !isV2Active;
  const isChangesRequested = recommendation?.status === 'changes_requested' && !isV2Active;

  // Real plan versions derived from backend
  const ddmaPlans: PlanVersionItem[] = plansList.map((p) => {
    const isCurrent = p.version === planVersion;
    let statusLabel = '';
    let statusType: PlanStatusType = 'approved';

    if (p.version === 2) {
      statusType = p.status === 'approved' ? 'approved' : 'pending_human_approval';
      statusLabel = p.status === 'approved'
        ? 'Approved · 120 Reassigned to Vythiri'
        : 'Formulated · Statutory Concurrence Required';
    } else {
      // Version 1
      if (isV2Active) {
        statusType = 'superseded';
        statusLabel = 'Superseded · Preserved as historical record';
      } else if (isRecommendationPending) {
        statusType = 'pending_human_approval';
        statusLabel = 'Recommendation Ready · Human Approval Required';
      } else {
        statusType = 'approved';
        statusLabel = 'Approved Baseline · 120 Evacuees';
      }
    }

    return {
      id: p.id,
      version: p.version,
      code: p.plan_code,
      title: p.version === 2 ? 'Plan V2 (Resilient Bypass)' : 'Plan V1 (Baseline)',
      status: statusType,
      statusLabel,
      isCurrentActive: isCurrent,
      evacueesCount: p.total_evacuees || 120,
      shelterName: p.version === 2 ? 'Vythiri GHSS (Gamma)' : 'Meppadi Community Hall (Alpha)',
      routeCode: p.version === 2 ? 'R4 Bypass' : 'R1',
      approvedBy: p.approved_by,
      approvedAt: p.approved_at,
    };
  });

  // Fallback if plansList is still loading from backend
  if (ddmaPlans.length === 0) {
    ddmaPlans.push({
      version: 1,
      code: 'AEGIS-PLAN-WAYANAD-V1',
      title: 'Plan V1 (Baseline)',
      status: isRecommendationPending ? 'pending_human_approval' : 'approved',
      statusLabel: isRecommendationPending
        ? 'Recommendation Ready · Human Approval Required'
        : 'Approved Baseline · 120 Evacuees',
      isCurrentActive: !isV2Active,
      evacueesCount: 120,
      shelterName: 'Meppadi Community Hall (Alpha)',
      routeCode: 'R1',
      approvedBy: 'District Collector / Chairman, DDMA Wayanad',
    });
    if (isV2Active) {
      ddmaPlans.unshift({
        version: 2,
        code: 'AEGIS-PLAN-WAYANAD-V2',
        title: 'Plan V2 (Resilient Bypass)',
        status: 'approved',
        statusLabel: 'Approved · 120 Reassigned to Vythiri',
        isCurrentActive: true,
        evacueesCount: 120,
        shelterName: 'Vythiri GHSS (Gamma)',
        routeCode: 'R4 Bypass',
        approvedBy: 'District Collector & Chairman, DDMA Wayanad',
      });
    }
  }

  // Incident reported time
  const reportedTimeStr = incident?.reported_at 
    ? new Date(incident.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST'
    : '21:42 IST';

  return (
    <div className="relative w-full h-[calc(100vh-48px)] flex flex-col bg-[#F5F7FA] overflow-hidden font-sans">
      {/* 1. Operational Feedback Toast */}
      {statusMessage && (
        <div className="absolute top-4 right-1/2 translate-x-1/2 z-[1100] max-w-md bg-[#FFFFFF] border border-[#2563A6] text-[#172033] text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between gap-3 animate-fade-in">
          <span>{statusMessage}</span>
          <button 
            onClick={() => setStatusMessage(null)} 
            className="text-[#718096] hover:text-[#172033] font-bold text-xs cursor-pointer"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. MAP-FIRST PRIMARY WORKSPACE (100% Full Bleed) */}
      <div className="relative w-full h-full overflow-hidden">
        {/* The Leaflet Map Canvas */}
        <div className="aegis-map-canvas">
          <LeafletMap
            geodata={geodata}
            r1Blocked={r1Blocked}
            recommendationActive={viewingVersion === 2 || (isRecommendationPending && viewingVersion === 1)}
            planVersion={viewingVersion}
            onSelectFeature={(info) => setSelectedMapFeature(info)}
          />
        </div>

        {/* 3. FLOATING TOP-RIGHT PLAN SELECTOR & DEMO CONTROLS */}
        <div className="absolute top-3 right-4 z-[1000] flex items-center gap-2 max-w-[calc(100vw-32px)]">

          <PlanSelectorPopover
            plans={ddmaPlans}
            viewingVersion={viewingVersion}
            activeOperationalVersion={planVersion}
            onSelectPlan={handleSelectPlan}
            statusDescriptor={
              viewingVersion === 2
                ? 'Approved · 120 Reassigned to Vythiri'
                : isV2Active && viewingVersion === 1
                ? 'Superseded Baseline'
                : (r1Blocked || isRecommendationPending)
                ? 'CRITICAL INCIDENT DETECTED · R1 BRIDGE FAILURE'
                : 'No critical incidents · Monitoring Active'
            }
            secondaryControls={
              <div className="flex items-center gap-1.5">
                {/* WebSocket & Sync Health Indicator */}
                <span 
                  className={`w-2 h-2 rounded-full mr-1 ${wsConnected ? 'bg-[#027A48]' : 'bg-[#94A3B8]'}`} 
                  title={`Status: ${wsConnected ? 'WebSocket Live Feed' : 'Polling Sync'} · Last Updated: ${lastUpdated.toLocaleTimeString()}`}
                />

                {/* Reset Control (Clean Baseline Restoration) */}
                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="bg-[#FFFFFF] hover:bg-[#F8FAFC] active:bg-[#EEF3F8] border border-[#D9E1EA] text-[#172033] text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Restore baseline Plan V1"
                >
                  <RotateCcw className={`w-3 h-3 text-[#526174] ${isProcessing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Reset</span>
                </button>


                {/* Audit Link */}
                <Link
                  to="/audit"
                  className="text-xs text-[#526174] hover:text-[#172033] flex items-center gap-1 pl-2 border-l border-[#D9E1EA]"
                  title="View Decision History & Audit Ledger"
                >
                  <Lock className="w-3 h-3 text-[#2563A6]" />
                  <span className="hidden md:inline">Audit</span>
                </Link>
              </div>
            }
          />
        </div>

        {/* Selected Feature Card Popover on Map (if clicked) */}
        {selectedMapFeature && (
          <div className="absolute top-16 right-14 z-[1000] glass-surface-light rounded-2xl p-3.5 max-w-xs shadow-xl text-xs text-[#172033]">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5 mb-1.5">
              <span className="font-bold text-[#718096] text-[10px] uppercase tracking-wider">
                {selectedMapFeature.type} Details
              </span>
              <button 
                onClick={() => setSelectedMapFeature(null)} 
                className="text-[#718096] hover:text-[#172033] font-bold text-xs cursor-pointer p-0.5 rounded hover:bg-black/5"
              >
                ✕
              </button>
            </div>
            <div className="font-bold text-sm text-[#172033]">{selectedMapFeature.title}</div>
            {selectedMapFeature.subtitle && (
              <div className="text-[#526174] font-medium mt-0.5">{selectedMapFeature.subtitle}</div>
            )}
            {selectedMapFeature.details && (
              <div className="text-[#718096] text-[11px] mt-1">{selectedMapFeature.details}</div>
            )}
          </div>
        )}

        {/* 4. SMART FLOATING OPERATIONAL PANEL (Apple Maps Style) */}
        <div 
          className="absolute top-3 left-3 z-[1000] w-[340px] sm:w-[360px] max-w-[calc(100vw-24px)] aegis-floating-card overflow-hidden"
          style={{
            height: drawerCollapsed ? '46px' : (r1Blocked || isRecommendationPending || isV2Active || isViewingHistorical) ? undefined : 'auto',
            maxHeight: drawerCollapsed ? '46px' : 'min(560px, calc(100vh - 140px))',
          }}
        >
          {/* Card Header & Collapse Toggle */}
          <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between shrink-0 bg-white/40 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isViewingHistorical ? 'bg-[#94A3B8]' : r1Blocked || isRecommendationPending ? 'bg-[#DC2626]' : 'bg-[#027A48]'}`}></span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-black">
                {isViewingHistorical ? 'Historical Plan Inspection' : r1Blocked || isRecommendationPending ? 'Critical Operational Decision' : isV2Active ? 'Plan V2 Active' : 'Baseline Monitoring'}
              </span>
            </div>
            <button
              onClick={() => setDrawerCollapsed(!drawerCollapsed)}
              className="text-black hover:text-black p-1 rounded-md hover:bg-black/5 transition cursor-pointer"
              title={drawerCollapsed ? 'Expand panel' : 'Collapse panel'}
              aria-label={drawerCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {drawerCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!drawerCollapsed && (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {/* Historical Inspection Notice if inspecting Plan V1 */}
              {isViewingHistorical && (
                <div className="p-3 m-3 mb-0 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#92400E]">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#B45309]" />
                      Viewing Historical Plan V{viewingVersion}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(planVersion)}
                      className="underline font-bold text-[#78350F] hover:text-black cursor-pointer text-[11px]"
                    >
                      Return to Active Plan V{planVersion}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#92400E]/90 leading-tight">
                    Inspecting superseded Plan V1 baseline (Chooralmala → Meppadi via R1). The active statutory operational plan remains Plan V2.
                  </p>
                </div>
              )}
              {/* STATE A: BASELINE MONITORING (Extremely Compact, ~140px, Zero Clutter) */}
              {!r1Blocked && !isRecommendationPending && !isV2Active && (
                <div className="p-4 space-y-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-black">
                      Chooralmala → Meppadi
                    </h2>
                    <div className="text-xs text-black font-semibold mt-0.5">
                      120 people assigned · Meppadi Community Hall via Route R1
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/10 text-xs">
                    <div className="flex items-center gap-1.5 text-[#027A48] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#027A48]"></span>
                      <span>Route clear</span>
                    </div>
                    <span className="text-[11px] text-black font-medium">
                      No emergency decision required.
                    </span>
                  </div>
                </div>
              )}

              {/* STATE B: INCIDENT & RECOMMENDATION (R1 Fails or Shelter Capacity Lost or Cascade → Intelligently Expands) */}
              {(r1Blocked || isRecommendationPending) && !isV2Active && (
                <div className="p-4 space-y-3 text-xs">
                  {/* Incident Alert Block */}
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B42318] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping"></span>
                        🔴 CRITICAL INCIDENT DETECTED
                      </span>
                      <span className="text-[10px] font-mono text-black font-bold">
                        {reportedTimeStr}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-[#B42318] tracking-tight">
                        {incident?.incident_type ? incident.incident_type.toUpperCase().replace(/_/g, ' ') : (r1Blocked ? 'BRIDGE FAILURE' : 'GROUND DISRUPTION DETECTED')}
                      </h2>
                      <div className="text-xs text-[#7A271A] font-bold">
                        Route R1 — Chooralmala → Meppadi corridor
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#FECACA]/60 text-[10.5px]">
                      <div>
                        <span className="text-black block text-[9.5px] uppercase font-extrabold">Source Feed</span>
                        <span className="text-black font-semibold">
                          {incident?.source || 'Simulation / External Field Feed'}
                        </span>
                      </div>
                      <div>
                        <span className="text-black block text-[9.5px] uppercase font-extrabold">Corridor Status</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#FEE2E2] font-bold text-[#B42318] inline-block">
                          {r1Blocked ? 'BLOCKED' : 'DISRUPTED'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-black font-semibold italic">
                      {incident?.description || (r1Blocked ? 'Culvert bridge severed at KM 4.2' : 'Operational condition change detected')}
                    </div>
                  </div>

                  {/* Impact Summary */}
                  <div className="space-y-0.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-extrabold text-[#172033]">
                        {affectedCount} PEOPLE AFFECTED
                      </span>
                      <span className="text-[11px] font-semibold text-[#B42318]">
                        ({affectedCount} Affected Evacuees)
                      </span>
                    </div>
                    <p className="text-xs text-[#526174]">
                      Existing Plan V1 assignment invalidated · Immediate re-assessment required.
                    </p>
                  </div>

                  {/* Recommendation Card */}
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563A6]">
                        Recommended Relocation
                      </span>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#DBEAFE] text-[#174A7C]">
                        Rank #1 Alternative
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#172033]">
                        {recommendation?.recommended_shelter?.name || 'Vythiri Government Higher Secondary School (Vythiri GHSS)'}
                      </div>
                      <div className="text-xs font-semibold text-[#027A48] flex items-center gap-1 mt-0.5">
                        <Compass className="w-3.5 h-3.5" />
                        <span>{recommendation?.recommended_route?.code ? `Via Route ${recommendation.recommended_route.code}` : 'Via Route R4'}</span>
                      </div>
                    </div>

                    {/* Key Supporting Facts */}
                    <div className="pt-2 border-t border-[#BFDBFE] grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#718096] block text-[10px]">Headroom</span>
                        <strong className="text-[#027A48] font-bold">+205 capacity</strong>
                      </div>
                      <div>
                        <span className="text-[#718096] block text-[10px]">Corridor</span>
                        <strong className="text-[#172033] font-semibold">
                          {recommendation?.route_details?.distance_km ? `${recommendation.route_details.distance_km} km clear` : '16.4 km clear'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#718096] block text-[10px]">Medical</span>
                        <strong className="text-[#027A48] font-bold">Medical support</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full mt-1 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#BFDBFE] text-[#174A7C] font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <span>Review recommendation & technical evidence</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#2563A6]" />
                    </button>
                  </div>

                  {/* Primary Decision Actions */}
                  <div className="space-y-2 pt-1">
                    {isRecommendationRejected ? (
                      <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#B42318]">
                          <XCircle className="w-4 h-4 text-[#B42318]" />
                          <span>RECOMMENDATION REJECTED</span>
                        </div>
                        <p className="text-[11px] text-[#7A271A]">
                          Declined by statutory authority. Baseline Plan V1 remains in effect. A new scenario or field reassessment must be initiated.
                        </p>
                      </div>
                    ) : isChangesRequested ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-[#FFFAEB] border border-[#FEDF89] rounded-xl text-center space-y-1">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#B54708]">
                            <Edit3 className="w-4 h-4 text-[#B54708]" />
                            <span>CHANGES REQUESTED</span>
                          </div>
                          <p className="text-[11px] text-[#7A271A]">
                            Stipulations transmitted to field & GIS units. Plan V2 has not been approved. Review evidence or submit revised operational concurrence.
                          </p>
                        </div>
                        <button
                          onClick={() => handleApprove()}
                          disabled={isProcessing}
                          className="w-full bg-[#2563A6] hover:bg-[#1D4F80] active:bg-[#174A7C] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>APPROVE WITH STIPULATIONS</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove()}
                          disabled={isProcessing}
                          className="w-full bg-[#2563A6] hover:bg-[#1D4F80] active:bg-[#174A7C] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>APPROVE RECOMMENDATION</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowRequestChangesModal(true)}
                            disabled={isProcessing}
                            className="flex-1 bg-white hover:bg-[#F8FAFC] border border-[#D9E1EA] text-[#172033] font-medium text-xs py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#526174]" />
                            <span>Request changes</span>
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isProcessing}
                            className="flex-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#B42318] font-medium text-xs py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            <XCircle className="w-3.5 h-3.5 text-[#B42318]" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>


                  {/* Plan Evolution Summary */}
                  <div className="pt-2 border-t border-[#D9E1EA] text-[11px] space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">
                      Plan Evolution
                    </div>
                    <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#D9E1EA] flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-[#172033]">PLAN V1</span>
                        <div className="text-[#526174] text-[10.5px]">Chooralmala → Meppadi via R1</div>
                        {planDiff?.differences?.cause && (
                          <div className="text-[10px] text-[#718096] font-mono mt-0.5">
                            Cause: {planDiff.differences.cause}
                          </div>
                        )}
                      </div>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#B42318] border border-[#FECACA]">
                        INVALIDATED
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE C: PLAN V2 COMMITTED (Confirmed Safe State) */}
              {isV2Active && (
                <div className="p-4 space-y-3 text-xs">
                  <div className="p-3 bg-[#ECFDF3] border border-[#ABEFC6] rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-[#027A48] font-bold">
                      <CheckCircle2 className="w-4 h-4 text-[#027A48]" />
                      <span className="text-sm">PLAN V2 COMMITTED & ACTIVE</span>
                    </div>
                    <p className="text-[#027A48] text-xs leading-relaxed">
                      120 evacuees from Chooralmala rerouted to Vythiri Government Higher Secondary School (Vythiri GHSS) via Route R4.
                    </p>
                    <div className="text-[10.5px] text-[#027A48]/80 font-mono pt-1">
                      {"Chooralmala -> Vythiri GHSS -> R4 active"}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#D9E1EA] flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-mono font-bold text-[#172033]">PLAN V1</span>
                      <div className="text-[#718096] text-[10.5px]">Preserved as statutory baseline</div>
                    </div>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                      HISTORICAL
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[#718096]">Plan V1 Preserved as Historical</span>
                    <Link
                      to="/audit"
                      className="text-[#2563A6] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>View Audit Ledger</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Recommendation Modal (Progressive Disclosure answering Can I safely approve this?) */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] overflow-y-auto">
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <RecommendationPanel
              recommendation={recommendation}
              onApprove={async (notes) => {
                await handleApprove(notes);
                setShowReviewModal(false);
              }}
              onReject={async (reason) => {
                await handleReject(reason);
                setShowReviewModal(false);
              }}
              onModify={async (notes) => {
                await handleModify(notes);
                setShowReviewModal(false);
              }}
              onRequestChanges={async (reason) => {
                await handleRequestChanges(reason);
                setShowReviewModal(false);
              }}
              isProcessing={isProcessing}
              planVersion={planVersion}
              isOpen={true}
              onClose={() => setShowReviewModal(false)}
            />
          </div>
        </div>
      )}

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
                className="px-3 py-1.5 border border-[#D9E1EA] text-[#526174] rounded text-xs hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleModify(modifyNotes);
                  setShowModifyModal(false);
                }}
                className="px-3 py-1.5 bg-[#2563A6] hover:bg-[#1D4F80] text-white rounded text-xs font-bold transition cursor-pointer shadow-xs"
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
                className="px-3 py-1.5 border border-[#D9E1EA] text-[#526174] rounded text-xs hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleReject(rejectReason);
                  setShowRejectModal(false);
                }}
                className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#B42318] rounded text-xs font-bold transition cursor-pointer shadow-xs"
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
                className="px-3 py-1.5 border border-[#D9E1EA] text-[#526174] rounded text-xs hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleRequestChanges(requestChangesReason);
                  setShowRequestChangesModal(false);
                }}
                disabled={!requestChangesReason.trim() || isProcessing}
                className="px-3 py-1.5 bg-[#B54708] hover:bg-[#92400E] text-white rounded text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
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

