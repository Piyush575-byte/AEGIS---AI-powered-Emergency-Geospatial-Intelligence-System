import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Building2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import GISMap from '../components/map/GISMap';
import InsightsPanel from '../components/insights/InsightsPanel';
import DataFreshness from '../components/data-status/DataFreshness';
import PlanSelectorPopover, { type PlanVersionItem } from '../components/common/PlanSelectorPopover';
import {
  SIMULATION_STATES,
  planV1SimulationData,
  planV2SimulationData,
  mockDecisionContextV1,
  mockDecisionContextV2,
} from '../data/simulationData';
import { mockInsights, mockDataSources } from '../data/mockData';
import type { SimulationStepId, RelocationPlan } from '../types';
import { useAegisLiveState } from '../hooks/useAegisLiveState';

type DetailDrawerTab = 'situation' | 'evidence' | 'data';

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState<SimulationStepId>(4); // Defaults to Plan V1 Formulated
  const [activePlan, setActivePlan] = useState<RelocationPlan>(planV1SimulationData);
  const [selectedDistrict, setSelectedDistrict] = useState<'wayanad' | 'idukki' | 'malappuram'>('wayanad');
  
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DetailDrawerTab>('situation');
  const [incidentBannerDismissed, setIncidentBannerDismissed] = useState<string | null>(null);

  // ── Live backend state ──────────────────────────────────────────────────────
  const { incident, recommendation, simState, isLive, error: liveError } = useAegisLiveState();

  // Derive live flags from backend data
  const liveIncidentActive = !!(incident && incident.severity === 'critical');
  const liveRecommendationPending = !!(recommendation && recommendation.status === 'pending_human_approval');

  // Live R1 route status from backend
  const liveR1Route = simState?.routes?.find(r => r.code === 'R1');
  const liveR1Status = liveR1Route?.status ?? 'clear';

  // Show incident banner when there's a new critical incident the user hasn't dismissed
  const showIncidentBanner = liveIncidentActive && incidentBannerDismissed !== incident?.id;

  // Reset banner dismiss when incident changes
  useEffect(() => {
    if (incident?.id && incidentBannerDismissed && incidentBannerDismissed !== incident.id) {
      setIncidentBannerDismissed(null);
    }
  }, [incident?.id]);

  // Live KPI derived from simState
  const liveHighRiskZones = simState?.hazards?.filter(h => h.severity === 'critical' || h.severity === 'high').length ?? null;
  const liveShelterCapacity = simState?.shelters?.reduce((sum, s) => sum + s.available_capacity, 0) ?? null;
  const liveShelterTotal = simState?.shelters?.reduce((sum, s) => sum + s.total_capacity, 0) ?? null;
  const liveCapacityGap = (liveShelterTotal !== null && liveShelterCapacity !== null)
    ? Math.max(0, (simState?.active_plan?.total_evacuees ?? 0) - liveShelterCapacity)
    : null;

  const stateMeta = SIMULATION_STATES[currentStep];


  // Dynamically update Insights matching simulation state
  const dynamicInsights = mockInsights.map((insight) => {
    if (insight.id === 'ins-3') {
      const isBlocked = currentStep >= 6;
      return {
        ...insight,
        title: isBlocked ? 'CRITICAL: Route R104 BLOCKED (Bridge KM 4.2)' : insight.title,
        priority: isBlocked ? 'critical' : insight.priority,
        whatHappened: isBlocked
          ? 'Culvert failure at KM 4.2 reported by Field Squad at 14:20 IST. Road impassable for motor vehicles.'
          : insight.whatHappened,
        whyItMatters: isBlocked
          ? '150 evacuees assigned to Meppadi HSS severed. Reassignment to Kalpetta Hall required.'
          : insight.whyItMatters,
        freshness: isBlocked ? 'Verified 4 min ago (On-Scene)' : insight.freshness,
      };
    }
    return insight;
  });

  const [isPlanV2Approved, setIsPlanV2Approved] = useState(false);

  const handleStepChange = (newStep: SimulationStepId) => {
    setCurrentStep(newStep);
    if (newStep <= 5) {
      setIsPlanV2Approved(false);
      setActivePlan(
        newStep === 5
          ? { ...planV1SimulationData, status: 'approved', approvedBy: 'District Collector & Chairperson, DDMA Wayanad' }
          : planV1SimulationData
      );
    } else if (newStep >= 9) {
      if (newStep === 10) {
        setIsPlanV2Approved(true);
        setActivePlan({
          ...planV2SimulationData,
          status: 'approved',
          approvedBy: 'District Collector & Chairperson, DDMA Wayanad',
        });
      } else {
        // Step 9: Recommendation Ready / Pending Human Approval -> STILL PLAN V1 until approved!
        setIsPlanV2Approved(false);
        setActivePlan({
          ...planV1SimulationData,
          status: 'invalidated',
          affectedAssignmentsCount: 150,
        });
      }
    } else {
      setIsPlanV2Approved(false);
      setActivePlan({
        ...planV1SimulationData,
        status: 'invalidated',
        affectedAssignmentsCount: 150,
      });
    }
  };

  const [viewingPlanVersion, setViewingPlanVersion] = useState<number>(1);

  // Synchronize viewingPlanVersion when Plan V2 is approved or reset
  useEffect(() => {
    if (isPlanV2Approved) {
      setViewingPlanVersion(2);
    } else {
      setViewingPlanVersion(1);
    }
  }, [isPlanV2Approved]);

  const handleReset = () => {
    setIsPlanV2Approved(false);
    setViewingPlanVersion(1);
    handleStepChange(1);
  };

  const handleApprovePlan = (approvedPlan: RelocationPlan) => {
    if (currentStep === 4) {
      setActivePlan({ ...planV1SimulationData, status: 'approved', approvedBy: 'District Collector & Chairperson, DDMA Wayanad' });
      handleStepChange(5);
    } else if (currentStep === 9 || currentStep >= 6) {
      setIsPlanV2Approved(true);
      setViewingPlanVersion(2);
      setActivePlan({ ...planV2SimulationData, status: 'approved', approvedBy: 'District Collector & Chairperson, DDMA Wayanad' });
      handleStepChange(10);
    } else {
      setActivePlan(approvedPlan);
    }
  };

  const isPendingDecision = currentStep === 4 || (currentStep === 9 && !isPlanV2Approved);
  const isPlanApproved = (currentStep === 5 && !isPlanV2Approved) || isPlanV2Approved;
  const isIncidentActive = currentStep >= 6 && currentStep <= 8;
  const displayPlanVersion = isPlanV2Approved ? 'V2' : 'V1';
  const activeDecisionContext = isPlanV2Approved || currentStep === 9 ? mockDecisionContextV2 : mockDecisionContextV1;

  // Real plan versions available in operational state
  const availablePlans: PlanVersionItem[] = [
    {
      version: 1,
      code: 'AEGIS-PLAN-WAYANAD-V1',
      title: 'Plan V1 Baseline Relocation',
      status: isPlanV2Approved
        ? 'superseded'
        : isPendingDecision && currentStep === 4
        ? 'pending_human_approval'
        : currentStep === 5
        ? 'approved'
        : isIncidentActive
        ? 'pending_human_approval'
        : 'approved',
      statusLabel: isPlanV2Approved
        ? 'Superseded · Preserved as historical record'
        : isPendingDecision && currentStep === 4
        ? 'Recommendation Ready · Human Approval Required'
        : isIncidentActive
        ? 'Invalidated · In-transit reassessment underway'
        : 'Approved Baseline · 150 Evacuees',
      isCurrentActive: !isPlanV2Approved,
      evacueesCount: 150,
      shelterName: 'Meppadi Community Hall (Alpha)',
      routeCode: 'R104',
      approvedBy: 'District Collector & Chairman, DDMA Wayanad',
    },
  ];

  if (isPlanV2Approved || currentStep === 9) {
    availablePlans.unshift({
      version: 2,
      code: 'AEGIS-PLAN-WAYANAD-V2',
      title: 'Plan V2 Resilient Bypass Relocation',
      status: isPlanV2Approved ? 'approved' : 'pending_human_approval',
      statusLabel: isPlanV2Approved
        ? 'Approved · 150 Reassigned to Vythiri GHSS'
        : 'Formulated · Human Statutory Approval Required',
      isCurrentActive: isPlanV2Approved,
      evacueesCount: 150,
      shelterName: 'Vythiri GHSS (Gamma)',
      routeCode: 'R4 Bypass',
      approvedBy: isPlanV2Approved ? 'District Collector & Chairman, DDMA Wayanad' : null,
    });
  }

  // Displayed GIS layer configurations matching selected viewing plan
  const displayedActiveVectorType = isPlanV2Approved
    ? viewingPlanVersion === 1
      ? 'plan-v1-vectors'
      : 'plan-v2-vectors'
    : stateMeta.activeVectorType;

  const displayedRouteR104Status = isPlanV2Approved
    ? viewingPlanVersion === 1
      ? 'at-risk'
      : 'blocked'
    : stateMeta.routeR104Status;

  return (
    <div className="relative w-full h-full flex overflow-hidden select-none bg-[#F5F7FA]">
      {/* ============================================================ */}
      {/* 0. LIVE CRITICAL INCIDENT BANNER (top edge, full width)       */}
      {/* ============================================================ */}
      {showIncidentBanner && incident && (
        <div className="absolute top-0 inset-x-0 z-[1500] flex items-center justify-between gap-3 bg-[#7F1D1D] text-white px-4 py-2.5 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-200" />
            </span>
            <span className="text-xs font-bold text-red-200 shrink-0">Critical incident alert</span>
            <span className="text-sm font-semibold truncate text-white">
              {incident.incident_type?.replace(/_/g, ' ')} · {incident.description}
            </span>
            <span className="text-xs font-mono tabular-nums text-red-200 shrink-0">
              {new Date(incident.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/ddma"
              className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition min-h-[36px] flex items-center"
            >
              Open DDMA →
            </Link>
            <button
              type="button"
              onClick={() => setIncidentBannerDismissed(incident.id)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. PRIMARY MAP WORKSPACE (Occupies 100% of the canvas)        */}
      {/* ============================================================ */}
      <div className={`absolute inset-0 z-0 ${showIncidentBanner ? 'top-10' : ''}`}>
        <GISMap
          routeR104Status={displayedRouteR104Status}
          activeVectorType={displayedActiveVectorType}
        />
      </div>

      {/* ============================================================ */}
      {/* 2. FLOATING STATE SITUATION OPERATIONAL PANEL                */}
      {/* ============================================================ */}
      <div 
        className={`absolute left-3 z-[400] w-[390px] sm:w-[440px] max-w-[calc(100vw-24px)] flex flex-col aegis-floating-card overflow-hidden ${showIncidentBanner ? 'top-12' : 'top-3'}`}
        style={{ maxHeight: isPanelCollapsed ? '52px' : 'calc(100vh - 215px)' }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Card Header */}
        <div className="px-4 py-3 border-b border-slate-200/90 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              liveIncidentActive ? 'bg-[#DC2626] animate-pulse'
              : liveRecommendationPending || isIncidentActive ? 'bg-amber-500'
              : isPendingDecision ? 'bg-amber-500'
              : 'bg-[#027A48]'
            }`}></span>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-600 block leading-tight">
                State operational overview
              </span>
              <span className="text-sm font-bold text-slate-900 tracking-tight truncate block">
                Kerala SDMA · State Operations
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Live connectivity indicator */}
            {isLive
              ? <span title="Live backend connected" className="flex items-center gap-1 text-xs font-bold text-[#027A48]">
                  <Wifi className="w-3.5 h-3.5" /><span className="hidden sm:inline">Live</span>
                </span>
              : liveError
              ? <span title={liveError} className="flex items-center gap-1 text-xs font-bold text-amber-700">
                  <WifiOff className="w-3.5 h-3.5" /><span className="hidden sm:inline">Offline</span>
                </span>
              : null
            }
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="text-slate-700 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
              aria-label={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {isPanelCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Panel Body */}
        {!isPanelCollapsed && (
          <div className="overflow-y-auto overscroll-contain p-4 space-y-3.5 text-sm text-slate-800 flex-1">
            {/* 2A. Compact State Situation Metrics */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 pb-0.5">
                <span className="font-bold text-slate-800">Statewide situation</span>
                <span className="font-mono tabular-nums text-xs text-slate-600 font-semibold">13 Sept 2026</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Metric 1: High-Risk Areas — live from backend hazards */}
                <div className={`p-2.5 rounded-xl border ${
                  liveHighRiskZones && liveHighRiskZones > 5
                    ? 'bg-rose-50/90 border-rose-300'
                    : 'bg-white/95 border-slate-200/90 shadow-2xs'
                }`}>
                  <div className="text-xs font-semibold text-slate-700">High-risk areas</div>
                  <div className={`text-2xl font-bold tabular-nums mt-1 ${
                    liveHighRiskZones && liveHighRiskZones > 5 ? 'text-[#B42318]' : 'text-slate-900'
                  }`}>
                    {liveHighRiskZones ?? (currentStep >= 2 ? '12' : '8')}{' '}
                    <span className="text-xs font-medium text-slate-600">zones</span>
                  </div>
                </div>

                {/* Metric 2: Vulnerable Households */}
                <div className="p-2.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-700">Vulnerable households</div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
                    4,827 <span className="text-xs font-medium text-slate-600">families</span>
                  </div>
                </div>

                {/* Metric 3: Shelter Capacity — live from backend */}
                <div className="p-2.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-700">Shelter capacity</div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
                    {liveShelterCapacity !== null
                      ? liveShelterCapacity.toLocaleString()
                      : '18,420'}{' '}
                    <span className="text-xs font-medium text-slate-600">available</span>
                  </div>
                </div>

                {/* Metric 4: Capacity Gap — live from backend */}
                <div className={`p-2.5 rounded-xl border ${
                  (liveCapacityGap ?? 1240) > 0
                    ? 'bg-amber-50/90 border-amber-300'
                    : 'bg-emerald-50/90 border-emerald-300'
                }`}>
                  <div className={`text-xs font-semibold flex items-center justify-between ${
                    (liveCapacityGap ?? 1240) > 0 ? 'text-[#B54708]' : 'text-[#027A48]'
                  }`}>
                    <span>Capacity gap</span>
                    <span className="text-xs font-bold">{(liveCapacityGap ?? 1240) > 0 ? '▲ Attention' : '✓ OK'}</span>
                  </div>
                  <div className={`text-2xl font-bold tabular-nums mt-1 ${
                    (liveCapacityGap ?? 1240) > 0 ? 'text-[#B54708]' : 'text-[#027A48]'
                  }`}>
                    {(liveCapacityGap ?? 1240).toLocaleString()}{' '}
                    <span className="text-xs font-medium">
                      {(liveCapacityGap ?? 1240) > 0 ? 'deficit' : 'surplus'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2B. Pending State Decision / Concurrence Section */}
            {/* Priority: live backend recommendation > mock step state */}
            <div>
              {liveRecommendationPending && recommendation ? (
                /* ── LIVE: Real pending recommendation from backend ── */
                <div className="p-3.5 rounded-xl bg-[#FFFAEB] border border-[#FEDF89] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#B54708] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span>
                      Pending statutory action
                    </span>
                    <span className="text-xs font-mono font-bold text-[#B54708] bg-[#FEF08A] px-2 py-0.5 rounded flex items-center gap-1">
                      <Radio className="w-3 h-3" /> Live
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#7A271A]">
                      Wayanad DDMA · Emergency relocation recommendation
                    </h4>
                    <p className="text-sm text-slate-800 font-normal mt-1 leading-relaxed">
                      {recommendation.summary || 'Emergency rerouting recommendation requires state concurrence. Plan V2 pending executive approval.'}
                    </p>
                    {recommendation.recommended_shelter?.name && (
                      <p className="text-xs font-bold text-[#7A271A] mt-1.5 tabular-nums">
                        Proposed: {recommendation.affected_habitation?.population ?? '—'} evacuees →{' '}
                        {recommendation.recommended_shelter.name}
                        {recommendation.recommended_route?.code ? ` via ${recommendation.recommended_route.code}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="pt-1.5">
                    <Link
                      to="/ddma"
                      className="w-full min-h-[44px] px-3.5 rounded-lg bg-[#2563A6] text-white text-sm font-semibold flex items-center justify-center hover:bg-[#1D4F80] transition shadow-xs"
                    >
                      Review in Wayanad DDMA →
                    </Link>
                  </div>
                </div>
              ) : liveIncidentActive && !liveRecommendationPending ? (
                /* ── LIVE: Incident detected, decision engine running ── */
                <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
                    <span className="text-xs font-bold text-[#9F1239]">Critical incident active</span>
                  </div>
                  <p className="text-sm text-slate-800 font-normal leading-relaxed">
                    AEGIS decision engine processing field report. Recommendation pending.
                  </p>
                  <Link
                    to="/ddma"
                    className="inline-flex text-sm font-semibold text-[#DC2626] hover:underline"
                  >
                    Monitor in DDMA Command Center →
                  </Link>
                </div>
              ) : isPendingDecision ? (
                /* ── DEMO: Manual step-control driven pending action ── */
                <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#B54708] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                      Pending statutory action
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-[#B54708] bg-[#FEF08A] px-2 py-0.5 rounded">
                      1 Pending
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#7A271A]">
                      Wayanad DDMA · Relocation Plan {displayPlanVersion} {displayPlanVersion === 'V1' && currentStep === 9 ? '· Proposed V2 advisory' : `(${activePlan.id})`}
                    </h4>
                    <p className="text-sm text-slate-800 font-normal mt-1 leading-relaxed">
                      {currentStep === 4
                        ? 'Statutory baseline relocation assignment submitted for DDMA executive concurrence.'
                        : 'Emergency rerouting (Route R104 severed at KM 4.2) requires state concurrence. Plan V2 pending executive approval.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to="/ddma"
                      className="flex-1 min-h-[44px] px-3 rounded-lg bg-[#2563A6] text-white text-sm font-semibold flex items-center justify-center hover:bg-[#1D4F80] transition shadow-xs"
                    >
                      Review in Wayanad DDMA →
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleApprovePlan(currentStep === 4 ? planV1SimulationData : planV2SimulationData)}
                      className="min-h-[44px] px-4 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm font-bold hover:bg-slate-50 transition cursor-pointer shadow-xs"
                    >
                      Concur
                    </button>
                  </div>
                </div>
              ) : isPlanApproved ? (
                <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#027A48] shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-[#027A48] block">No pending state actions</span>
                      <span className="text-xs text-[#027A48] font-medium">Plan V{activePlan.version} authorized and operational.</span>
                    </div>
                  </div>
                  <Link to="/audit" className="text-xs font-bold text-[#027A48] hover:underline shrink-0">
                    Audit →
                  </Link>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/95 border border-slate-200/90 flex items-center justify-between text-slate-800">
                  <span className="text-sm font-bold">Pre-incident monitoring active</span>
                  <span className="text-xs text-slate-600 font-medium">No statutory action required</span>
                </div>
              )}
            </div>

            {/* 2C. District Focus (Wayanad High-Priority) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  District priority focus
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedDistrict('wayanad')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                      selectedDistrict === 'wayanad'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 font-medium hover:text-slate-900'
                    }`}
                  >
                    Wayanad
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDistrict('idukki')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                      selectedDistrict === 'idukki'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 font-medium hover:text-slate-900'
                    }`}
                  >
                    Idukki
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDistrict('malappuram')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                      selectedDistrict === 'malappuram'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 font-medium hover:text-slate-900'
                    }`}
                  >
                    Malappuram
                  </button>
                </div>
              </div>

              {selectedDistrict === 'wayanad' ? (
                <div className="p-3.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Wayanad District</h4>
                      <span className="text-xs text-slate-600 font-medium">Mundakkai-Meppadi critical sector</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#B42318] border border-[#FECACA]">
                      High priority
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 font-normal space-y-1.5 pt-2 border-t border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Corridor status:</span>
                      {/* Live R1 status takes priority over mock step state */}
                      <span className={`font-bold ${
                        liveR1Status === 'blocked' ? 'text-[#B42318]'
                        : liveR1Status === 'degraded' ? 'text-amber-600'
                        : isPlanV2Approved && viewingPlanVersion === 1 ? 'text-[#027A48]'
                        : isIncidentActive ? 'text-[#B42318]'
                        : 'text-[#027A48]'
                      }`}>
                        {liveR1Status === 'blocked'
                          ? 'Route R1 Blocked'
                          : liveR1Status === 'degraded'
                          ? 'Route R1 Degraded'
                          : isPlanV2Approved && viewingPlanVersion === 1
                          ? 'Route R1 Clear (Historical)'
                          : isIncidentActive
                          ? 'Route R1 Severed'
                          : currentStep >= 9 || (isPlanV2Approved && viewingPlanVersion === 2)
                          ? 'Route R1 Bypass Active'
                          : 'R1 Clear'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Affected habitations:</span>
                      <strong className="text-slate-900 font-bold">Chooralmala, Mundakkai</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Assigned shelter:</span>
                      <strong className="text-slate-900 font-bold">
                        {viewingPlanVersion === 2 ? 'Vythiri GHSS' : 'Meppadi Community Hall'}
                      </strong>
                    </div>
                  </div>

                  <Link
                    to="/ddma"
                    className="w-full min-h-[44px] mt-1 px-3.5 rounded-lg bg-white border border-slate-300 text-[#1E40AF] hover:bg-slate-50 text-sm font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>Open Wayanad DDMA Command Center</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-white/95 border border-slate-200/90 text-center text-slate-800 space-y-1">
                  <div className="text-sm font-bold text-slate-900 capitalize">{selectedDistrict} District</div>
                  <div className="text-xs text-[#027A48] font-bold">● Normal Precautionary Status</div>
                  <div className="text-xs text-slate-600 font-medium">No emergency evacuation orders active.</div>
                </div>
              )}
            </div>

            {/* 2D. Progressive Disclosure: State Evidence & Details Drawer Button */}
            <div className="pt-1 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setShowDetailDrawer(true)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>View situation evidence & technical details</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. OPERATIONAL PLAN STATUS & TOOLBAR (Top Strip)              */}
      {/* ============================================================ */}
      <div 
        className={`absolute z-[400] flex items-center justify-between gap-2 pointer-events-auto transition-all duration-200 ${showIncidentBanner ? 'top-12' : 'top-3'}`}
        style={{
          left: isPanelCollapsed ? '16px' : '380px',
          right: '12px',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <PlanSelectorPopover
            plans={availablePlans}
            viewingVersion={viewingPlanVersion}
            activeOperationalVersion={isPlanV2Approved ? 2 : 1}
            onSelectPlan={(ver) => setViewingPlanVersion(ver)}
            statusDescriptor={
              isPlanV2Approved && viewingPlanVersion === 2
                ? 'Approved · 150 to Vythiri'
                : isPlanV2Approved && viewingPlanVersion === 1
                ? 'Superseded Baseline'
                : isPendingDecision
                ? 'Recommendation Ready · Approval Required'
                : isIncidentActive
                ? 'Situation Changed · Reassessing'
                : currentStep === 5
                ? 'Approved Baseline'
                : 'Monitoring Active'
            }
            incidentNotice={stateMeta.shortDescription}
            secondaryControls={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-[#526174] hover:bg-[#F1F5F9] hover:text-[#172033] transition cursor-pointer flex items-center gap-1"
                  title="Reset to Baseline Plan V1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden lg:inline">Reset</span>
                </button>
                <button
                  type="button"
                  disabled={currentStep <= 1}
                  onClick={() => handleStepChange((currentStep - 1) as SimulationStepId)}
                  className="p-1 rounded text-[#526174] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Previous Situation Event"
                  aria-label="Previous Situation Event"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={currentStep >= 10}
                  onClick={() => handleStepChange((currentStep + 1) as SimulationStepId)}
                  className="p-1 rounded text-[#2563A6] hover:bg-[#EFF6FF] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Next Situation Event"
                  aria-label="Next Situation Event"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            }
          />
        </div>

        {/* Top Right District DDMA Link */}
        <Link
          to="/ddma"
          className="px-3 py-1.5 bg-[#2563A6] text-white rounded-full text-xs font-semibold hover:bg-[#1D4F80] transition shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap ml-2"
          title="Open District DDMA Command Center"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">District DDMA</span>
          <span className="sm:hidden">DDMA</span>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* 4. PROGRESSIVE DISCLOSURE: STATE DETAILS & EVIDENCE DRAWER    */}
      {/* ============================================================ */}
      {showDetailDrawer && (
        <div className="absolute top-3 right-3 bottom-3 z-[1000] w-[520px] sm:w-[560px] max-w-[calc(100vw-24px)] aegis-floating-card rounded-2xl bg-white/95 border border-slate-300 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div>
              <span className="text-xs font-semibold text-slate-600 block leading-tight">
                Situation evidence
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                State situation & decision telemetry
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDetailDrawer(false)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Close telemetry panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Card Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 text-sm gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDrawerTab('situation')}
              className={`px-4 py-2.5 font-semibold transition cursor-pointer rounded-t-lg min-h-[44px] flex items-center ${
                drawerTab === 'situation'
                  ? 'border-b-2 border-[#1E40AF] text-[#1E40AF] bg-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Situation posture
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('evidence')}
              className={`px-4 py-2.5 font-semibold transition cursor-pointer rounded-t-lg min-h-[44px] flex items-center ${
                drawerTab === 'evidence'
                  ? 'border-b-2 border-[#1E40AF] text-[#1E40AF] bg-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Decision evidence
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('data')}
              className={`px-4 py-2.5 font-semibold transition cursor-pointer rounded-t-lg min-h-[44px] flex items-center ${
                drawerTab === 'data'
                  ? 'border-b-2 border-[#1E40AF] text-[#1E40AF] bg-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Data freshness
            </button>
          </div>

          {/* Card Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-800">
            {drawerTab === 'situation' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Current response plan</span>
                    <span className="font-mono tabular-nums text-xs text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">{stateMeta.simulatedTime}</span>
                  </div>
                  <p className="text-sm font-normal text-slate-800 leading-relaxed">
                    {stateMeta.operationalDetail}
                  </p>
                </div>
                <InsightsPanel insights={dynamicInsights} />
              </div>
            )}

            {drawerTab === 'evidence' && (
              <div className="space-y-3.5">
                <div className="text-sm text-slate-900 font-bold">
                  Evidence base utilized for Plan V{activeDecisionContext.planVersion} multi-criteria spatial optimization:
                </div>
                <div className="space-y-2.5">
                  {activeDecisionContext.evidence.map((ev) => (
                    <div key={ev.id} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 text-sm shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-slate-900 font-bold">{ev.sourceAgency}</strong>
                        <span className="font-mono tabular-nums text-slate-600 font-semibold">{ev.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-800 font-normal leading-relaxed">
                        {ev.observation}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1.5 border-t border-slate-100">
                        <span>Confidence: <strong className="text-slate-900 font-semibold capitalize">{ev.confidence}</strong></span>
                        <span className="text-[#027A48] font-bold">{ev.classification}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audit Trail Card */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Cryptographic audit ledger</span>
                    <span className="text-xs font-mono font-bold text-[#027A48] bg-[#ECFDF3] px-2.5 py-0.5 rounded border border-[#ABEFC6]">
                      SHA-256 Valid
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-normal leading-relaxed">
                    Every statutory plan modification, recommendation, and approval is immutably sequenced.
                  </p>
                  <Link
                    to="/audit"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E40AF] hover:underline pt-1"
                  >
                    <span>Inspect full audit history</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}

            {drawerTab === 'data' && (
              <div className="space-y-3">
                <DataFreshness sources={mockDataSources} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
