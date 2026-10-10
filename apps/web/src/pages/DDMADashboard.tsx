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
          <div className="absolute top-16 right-14 z-[1000] bg-white border border-slate-300 rounded-xl p-4 max-w-sm shadow-xl text-sm text-[#172033]">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
              <span className="font-semibold text-slate-600 text-xs">
                {selectedMapFeature.type} details
              </span>
              <button 
                onClick={() => setSelectedMapFeature(null)} 
                className="text-slate-500 hover:text-slate-900 font-bold text-sm cursor-pointer p-1 rounded hover:bg-slate-100"
                aria-label="Close feature details"
              >
                ✕
              </button>
            </div>
            <div className="font-bold text-[16px] text-[#172033]">{selectedMapFeature.title}</div>
            {selectedMapFeature.subtitle && (
              <div className="text-slate-700 font-medium text-[14px] mt-1">{selectedMapFeature.subtitle}</div>
            )}
            {selectedMapFeature.details && (
              <div className="text-slate-600 text-[13px] mt-1.5 leading-relaxed">{selectedMapFeature.details}</div>
            )}
          </div>
        )}

        {/* 4. SMART FLOATING OPERATIONAL PANEL */}
        <div 
          className="absolute top-3 left-3 z-[1000] w-[390px] sm:w-[440px] max-w-[calc(100vw-24px)] aegis-floating-card overflow-hidden"
          style={{
            height: drawerCollapsed ? '50px' : (r1Blocked || isRecommendationPending || isV2Active || isViewingHistorical) ? undefined : 'auto',
            maxHeight: drawerCollapsed ? '50px' : 'min(640px, calc(100vh - 120px))',
          }}
        >
          {/* Card Header & Collapse Toggle */}
          <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isViewingHistorical ? 'bg-slate-400' : r1Blocked || isRecommendationPending ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`}></span>
              <span className="text-[14px] font-bold text-[#172033]">
                {isViewingHistorical ? 'Historical plan inspection' : r1Blocked || isRecommendationPending ? 'Critical operational decision' : isV2Active ? 'Plan V2 active' : 'Baseline monitoring'}
              </span>
            </div>
            <button
              onClick={() => setDrawerCollapsed(!drawerCollapsed)}
              className="text-slate-700 hover:text-black p-1.5 rounded-md hover:bg-slate-200 transition cursor-pointer"
              title={drawerCollapsed ? 'Expand panel' : 'Collapse panel'}
              aria-label={drawerCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {drawerCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>

          {!drawerCollapsed && (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {/* Historical Inspection Notice if inspecting Plan V1 */}
              {isViewingHistorical && (
                <div className="p-3.5 m-3.5 mb-0 bg-amber-50 border border-amber-300 rounded-xl text-sm space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-700" />
                      <span>Viewing historical Plan V{viewingVersion}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(planVersion)}
                      className="underline font-bold text-amber-900 hover:text-black cursor-pointer text-xs"
                    >
                      Return to active Plan V{planVersion}
                    </button>
                  </div>
                  <p className="text-[13px] text-amber-900 leading-relaxed">
                    Inspecting superseded Plan V1 baseline (Chooralmala → Meppadi via Route R1). Active statutory operational plan is Plan V2.
                  </p>
                </div>
              )}

              {/* STATE A: BASELINE MONITORING */}
              {!r1Blocked && !isRecommendationPending && !isV2Active && (
                <div className="p-5 space-y-3.5">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#172033]">
                      Chooralmala → Meppadi corridor
                    </h2>
                    <div className="text-[14px] text-slate-700 font-medium mt-1">
                      120 people assigned · Meppadi Community Hall via Route R1
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-sm">
                    <div className="flex items-center gap-2 text-[#027A48] font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#027A48]"></span>
                      <span>Route clear</span>
                    </div>
                    <span className="text-[13px] text-slate-600 font-medium">
                      No emergency decision required
                    </span>
                  </div>
                </div>
              )}

              {/* STATE B: INCIDENT & RECOMMENDATION */}
              {(r1Blocked || isRecommendationPending) && !isV2Active && (
                <div className="p-5 space-y-4 text-sm">
                  {/* 1. Incident Alert Block */}
                  <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold bg-red-100 text-red-900 border border-red-200 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                        Critical incident detected
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-700 font-semibold">
                        {reportedTimeStr}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-[17px] font-extrabold text-[#991B1B] leading-tight">
                        {incident?.incident_type ? incident.incident_type.replace(/_/g, ' ') : (r1Blocked ? 'Bridge failure on Route R1' : 'Ground disruption detected')}
                      </h2>
                      <div className="text-[14px] text-red-900 font-semibold mt-0.5">
                        Route R1 — Chooralmala to Meppadi corridor
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-red-200 text-[13px]">
                      <div>
                        <span className="text-slate-700 block text-xs font-medium">Source feed</span>
                        <span className="text-slate-900 font-semibold">
                          {incident?.source || 'Field sensor & telemetry'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-700 block text-xs font-medium">Corridor status</span>
                        <span className="px-2 py-0.5 rounded bg-red-100 font-bold text-red-900 border border-red-200 inline-block text-xs">
                          {r1Blocked ? 'Blocked' : 'Disrupted'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[13px] text-slate-800 italic pt-1 border-t border-red-100">
                      {incident?.description || (r1Blocked ? 'Culvert bridge severed at KM 4.2 due to flash ground movement.' : 'Operational condition change detected in corridor.')}
                    </div>
                  </div>

                  {/* 2. Impact Summary */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[15px] font-bold text-[#172033]">
                        {affectedCount} people affected
                      </span>
                      <span className="text-[13px] font-semibold text-red-700 tabular-nums">
                        Evacuation assignment invalidated
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-700 leading-snug">
                      Primary Route R1 access impassable. Immediate relocation reassignment formulated.
                    </p>
                  </div>

                  {/* 3. Recommendation Card */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                        Recommended relocation
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        Rank #1 alternative
                      </span>
                    </div>

                    <div>
                      <div className="text-[16px] font-bold text-[#172033] leading-snug">
                        {recommendation?.recommended_shelter?.name || 'Vythiri Government Higher Secondary School (Vythiri GHSS)'}
                      </div>
                      <div className="text-[14px] font-semibold text-[#027A48] flex items-center gap-1.5 mt-1">
                        <Compass className="w-4 h-4" />
                        <span>{recommendation?.recommended_route?.code ? `Via Route ${recommendation.recommended_route.code}` : 'Via Route R4 bypass corridor'}</span>
                      </div>
                    </div>

                    {/* Key Supporting Facts Matrix */}
                    <div className="pt-2.5 border-t border-blue-200 grid grid-cols-3 gap-2 text-[13px]">
                      <div>
                        <span className="text-slate-600 block text-xs">Available capacity</span>
                        <strong className="text-[#027A48] font-bold tabular-nums">+205 beds</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-xs">Route distance</span>
                        <strong className="text-[#172033] font-semibold tabular-nums">
                          {recommendation?.route_details?.distance_km ? `${recommendation.route_details.distance_km} km clear` : '16.4 km clear'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-xs">Medical support</span>
                        <strong className="text-[#027A48] font-bold">Available on-site</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full mt-1 bg-white hover:bg-slate-50 border border-blue-300 text-blue-900 font-semibold text-[14px] py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer shadow-xs min-h-[42px]"
                    >
                      <span>Review recommendation & technical evidence</span>
                      <ChevronRight className="w-4 h-4 text-blue-700" />
                    </button>
                  </div>

                  {/* 4. Primary Statutory Decision Actions */}
                  <div className="space-y-2.5 pt-1">
                    {isRecommendationRejected ? (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-center space-y-1">
                        <div className="flex items-center justify-center gap-2 text-sm font-bold text-red-800">
                          <XCircle className="w-4 h-4 text-red-700" />
                          <span>Recommendation rejected</span>
                        </div>
                        <p className="text-[13px] text-red-900">
                          Declined by statutory authority. Baseline Plan V1 remains in effect. Field reassessment required.
                        </p>
                      </div>
                    ) : isChangesRequested ? (
                      <div className="space-y-2.5">
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
                          <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-800">
                            <Edit3 className="w-4 h-4 text-amber-700" />
                            <span>Changes requested</span>
                          </div>
                          <p className="text-[13px] text-amber-900">
                            Directives transmitted to field command. Plan V2 has not been authorized.
                          </p>
                        </div>
                        <button
                          onClick={() => handleApprove()}
                          disabled={isProcessing}
                          className="w-full bg-[#1D5B99] hover:bg-[#154575] text-white font-bold text-[15px] py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer min-h-[46px]"
                        >
                          <CheckCircle2 className="w-5 h-5 text-white" />
                          <span>Approve with stipulations</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove()}
                          disabled={isProcessing}
                          className="w-full bg-[#1D5B99] hover:bg-[#154575] text-white font-bold text-[15px] py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer min-h-[46px]"
                        >
                          <CheckCircle2 className="w-5 h-5 text-white" />
                          <span>Approve recommendation</span>
                        </button>

                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setShowRequestChangesModal(true)}
                            disabled={isProcessing}
                            className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-[14px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs min-h-[42px]"
                          >
                            <Edit3 className="w-4 h-4 text-slate-600" />
                            <span>Request changes</span>
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isProcessing}
                            className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-semibold text-[14px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs min-h-[42px]"
                          >
                            <XCircle className="w-4 h-4 text-red-700" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 5. Plan Evolution Summary */}
                  <div className="pt-2.5 border-t border-slate-200 text-sm space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700">
                      Plan evolution
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[14px] text-[#172033]">Plan V1</span>
                        <div className="text-slate-700 text-[13px]">Chooralmala → Meppadi via Route R1</div>
                        {planDiff?.differences?.cause && (
                          <div className="text-xs text-slate-600 font-mono mt-0.5">
                            Cause: {planDiff.differences.cause}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                        Invalidated
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE C: PLAN V2 COMMITTED */}
              {isV2Active && (
                <div className="p-5 space-y-4 text-sm">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[#027A48] font-bold">
                      <CheckCircle2 className="w-5 h-5 text-[#027A48]" />
                      <span className="text-[16px]">Plan V2 committed & active</span>
                    </div>
                    <p className="text-slate-800 text-[14px] leading-relaxed">
                      120 evacuees from Chooralmala rerouted to Vythiri Government Higher Secondary School (Vythiri GHSS) via Route R4.
                    </p>
                    <div className="text-xs text-emerald-800 font-mono pt-1">
                      Chooralmala → Vythiri GHSS → Route R4 active
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-[#172033]">Plan V1</span>
                      <div className="text-slate-600 text-xs">Preserved as statutory baseline</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      Historical
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600 text-xs">Plan V1 preserved in audit ledger</span>
                    <Link
                      to="/audit"
                      className="text-blue-800 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>View audit ledger</span>
                      <ChevronRight className="w-4 h-4" />
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

