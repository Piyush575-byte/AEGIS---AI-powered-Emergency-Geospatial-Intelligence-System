import type { FeatureCollection } from 'geojson';
import { ENTITY_IDS } from '../simulationData';

export const roadsGeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.ROUTES.R104,
        name: 'Route R104 (Mundakkai-Meppadi Corridor)',
        status: 'AT-RISK',
        statusType: 'at-risk', // 'clear' | 'at-risk' | 'blocked'
        affectedPopulation: '150 households / 525 persons',
        lastVerification: '2h 17m ago (Stale Telemetry)',
        source: 'Field Officer (Vythiri Taluk Squad)',
        isR104: true,
        criticalPavement: 'Culvert Bridge KM 4.2',
        lengthKm: 7.8,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.138, 11.535], [76.125, 11.530], [76.110, 11.525],
          [76.118, 11.540], [76.128, 11.556]
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.ROUTES.R212,
        name: 'Route R212 (Meppadi-Kalpetta Arterial Highway)',
        status: 'CLEAR',
        statusType: 'clear',
        affectedPopulation: '0 (Fully Passable)',
        lastVerification: '25 min ago (PWD Automated Sensor)',
        source: 'PWD Roads & Bridges Division',
        isR104: false,
        criticalPavement: 'Two-Lane Bituminous Surface',
        lengthKm: 12.4,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.128, 11.556], [76.115, 11.570], [76.100, 11.585],
          [76.090, 11.598], [76.083, 11.608]
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.ROUTES.R318,
        name: 'Route R318 (Chooralmala-Vythiri Bypass Corridor)',
        status: 'CLEAR',
        statusType: 'clear',
        affectedPopulation: '0 (Fully Passable)',
        lastVerification: '40 min ago (Drone Patrol Feed)',
        source: 'Taluk Revenue & Police Squad',
        isR104: false,
        criticalPavement: 'Hill Bypass Single-Lane All-Weather Road',
        lengthKm: 9.6,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.110, 11.525], [76.085, 11.535], [76.065, 11.542],
          [76.042, 11.551]
        ],
      },
    },
  ],
};
