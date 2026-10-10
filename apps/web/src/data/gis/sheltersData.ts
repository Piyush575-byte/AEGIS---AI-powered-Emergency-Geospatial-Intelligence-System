import type { FeatureCollection } from 'geojson';
import { ENTITY_IDS } from '../simulationData';

export const sheltersGeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.SHELTERS.MEPPADI_HSS,
        name: 'Meppadi Govt. HSS',
        type: 'Government Higher Secondary School',
        capacity: 800,
        occupancy: 45,
        remainingCapacity: 755,
        status: 'OPERATIONAL (Route R104 Dependent)',
        routeViability: 'Route R104 dependency (Severed in S6)',
        medicalAvailability: 'Primary Health Desk On-site · 2 Ambulances',
        facilities: 'Generator Backup · Clean Water Storage (10,000L) · Kitchen Facility',
      },
      geometry: { type: 'Point', coordinates: [76.128, 11.556] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.SHELTERS.KALPETTA_HALL,
        name: 'Kalpetta Community Hall',
        type: 'Municipal Community Centre',
        capacity: 650,
        occupancy: 22,
        remainingCapacity: 628,
        status: 'OPERATIONAL (Primary Resilient Hub)',
        routeViability: 'Route R212 (Clear ✓ Arterial Access)',
        medicalAvailability: 'District General Hospital Linkage (1.5 km)',
        facilities: 'High-Capacity Kitchen · Sanitation Units · Child Care Zone',
      },
      geometry: { type: 'Point', coordinates: [76.083, 11.608] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.SHELTERS.ST_MARYS,
        name: "St. Mary's School Vythiri",
        type: 'Aided High School Facility',
        capacity: 500,
        occupancy: 0,
        remainingCapacity: 500,
        status: 'STANDBY / ACTIVATED (Secondary Hub)',
        routeViability: 'Route R318 (Clear ✓ Bypass Access)',
        medicalAvailability: 'Standby Medical Officer Assigned · Nurse Station',
        facilities: 'Dormitory Layout · Dedicated Solar Power · Helipad Proximity',
      },
      geometry: { type: 'Point', coordinates: [76.042, 11.551] },
    },
  ],
};
