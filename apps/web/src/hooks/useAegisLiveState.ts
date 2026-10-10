/**
 * useAegisLiveState
 * 
 * Polls the AEGIS backend every 5 seconds for:
 *  - Latest critical incident (GET /api/v1/incidents/latest)
 *  - Active recommendation (GET /api/v1/recommendations)
 *  - Simulation world state  (GET /api/v1/simulate/state)
 *
 * Used by the SDMA Dashboard to receive live updates from the Simulation page.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  api,
  type IncidentData,
  type RecommendationData,
  type SimulationStateResponse,
} from '../services/api';

export interface AegisLiveState {
  /** Latest incident from backend (null if none or backend offline) */
  incident: IncidentData | null;
  /** Latest pending recommendation (null if none) */
  recommendation: RecommendationData | null;
  /** Full simulation world state (routes, shelters, plans) */
  simState: SimulationStateResponse | null;
  /** True once the first successful poll has completed */
  isLive: boolean;
  /** Backend connectivity error message, or null */
  error: string | null;
  /** Manually trigger a refresh immediately */
  refresh: () => void;
}

const POLL_INTERVAL_MS = 5000;

export function useAegisLiveState(): AegisLiveState {
  const [incident, setIncident] = useState<IncidentData | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [simState, setSimState] = useState<SimulationStateResponse | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const [incRes, recRes, stateRes] = await Promise.all([
        api.getLatestIncident().catch(() => null),
        api.getLatestRecommendation().catch(() => null),
        api.getSimulationState().catch(() => null),
      ]);

      // Incident: backend returns { incident: null } when no incident exists
      if (incRes && 'id' in incRes) {
        setIncident(incRes as IncidentData);
      } else {
        setIncident(null);
      }

      // Recommendation
      setRecommendation(recRes);

      // Simulation state
      if (stateRes) {
        setSimState(stateRes);
      }

      setError(null);
      setIsLive(true);
    } catch (err: any) {
      // Don't clear existing data on transient errors
      setError(err?.message || 'Backend unreachable');
    }
  }, []);

  useEffect(() => {
    // Initial fetch immediately
    poll();

    // Then poll on interval
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [poll]);

  return { incident, recommendation, simState, isLive, error, refresh: poll };
}
