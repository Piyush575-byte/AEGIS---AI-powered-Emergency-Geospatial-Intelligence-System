import type { FeatureCollection } from 'geojson';

export const movementVectorsV1GeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'vec-v1-meppadi',
        name: 'Plan V1 Corridor: Mundakkai → Meppadi HSS',
        evacuees: 612,
        destination: 'Meppadi Govt. HSS',
        origin: 'Mundakkai',
        plan: 'Plan V1',
        status: 'Active Transit',
        color: '#15803d',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.128, 11.556]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'vec-v1-kalpetta',
        name: 'Plan V1 Corridor: Mundakkai → Kalpetta Hall',
        evacuees: 503,
        destination: 'Kalpetta Community Hall',
        origin: 'Mundakkai',
        plan: 'Plan V1',
        status: 'Active Transit',
        color: '#15803d',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.115, 11.570], [76.083, 11.608]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'vec-v1-vythiri',
        name: "Plan V1 Corridor: Mundakkai → St. Mary's Vythiri",
        evacuees: 380,
        destination: "St. Mary's School Vythiri",
        origin: 'Mundakkai',
        plan: 'Plan V1',
        status: 'Active Transit',
        color: '#15803d',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.085, 11.535], [76.042, 11.551]],
      },
    },
  ],
};

export const movementVectorsInvalidatedGeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'vec-inv-r104',
        name: 'SEVERED CORRIDOR: R104 Failure (150 Evacuees Severed)',
        evacuees: 150,
        destination: 'BLOCKED AT KM 4.2 CULVERT',
        origin: 'Mundakkai / Chooralmala',
        plan: 'Plan V1 (INVALIDATED)',
        status: 'SEVERED / BLOCKED',
        color: '#b91c1c',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.125, 11.530]],
      },
    },
  ],
};

export const movementVectorsV2GeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'vec-v2-kalpetta',
        name: 'Plan V2 PRIMARY: Mundakkai → Kalpetta Hall (via R212)',
        evacuees: 612,
        destination: 'Kalpetta Community Hall (Primary Hub)',
        origin: 'Mundakkai',
        plan: 'Plan V2 (Resilient)',
        status: 'Rerouted & Approved',
        color: '#1d4ed8',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.110, 11.525], [76.115, 11.570], [76.083, 11.608]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'vec-v2-vythiri',
        name: "Plan V2 SECONDARY: Mundakkai → St. Mary's Vythiri (via R318)",
        evacuees: 503,
        destination: "St. Mary's School Vythiri (Secondary Hub)",
        origin: 'Chooralmala / Mundakkai',
        plan: 'Plan V2 (Resilient)',
        status: 'Rerouted & Approved',
        color: '#1d4ed8',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.085, 11.535], [76.042, 11.551]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'vec-v2-meppadi',
        name: 'Plan V2 LOCAL: Meppadi Local Staging (Bypass)',
        evacuees: 380,
        destination: 'Meppadi Govt. HSS',
        origin: 'Meppadi East Local Sector',
        plan: 'Plan V2 (Resilient)',
        status: 'Local Staged',
        color: '#1d4ed8',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.126, 11.554], [76.128, 11.556]],
      },
    },
  ],
};

export const bridgeBreachIncidentGeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'incident-km42-breach',
        name: 'R104 CULVERT BRIDGE BREACH (KM 4.2)',
        severity: 'CRITICAL',
        status: 'IMPASSABLE - STRUCTURAL FAILURE',
        impact: '150 Evacuees Severed from Primary Transit Path',
      },
      geometry: {
        type: 'Point',
        coordinates: [76.125, 11.530],
      },
    },
  ],
};
