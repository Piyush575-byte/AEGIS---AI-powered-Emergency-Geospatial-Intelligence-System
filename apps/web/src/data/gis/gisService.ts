import type { FeatureCollection } from 'geojson';
import { hazardZonesGeoJSON } from './hazardsData';
import { habitationsGeoJSON } from './habitationsData';
import { sheltersGeoJSON } from './sheltersData';
import { roadsGeoJSON } from './roadsData';
import {
  movementVectorsV1GeoJSON,
  movementVectorsInvalidatedGeoJSON,
  movementVectorsV2GeoJSON,
  bridgeBreachIncidentGeoJSON,
} from './movementVectorsData';

/**
 * GIS Data Service
 * 
 * Provides an extensible abstraction for spatial datasets in AEGIS.
 * In development, returns calibrated canonical demo GeoJSON datasets.
 * In production, easily swapped for REST API endpoints:
 * - GET /api/hazards
 * - GET /api/habitations
 * - GET /api/shelters
 * - GET /api/roads
 * - GET /api/movement-vectors
 */
export async function getHazardZones(): Promise<FeatureCollection> {
  // Simulating instant resolved promise ready for future fetch('/api/hazards')
  return Promise.resolve(hazardZonesGeoJSON);
}

export async function getHabitations(): Promise<FeatureCollection> {
  return Promise.resolve(habitationsGeoJSON);
}

export async function getReliefShelters(): Promise<FeatureCollection> {
  return Promise.resolve(sheltersGeoJSON);
}

export async function getRoadNetwork(): Promise<FeatureCollection> {
  return Promise.resolve(roadsGeoJSON);
}

export async function getMovementVectors(
  type: 'none' | 'plan-v1-vectors' | 'plan-v1-invalidated-vector' | 'plan-v2-vectors'
): Promise<FeatureCollection> {
  if (type === 'plan-v1-vectors') return Promise.resolve(movementVectorsV1GeoJSON);
  if (type === 'plan-v1-invalidated-vector') return Promise.resolve(movementVectorsInvalidatedGeoJSON);
  if (type === 'plan-v2-vectors') return Promise.resolve(movementVectorsV2GeoJSON);
  return Promise.resolve({ type: 'FeatureCollection', features: [] });
}

export async function getBridgeBreachIncident(): Promise<FeatureCollection> {
  return Promise.resolve(bridgeBreachIncidentGeoJSON);
}
