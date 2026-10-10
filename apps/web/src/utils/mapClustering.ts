import L from 'leaflet';
import type { HabitationFeature, ShelterFeature } from '../services/api';

export interface ClusterPoint {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  population: number;
  isCritical: boolean;
  isCanonical: boolean;
  type: 'habitation' | 'shelter';
  shelterCapacity?: number;
  shelterAvailable?: number;
  medicalSupport?: boolean;
  status?: string;
  district?: string;
  rawFeature: any;
}

export interface MapCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  totalPopulation: number;
  affectedCount: number;
  points: ClusterPoint[];
  district?: string;
  sheltersCount: number;
  availableCapacity: number;
}

/**
 * Cluster points based on screen-pixel distance at the given Leaflet zoom level.
 */
export function clusterPointsByScreenDistance(
  points: ClusterPoint[],
  map: L.Map,
  zoom: number,
  pixelRadius: number = 60
): MapCluster[] {
  const clusters: MapCluster[] = [];
  const assigned = new Set<string>();

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    if (assigned.has(p1.id)) continue;

    const clusterPoints: ClusterPoint[] = [p1];
    assigned.add(p1.id);
    const p1Screen = map.project([p1.lat, p1.lng], zoom);

    for (let j = i + 1; j < points.length; j++) {
      const p2 = points[j];
      if (assigned.has(p2.id)) continue;

      const p2Screen = map.project([p2.lat, p2.lng], zoom);
      const dist = p1Screen.distanceTo(p2Screen);

      if (dist <= pixelRadius) {
        clusterPoints.push(p2);
        assigned.add(p2.id);
      }
    }

    // Compute cluster center
    const totalLat = clusterPoints.reduce((acc, p) => acc + p.lat, 0);
    const totalLng = clusterPoints.reduce((acc, p) => acc + p.lng, 0);
    const totalPop = clusterPoints.reduce((acc, p) => acc + p.population, 0);
    const affected = clusterPoints.filter(p => p.isCritical).length;
    const shelters = clusterPoints.filter(p => p.type === 'shelter').length;
    const availCap = clusterPoints.reduce((acc, p) => acc + (p.shelterAvailable || 0), 0);

    clusters.push({
      id: `cluster-${zoom}-${i}`,
      lat: totalLat / clusterPoints.length,
      lng: totalLng / clusterPoints.length,
      count: clusterPoints.length,
      totalPopulation: totalPop,
      affectedCount: affected,
      points: clusterPoints,
      sheltersCount: shelters,
      availableCapacity: availCap,
      district: p1.district || 'Wayanad',
    });
  }

  return clusters;
}

/**
 * Group points by district for State-level view (zoom < 11).
 */
export function groupPointsByDistrict(points: ClusterPoint[]): MapCluster[] {
  const mapDistricts = new Map<string, ClusterPoint[]>();

  for (const p of points) {
    const dist = p.district || (p.lat > 11.4 ? 'Wayanad' : p.lat > 11.2 ? 'Kozhikode' : p.lat > 10.9 ? 'Malappuram' : p.lng > 76.8 ? 'Idukki' : 'Palakkad');
    if (!mapDistricts.has(dist)) {
      mapDistricts.set(dist, []);
    }
    mapDistricts.get(dist)!.push(p);
  }

  const clusters: MapCluster[] = [];
  mapDistricts.forEach((pts, dist) => {
    const totalLat = pts.reduce((acc, p) => acc + p.lat, 0);
    const totalLng = pts.reduce((acc, p) => acc + p.lng, 0);
    const totalPop = pts.reduce((acc, p) => acc + p.population, 0);
    const affected = pts.filter(p => p.isCritical).length;
    const shelters = pts.filter(p => p.type === 'shelter').length;
    const availCap = pts.reduce((acc, p) => acc + (p.shelterAvailable || 0), 0);

    clusters.push({
      id: `district-${dist}`,
      lat: totalLat / pts.length,
      lng: totalLng / pts.length,
      count: pts.length,
      totalPopulation: totalPop,
      affectedCount: affected,
      points: pts,
      district: dist,
      sheltersCount: shelters,
      availableCapacity: availCap,
    });
  });

  return clusters;
}

/**
 * Convert GeoJSON Habitations and Shelters to unified ClusterPoints.
 */
export function extractClusterPoints(
  habitations: HabitationFeature[] = [],
  shelters: ShelterFeature[] = []
): ClusterPoint[] {
  const points: ClusterPoint[] = [];

  for (const h of habitations) {
    if (!h.geometry?.coordinates) continue;
    const [lng, lat] = h.geometry.coordinates;
    points.push({
      id: h.properties.id || h.properties.code,
      code: h.properties.code,
      name: h.properties.name,
      lat,
      lng,
      population: h.properties.population || 0,
      isCritical: h.properties.risk_level === 'critical' || h.properties.risk_level === 'high',
      isCanonical: h.properties.code === 'HAB-CHOORALMALA' || !!(h.properties as any).metadata?.is_canonical,
      type: 'habitation',
      district: (h.properties as any).metadata?.district,
      rawFeature: h,
    });
  }

  for (const s of shelters) {
    if (!s.geometry?.coordinates) continue;
    const [lng, lat] = s.geometry.coordinates;
    points.push({
      id: s.properties.id || s.properties.code,
      code: s.properties.code,
      name: s.properties.name,
      lat,
      lng,
      population: 0,
      isCritical: s.properties.status === 'unavailable' || s.properties.status === 'severed',
      isCanonical: ['SH-ALPHA', 'SH-BETA', 'SH-DELTA', 'SH-GAMMA'].includes(s.properties.code) || !!(s.properties as any).metadata?.is_canonical,
      type: 'shelter',
      shelterCapacity: s.properties.total_capacity,
      shelterAvailable: s.properties.available_capacity,
      medicalSupport: s.properties.medical_support,
      status: s.properties.status,
      district: (s.properties as any).metadata?.district,
      rawFeature: s,
    });
  }

  return points;
}

/**
 * Creates aggregate state-level marker pill with clear typography and tabular numerals.
 */
export function createStateClusterIcon(cluster: MapCluster): L.DivIcon {
  const hasAffected = cluster.affectedCount > 0;
  const badgeBorder = hasAffected ? '#FECACA' : '#CBD5E1';
  const badgeBg = '#FFFFFF';
  const accentDot = hasAffected ? '#DC2626' : '#2563A6';

  const html = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      font-family: Inter, system-ui, sans-serif;
    ">
      <div style="
        background: ${badgeBg};
        border: 1.5px solid ${badgeBorder};
        box-shadow: 0 4px 16px rgba(23,32,51,0.14);
        border-radius: 20px;
        padding: 6px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        transition: transform 0.15s ease;
      ">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${accentDot}; flex-shrink: 0;"></span>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 13px; font-weight: 700; color: #172033; letter-spacing: -0.01em;">
            ${cluster.district || 'District'}
          </span>
          <span style="font-size: 12px; font-weight: 500; color: #475569; font-variant-numeric: tabular-nums;">
            ${cluster.totalPopulation > 0 ? `${cluster.totalPopulation.toLocaleString()} evacuees · ` : ''}${cluster.count} zones${cluster.affectedCount > 0 ? ` · <strong style="color:#B42318; font-weight:700;">${cluster.affectedCount} at-risk</strong>` : ''}
          </span>
        </div>
      </div>
      <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid ${badgeBorder};"></div>
    </div>
  `;

  return L.divIcon({
    className: 'aegis-state-cluster',
    html,
    iconSize: [220, 48],
    iconAnchor: [110, 48],
  });
}

/**
 * Creates District-level cluster circular badge (44x44px target).
 */
export function createDistrictClusterIcon(cluster: MapCluster): L.DivIcon {
  const hasAffected = cluster.affectedCount > 0;
  const isShelterOnly = cluster.points.every(p => p.type === 'shelter');

  const bg = isShelterOnly ? '#059669' : hasAffected ? '#B42318' : '#2563A6';
  const label = isShelterOnly ? '⌂' : `${cluster.count}`;
  const sub = cluster.totalPopulation > 0
    ? cluster.totalPopulation >= 1000
      ? `${(cluster.totalPopulation / 1000).toFixed(1)}k`
      : `${cluster.totalPopulation}`
    : `${cluster.count}`;

  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-family: Inter, system-ui, sans-serif;
    ">
      <div style="
        background: ${bg};
        color: #ffffff;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.22);
        border-radius: 50%;
        width: 44px;
        height: 44px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease;
      ">
        <span style="font-size: 13px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums;">${label}</span>
        <span style="font-size: 11px; opacity: 0.95; font-weight: 600; line-height: 1; margin-top: 2px; font-variant-numeric: tabular-nums;">${sub}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'aegis-district-cluster',
    html,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

/**
 * Minimal Habitation Icon:
 * Operational view (zoom >= 14):
 * - Primary/Canonical (Chooralmala): clean crisp location pill, 12.5px text.
 * - Other habitations: clean, calm dot.
 */
export function createHabitationIcon(hab: ClusterPoint, isPriority: boolean = false): L.DivIcon {
  if (isPriority) {
    const dotColor = hab.isCritical ? '#DC2626' : '#2563A6';
    const border = hab.isCritical ? '#FECACA' : '#CBD5E1';
    const html = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        font-family: Inter, system-ui, sans-serif;
      ">
        <div style="
          background: #FFFFFF;
          color: #172033;
          border: 1.5px solid ${border};
          border-radius: 16px;
          padding: 4px 10px;
          font-size: 12.5px;
          font-weight: 700;
          box-shadow: 0 3px 10px rgba(23,32,51,0.14);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        ">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${dotColor}; flex-shrink: 0;"></span>
          <span>${hab.name}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid ${border};"></div>
      </div>
    `;
    return L.divIcon({
      className: 'aegis-hab-priority',
      html,
      iconSize: [150, 34],
      iconAnchor: [75, 34],
    });
  }

  // Background habitations: small 10px dot with pulse if critical
  const color = hab.isCritical ? '#DC2626' : '#64748B';
  const html = `
    <div style="
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${color};
      border: 1.5px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
      cursor: pointer;
    "></div>
  `;
  return L.divIcon({
    className: 'aegis-hab-dot',
    html,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

/**
 * Shelter Icon:
 * Operational view (zoom >= 14):
 * - Recommended: highlighted green pill with headroom (+headroom) in 12.5px font
 * - Severed / Full: soft red pill in 12.5px font
 * - Assigned: blue pill in 12.5px font
 * - Other: compact clean 24px home symbol
 */
export function createShelterIcon(
  shelter: ClusterPoint,
  isRecommended: boolean,
  isSevered: boolean,
  isAssigned: boolean = false
): L.DivIcon {
  const tagText = shelter.name.replace(/\s*\(.*?\)\s*/g, '');

  if (isRecommended) {
    const html = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        font-family: Inter, system-ui, sans-serif;
      ">
        <div style="
          background: #ECFDF3;
          color: #027A48;
          border: 1.5px solid #ABEFC6;
          border-radius: 16px;
          padding: 4px 10px;
          font-size: 12.5px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          box-shadow: 0 3px 10px rgba(2,122,72,0.16);
          white-space: nowrap;
        ">
          ✓ ${tagText} (+${shelter.shelterAvailable || 205})
        </div>
        <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid #ABEFC6;"></div>
      </div>
    `;
    return L.divIcon({
      className: 'aegis-shelter-rec',
      html,
      iconSize: [170, 32],
      iconAnchor: [85, 32],
    });
  }

  if (isSevered) {
    const html = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        font-family: Inter, system-ui, sans-serif;
      ">
        <div style="
          background: #FEF2F2;
          color: #B42318;
          border: 1.5px solid #FECACA;
          border-radius: 16px;
          padding: 4px 10px;
          font-size: 12.5px;
          font-weight: 700;
          box-shadow: 0 3px 10px rgba(180,35,24,0.12);
          white-space: nowrap;
        ">
          ⛔ ${tagText} (Severed)
        </div>
        <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid #FECACA;"></div>
      </div>
    `;
    return L.divIcon({
      className: 'aegis-shelter-sev',
      html,
      iconSize: [170, 32],
      iconAnchor: [85, 32],
    });
  }

  if (isAssigned) {
    const html = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        font-family: Inter, system-ui, sans-serif;
      ">
        <div style="
          background: #EFF6FF;
          color: #174A7C;
          border: 1.5px solid #BFDBFE;
          border-radius: 16px;
          padding: 4px 10px;
          font-size: 12.5px;
          font-weight: 700;
          box-shadow: 0 3px 10px rgba(23,74,124,0.12);
          white-space: nowrap;
        ">
          ⌂ ${tagText} (Assigned)
        </div>
        <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid #BFDBFE;"></div>
      </div>
    `;
    return L.divIcon({
      className: 'aegis-shelter-assigned',
      html,
      iconSize: [170, 32],
      iconAnchor: [85, 32],
    });
  }

  // Other shelters: clean 24px compact home badge
  const html = `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: #059669;
      color: #FFFFFF;
      border: 1.5px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 900;
      cursor: pointer;
    ">
      ⌂
    </div>
  `;
  return L.divIcon({
    className: 'aegis-shelter-clean',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}
