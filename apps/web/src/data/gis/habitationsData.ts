import type { FeatureCollection } from 'geojson';
import { ENTITY_IDS } from '../simulationData';

export const habitationsGeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.HABITATIONS.MUNDAKKAI,
        name: 'Mundakkai',
        households: 427,
        population: 1495,
        exposure: 'CRITICAL',
        risk: 'critical',
        affectedPopulation: 1495,
        priority: 'IMMEDIATE EVACUATION (P1)',
        terrain: 'High-altitude slope (850m MSL)',
      },
      geometry: { type: 'Point', coordinates: [76.138, 11.535] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.HABITATIONS.CHOORALMALA,
        name: 'Chooralmala',
        households: 312,
        population: 1090,
        exposure: 'HIGH',
        risk: 'high',
        affectedPopulation: 1090,
        priority: 'HIGH ALERT TRANSIT (P2)',
        terrain: 'Riverine confluence & market sector',
      },
      geometry: { type: 'Point', coordinates: [76.110, 11.525] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.HABITATIONS.ATTAMALA,
        name: 'Attamala',
        households: 156,
        population: 546,
        exposure: 'WARNING',
        risk: 'moderate',
        affectedPopulation: 546,
        priority: 'PRECAUTIONARY RELOCATION (P3)',
        terrain: 'Tea plantation slope crest',
      },
      geometry: { type: 'Point', coordinates: [76.148, 11.518] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.HABITATIONS.MEPPADI,
        name: 'Meppadi Town Habitation',
        households: 89,
        population: 312,
        exposure: 'MODERATE',
        risk: 'low',
        affectedPopulation: 312,
        priority: 'LOCAL STAGING / SHELTERING',
        terrain: 'Valley nodal township',
      },
      geometry: { type: 'Point', coordinates: [76.126, 11.554] },
    },
  ],
};
