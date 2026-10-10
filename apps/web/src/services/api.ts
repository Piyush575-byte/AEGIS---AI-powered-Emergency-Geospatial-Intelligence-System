/**
 * AEGIS API Client
 * Connects to FastAPI backend via /api/v1 (proxied to http://127.0.0.1:8000)
 * Decision-Support Advisory Layer for Wayanad DDMA
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL
  ? `${String((import.meta as any).env.VITE_API_BASE_URL).replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

export interface HabitationFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    id: string;
    code: string;
    name: string;
    population: number;
    households: number;
    risk_level: string;
    metadata?: Record<string, any>;
  };
}

export interface ShelterFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    id: string;
    code: string;
    name: string;
    total_capacity: number;
    occupied_capacity: number;
    available_capacity: number;
    medical_support: boolean;
    status: string;
    metadata?: Record<string, any>;
  };
}

export interface RouteFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: [number, number][] };
  properties: {
    id: string;
    code: string;
    name: string;
    status: 'clear' | 'degraded' | 'blocked';
    distance_km: number;
    capacity_pax_hour: number;
    metadata?: Record<string, any>;
  };
}

export interface HazardZoneFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: [number, number][][] };
  properties: {
    id: string;
    code: string;
    name: string;
    hazard_type: string;
    severity: string;
    rainfall_24h_mm: number;
    slope_saturation_pct: number;
    metadata?: Record<string, any>;
  };
}

export interface GeoDataResponse {
  habitations: { type: 'FeatureCollection'; features: HabitationFeature[] };
  shelters: { type: 'FeatureCollection'; features: ShelterFeature[] };
  routes: { type: 'FeatureCollection'; features: RouteFeature[] };
  hazard_zones: { type: 'FeatureCollection'; features: HazardZoneFeature[] };
}

export interface Assignment {
  id: string;
  habitation_code: string;
  habitation_name: string;
  shelter_code: string;
  shelter_name: string;
  route_code: string;
  route_name: string;
  allocated_population: number;
  priority_order: number;
  status: 'active' | 'invalidated';
}

export interface PlanAssignmentsResponse {
  plan_id: string;
  plan_code: string;
  version: number;
  plan_status: string;
  total_evacuees: number;
  assignments: Assignment[];
}

export interface RecommendationCandidate {
  shelter_id: string;
  shelter_code: string;
  shelter_name: string;
  capacity_feasible: boolean;
  available_capacity: number;
  route_feasible: boolean;
  route_code: string;
  route_distance_km: number;
  is_valid: boolean;
  rejection_reason: string | null;
}

export interface MCDARankItem {
  rank: number;
  shelter_id: string;
  shelter_code: string;
  shelter_name: string;
  route_code: string;
  score_breakdown: {
    distance_km: number;
    norm_distance: number;
    headroom_pax: number;
    norm_headroom: number;
    safety_norm: number;
    medical_flag: number;
    composite_score: number;
    weights: {
      distance: number;
      headroom: number;
      safety: number;
      medical: number;
    };
  };
}

export interface RecommendationData {
  recommendation_id: string;
  incident_id: string;
  plan_id: string;
  status: 'pending_human_approval' | 'approved' | 'rejected' | 'changes_requested';
  affected_habitation: {
    id: string;
    code: string;
    name: string;
    population: number;
  };
  recommended_shelter: {
    id: string | null;
    code: string | null;
    name: string | null;
  };
  recommended_route: {
    id: string | null;
    code: string | null;
    name: string | null;
  };
  summary: string;
  evaluations: RecommendationCandidate[];
  mcda_ranking: MCDARankItem[];
  route_details: {
    route_code: string;
    route_name: string;
    distance_km: number;
    status: string;
    path: string[];
  };
  created_at: string;
}

export interface PlanDiffResponse {
  has_v2: boolean;
  plan_v1: {
    plan_code: string;
    version: number;
    status: string;
    habitation: string;
    shelter_code: string;
    shelter_name: string;
    route_code: string;
    route_name: string;
    route_status: string;
    allocated_population: number;
    approved_by: string;
    invalidation_reason: string | null;
  };
  plan_v2: {
    plan_code: string;
    version: number;
    status: string;
    habitation: string;
    shelter_code: string;
    shelter_name: string;
    route_code: string;
    route_name: string;
    route_status: string;
    allocated_population: number;
    approved_by: string | null;
    approved_at: string | null;
  };
  differences: {
    shelter_changed: boolean;
    previous_shelter: string;
    new_shelter: string;
    route_changed: boolean;
    previous_route: string;
    new_route: string;
    cause: string;
    population_reconciled: boolean;
  };
}

export interface RelocationPlanItem {
  id: string;
  plan_code: string;
  version: number;
  status: string;
  total_evacuees: number;
  approved_by?: string | null;
  approved_at?: string | null;
  invalidated_at?: string | null;
  invalidation_reason?: string | null;
  decision_context?: Record<string, any> | null;
}

export interface AuditEvent {
  id: string;
  sequence_num: number;
  event_type: string;
  actor: string;
  prev_hash: string | null;
  curr_hash: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface AuditTrailResponse {
  chain_valid: boolean;
  total_events: number;
  validation_message: string;
  tamper_detected: boolean;
  validation_errors: string[];
  events: AuditEvent[];
}

export interface IncidentData {
  id: string;
  incident_type: string;
  description: string;
  status: string;
  severity: string;
  source?: string;
  raw_payload?: Record<string, any>;
  reported_at: string;
}

// Fetch helper with standard error handling
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`API Error [${res.status}]: ${errBody || res.statusText}`);
  }
  return res.json();
}

export interface SimulationAlternative {
  shelter_code: string;
  shelter_name: string;
  available_capacity: number;
  corridor_code: string;
  corridor_name: string;
  corridor_status: string;
  distance_km: number;
  medical_support: boolean;
  mcda_composite_score: number;
  accessibility_score: number;
}

export interface SimulationDecisionResult {
  status: 'RECOMMENDATION_READY' | 'NO_IMPACT' | 'RECOVERED';
  execution_time_ms: number;
  incident: any;
  what_changed: {
    source: string;
    change_type: string;
    [key: string]: any;
  };
  what_is_affected: {
    habitation?: string;
    population?: number;
    compromised_assignment?: string;
    reason?: string;
    [key: string]: any;
  };
  is_plan_feasible: boolean;
  options_no_longer_feasible: string[];
  alternatives_available: SimulationAlternative[];
  recommended_change?: {
    shelter: string;
    route: string;
    summary: string;
  };
  recommendation?: {
    id: string;
    recommendation_code: string;
    status: string;
    summary: string;
    affected_population: number;
    recommended_shelter_code: string;
    recommended_shelter_name: string;
    recommended_route_code: string;
    recommended_route_name: string;
    action_type: string;
    created_at: string;
  };
  human_approval_required: boolean;
  approval_status: 'PENDING_HUMAN_APPROVAL' | 'APPROVED' | 'REJECTED' | 'NOT_APPLICABLE';
  audit_hash: string;
}

export interface SimulationStateResponse {
  active_plan: {
    id: string;
    code: string;
    version: number;
    status: string;
    total_evacuees: number;
    assignments: Array<{
      id: string;
      habitation_code: string;
      habitation_name: string;
      shelter_code: string;
      shelter_name: string;
      route_code: string;
      route_name: string;
      allocated_population: number;
      status: string;
    }>;
  };
  routes: Array<{
    id: string;
    code: string;
    name: string;
    status: 'clear' | 'degraded' | 'blocked';
    distance_km: number;
    capacity_pax_hour: number;
  }>;
  shelters: Array<{
    id: string;
    code: string;
    name: string;
    total_capacity: number;
    occupied_capacity: number;
    available_capacity: number;
    medical_support: boolean;
    status: string;
  }>;
  hazards: Array<{
    id: string;
    code: string;
    name: string;
    hazard_type: string;
    severity: string;
  }>;
  habitations: Array<{
    id: string;
    code: string;
    name: string;
    population: number;
    risk_level: string;
  }>;
}

export const api = {
  // Spatial Data
  getGeodata: (params?: { zoom?: number; min_lon?: number; min_lat?: number; max_lon?: number; max_lat?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.zoom !== undefined) q.append('zoom', String(params.zoom));
    if (params?.min_lon !== undefined) q.append('min_lon', String(params.min_lon));
    if (params?.min_lat !== undefined) q.append('min_lat', String(params.min_lat));
    if (params?.max_lon !== undefined) q.append('max_lon', String(params.max_lon));
    if (params?.max_lat !== undefined) q.append('max_lat', String(params.max_lat));
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    const qs = q.toString();
    return fetchJson<GeoDataResponse>(`${API_BASE}/geodata${qs ? `?${qs}` : ''}`);
  },

  getGeodataSummary: () => fetchJson<{
    status: string;
    total_districts: number;
    districts: Array<{
      district: string;
      total_habitations: number;
      total_population: number;
      at_risk_zones: number;
      center: [number, number];
      shelters_count: number;
      total_capacity: number;
      available_capacity: number;
    }>;
  }>(`${API_BASE}/geodata/summary`),
  
  // Incidents
  getLatestIncident: () => fetchJson<IncidentData | { incident: null; message: string }>(`${API_BASE}/incidents/latest`),

  // Plans & Assignments
  getAssignments: (planId?: string) => 
    fetchJson<PlanAssignmentsResponse>(planId ? `${API_BASE}/assignments?plan_id=${planId}` : `${API_BASE}/assignments`),

  getPlans: () => fetchJson<RelocationPlanItem[]>(`${API_BASE}/plans`),

  getPlanDiff: () => fetchJson<PlanDiffResponse>(`${API_BASE}/plans/diff`),

  // Recommendations
  getLatestRecommendation: async (): Promise<RecommendationData | null> => {
    try {
      const res = await fetchJson<{ recommendation: RecommendationData | null; has_active_recommendation: boolean }>(`${API_BASE}/recommendations`);
      return res.recommendation;
    } catch {
      return null;
    }
  },

  approveRecommendation: (
    recommendationId: string,
    payload: {
      approved_by?: string;
      authority_role?: string;
      notes?: string;
    } = {}
  ) =>
    fetchJson<{
      status: string;
      message: string;
      plan_v1: any;
      plan_v2: any;
      audit_chain: any;
    }>(`${API_BASE}/recommendations/${recommendationId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        approved_by: payload.approved_by || 'District Collector & Chairman, DDMA Wayanad',
        authority_role: payload.authority_role || 'DDMA / District Authority',
        notes: payload.notes || 'Statutory concurrence granted following Route R1 bridge failure. Plan V2 executed.',
      }),
    }),

  rejectRecommendation: (
    recommendationId: string,
    payload: { rejected_by?: string; rejection_reason?: string } = {}
  ) =>
    fetchJson<{ status: string; message: string }>(`${API_BASE}/recommendations/${recommendationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        rejected_by: payload.rejected_by || 'District Collector & Chairman, DDMA Wayanad',
        rejection_reason: payload.rejection_reason || 'Alternative shelter location requested by incident command.',
      }),
    }),

  modifyRecommendation: (
    recommendationId: string,
    payload: { modified_by?: string; notes?: string } = {}
  ) =>
    fetchJson<{ status: string; message: string; plan_v2: any }>(`${API_BASE}/recommendations/${recommendationId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        modified_by: payload.modified_by || 'District Collector & Chairman, DDMA Wayanad',
        authority_role: 'DDMA / District Authority',
        notes: payload.notes || 'Approved with operational modification: Added transit escort and medical triage on Route R4 bypass corridor.',
      }),
    }),

  requestChangesRecommendation: (
    recommendationId: string,
    payload: { requested_by?: string; reason: string }
  ) =>
    fetchJson<{ status: string; message: string; recommendation_id: string; reason: string }>(
      `${API_BASE}/recommendations/${recommendationId}/request-changes`,
      {
        method: 'POST',
        body: JSON.stringify({
          requested_by: payload.requested_by || 'District Collector & Chairman, DDMA Wayanad',
          reason: payload.reason,
        }),
      }
    ),

  // Simulation Controls
  simulateRouteBlock: (corridorCode = 'R1') =>
    fetchJson<any>(`${API_BASE}/simulate/route-block`, {
      method: 'POST',
      body: JSON.stringify({
        corridor_code: corridorCode,
        description: 'SIMULATION EVENT: Landslide surge severed bridge on primary evacuation corridor R1 at KM 4.2',
        incident_type: 'bridge_failure',
      }),
    }),

  getSimulationState: () =>
    fetchJson<SimulationStateResponse>(`${API_BASE}/simulate/state`),

  simulateRoute: (payload: {
    corridor_code: string;
    status: 'clear' | 'degraded' | 'blocked';
    reason?: string;
    description?: string;
    source?: string;
  }) =>
    fetchJson<SimulationDecisionResult>(`${API_BASE}/simulate/route`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  simulateShelter: (payload: {
    shelter_code: string;
    new_capacity?: number;
    status?: string;
    medical_support?: boolean;
    reason?: string;
    description?: string;
    source?: string;
  }) =>
    fetchJson<SimulationDecisionResult>(`${API_BASE}/simulate/shelter`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  simulateHazard: (payload: {
    hazard_code: string;
    action?: 'expand' | 'move' | 'severity';
    radius_km_delta?: number;
    lat_offset?: number;
    lon_offset?: number;
    severity?: string;
    description?: string;
    source?: string;
  }) =>
    fetchJson<SimulationDecisionResult>(`${API_BASE}/simulate/hazard`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  simulatePopulation: (payload: {
    habitation_code: string;
    population_delta: number;
    severity?: string;
    description?: string;
    source?: string;
  }) =>
    fetchJson<SimulationDecisionResult>(`${API_BASE}/simulate/population`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  simulateIncident: (payload: {
    incident_type: string;
    location_code?: string;
    severity: string;
    description: string;
    reported_by: string;
    source?: string;
  }) =>
    fetchJson<SimulationDecisionResult>(`${API_BASE}/simulate/incident`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  simulateCascade: (payload: {
    title?: string;
    events: Array<Record<string, any>>;
    source?: string;
  }) =>
    fetchJson<SimulationDecisionResult>(`${API_BASE}/simulate/cascade`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetSimulation: () =>
    fetchJson<{ status: string; message: string; data?: any }>(`${API_BASE}/simulate/reset`, {
      method: 'POST',
    }),

  // Audit Ledger
  getAuditTrail: () => fetchJson<AuditTrailResponse>(`${API_BASE}/audit`),
};
