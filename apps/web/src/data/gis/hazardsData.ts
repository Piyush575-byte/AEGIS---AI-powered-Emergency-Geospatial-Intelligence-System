import type { FeatureCollection } from 'geojson';

export const hazardZonesGeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'hz-mundakkai',
        name: 'Mundakkai Landslide Susceptibility Zone',
        risk: 'CRITICAL',
        severity: 'critical',
        drivers: 'Steep hill slope saturation (94.2%) · 24h Rainfall accumulation >204mm · Debris flow corridor',
        source: 'GSI Hazard Atlas / IMD Doppler Telemetry',
        status: 'CRITICAL RED ALERT',
        description: 'Active mass wasting zone along the western slope of the Western Ghats ridge.',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.120, 11.545], [76.155, 11.550], [76.160, 11.520],
          [76.140, 11.510], [76.115, 11.520], [76.120, 11.545],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'hz-chooralmala',
        name: 'Chooralmala High Slope Zone',
        risk: 'HIGH',
        severity: 'high',
        drivers: 'Slope instability · Proximity to hill stream · Soil moisture threshold breach',
        source: 'KSDMA Spatial Registry / IMD',
        status: 'HIGH RISK ZONE',
        description: 'Vulnerable river bank and slope confluence with high risk of flooding and flash debris.',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.095, 11.535], [76.120, 11.545], [76.125, 11.515],
          [76.090, 11.510], [76.095, 11.535],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'hz-meppadi',
        name: 'Meppadi Lowland Flood Buffer',
        risk: 'MODERATE',
        severity: 'moderate',
        drivers: 'River level at warning threshold · Surface runoff accumulation basin',
        source: 'CWC Hydrological Model',
        status: 'MODERATE RISK ZONE',
        description: 'Low-lying drainage basin prone to waterlogging and localized flash floods.',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.115, 11.565], [76.145, 11.570], [76.150, 11.545],
          [76.120, 11.545], [76.115, 11.565],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'hz-attamala',
        name: 'Attamala Fringe Debris Buffer',
        risk: 'LOW',
        severity: 'low',
        drivers: 'Peripheral catchment monitoring · Controlled water runoff flow',
        source: 'Forest & Wildlife Geospatial Unit',
        status: 'LOW RISK ADVISORY',
        description: 'Peripheral buffer zone with moderate slope stabilization.',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.140, 11.515], [76.165, 11.515], [76.160, 11.498],
          [76.135, 11.500], [76.140, 11.515],
        ]],
      },
    },
  ],
};
