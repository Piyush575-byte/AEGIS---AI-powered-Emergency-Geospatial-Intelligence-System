import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoDataResponse } from '../../services/api';
import {
  extractClusterPoints,
  clusterPointsByScreenDistance,
  groupPointsByDistrict,
  createStateClusterIcon,
  createDistrictClusterIcon,
  createHabitationIcon,
  createShelterIcon,
} from '../../utils/mapClustering';

interface LeafletMapProps {
  geodata: GeoDataResponse | null;
  r1Blocked: boolean;
  recommendationActive: boolean;
  planVersion: number;
  onSelectFeature?: (info: { type: string; title: string; subtitle?: string; details?: string }) => void;
}

export default function LeafletMap({
  geodata,
  r1Blocked,
  recommendationActive,
  planVersion,
  onSelectFeature,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(12);

  // Initialize Leaflet map with calm, quiet cartography
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix default Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      center: [11.545, 76.115],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean, calm, high-readability basemap
    const tileLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }
    );

    tileLayer.addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Track zoom changes dynamically
    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map layers dynamically with zoom-aware spatial clustering
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || !geodata) return;

    layerGroup.clearLayers();

    // 1. Hazard Zones (Polygon) - Soft, non-distracting overlay
    if (geodata.hazard_zones?.features) {
      geodata.hazard_zones.features.forEach((hz) => {
        if (!hz.geometry) return;
        const coords = hz.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
        const polygon = L.polygon(coords, {
          color: '#ef4444',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: '#ef4444',
          fillOpacity: 0.12,
        }).addTo(layerGroup);

        polygon.on('click', () => {
          onSelectFeature?.({
            type: 'hazard',
            title: hz.properties.name,
            subtitle: `Severity: ${hz.properties.severity.toUpperCase()}`,
            details: `24h Rainfall: ${hz.properties.rainfall_24h_mm} mm · Slope Saturation: ${hz.properties.slope_saturation_pct}%`,
          });
        });

        polygon.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: 700; color: #b91c1c; text-transform: uppercase; font-size: 11px;">Active Hazard Zone</div>
            <div style="font-weight: 600; font-size: 13px; margin: 2px 0;">${hz.properties.name}</div>
            <div style="color: #475569;">Severity: <strong>${hz.properties.severity}</strong></div>
            <div style="color: #475569;">Rainfall (24h): <strong>${hz.properties.rainfall_24h_mm} mm</strong></div>
          </div>
        `);
      });
    }

    // 2. Evacuation Routes (LineStrings)
    if (geodata.routes?.features) {
      geodata.routes.features.forEach((route) => {
        if (!route.geometry) return;
        const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
        const isR1 = route.properties.code === 'R1';
        const isR4 = route.properties.code === 'R4';

        const isCurrentlyBlocked = isR1 && (r1Blocked || route.properties.status === 'blocked');
        const isRecommended = isR4 && (recommendationActive || planVersion === 2);

        // At low zoom, hide minor non-canonical routes to prevent visual clutter
        const isCanonical = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12'].includes(route.properties.code);
        if (zoomLevel < 11 && !isCanonical && !isCurrentlyBlocked && !isRecommended) {
          return;
        }

        let color = '#94A3B8';
        let weight = zoomLevel < 11 ? 2 : 3.5;
        let opacity = zoomLevel < 11 ? 0.5 : 0.85;
        let dashArray: string | undefined = undefined;

        if (isCurrentlyBlocked) {
          color = '#B42318';
          weight = zoomLevel < 11 ? 3 : 4.5;
          opacity = 0.95;
          dashArray = '6, 6';
        } else if (isRecommended) {
          color = '#027A48';
          weight = zoomLevel < 11 ? 3.5 : 5;
          opacity = 1.0;
        }

        const polyline = L.polyline(latLngs, {
          color,
          weight,
          opacity,
          dashArray,
        }).addTo(layerGroup);

        polyline.on('click', () => {
          onSelectFeature?.({
            type: 'route',
            title: `Route ${route.properties.code}: ${route.properties.name}`,
            subtitle: isCurrentlyBlocked ? 'BLOCKED — Bridge Severance at KM 4.2' : isRecommended ? 'RECOMMENDED EVACUATION ROUTE' : 'Operational Corridor',
            details: `Distance: ${route.properties.distance_km} km · Capacity: ${route.properties.capacity_pax_hour} pax/hr`,
          });
        });

        polyline.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #172033; padding: 4px;">
            <div style="font-size: 10px; font-weight: 700; color: #526174; text-transform: uppercase;">Transit Corridor</div>
            <div style="font-weight: 700; font-size: 13px; color: #172033;">Route ${route.properties.code} — ${route.properties.name}</div>
            <div style="margin: 4px 0;">
              ${
                isCurrentlyBlocked
                  ? '<span style="color: #B42318; font-weight: 700;">BLOCKED (Bridge Failure at KM 4.2)</span>'
                  : isRecommended
                  ? '<span style="color: #027A48; font-weight: 700;">RECOMMENDED ALTERNATIVE</span>'
                  : '<span style="color: #2563A6; font-weight: 600;">CLEAR</span>'
              }
            </div>
            <div style="color: #526174; font-size: 11px;">Distance: <strong>${route.properties.distance_km} km</strong></div>
          </div>
        `);

        // Incident marker only at KM 4.2 when R1 is blocked
        if (isCurrentlyBlocked && latLngs.length >= 2) {
          const midPoint = latLngs[Math.floor(latLngs.length / 2)];
          const breachIcon = L.divIcon({
            className: 'aegis-incident-marker',
            html: `
              <div style="display: flex; align-items: center; gap: 5px; background: #FEF2F2; padding: 3px 8px; border-radius: 16px; box-shadow: 0 4px 12px rgba(23,32,51,0.14); border: 1.5px solid #FECACA; font-family: Inter, system-ui, sans-serif; cursor: pointer;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; background: #B42318; color: #ffffff; font-size: 9px; font-weight: bold;">✕</span>
                <span style="font-size: 10.5px; font-weight: 700; color: #B42318; white-space: nowrap;">R1 Bridge Cut (KM 4.2)</span>
              </div>
            `,
            iconSize: [160, 24],
            iconAnchor: [80, 12],
          });
          L.marker(midPoint, { icon: breachIcon })
            .addTo(layerGroup)
            .bindPopup(`
              <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px;">
                <div style="font-weight: 700; color: #dc2626; text-transform: uppercase; font-size: 11px;">Critical Incident</div>
                <div style="font-weight: 700; font-size: 13px; margin: 2px 0;">R1 Bridge Failure</div>
                <div style="color: #475569;">Location: KM 4.2 on Chooralmala → Meppadi corridor.</div>
                <div style="color: #dc2626; font-weight: 600; margin-top: 4px;">Status: BLOCKED — Impassable to vehicular traffic</div>
              </div>
            `);
        }
      });
    }

    // 3. ZOOM-AWARE HABITATION & SHELTER VISUALIZATION
    const points = extractClusterPoints(geodata.habitations?.features, geodata.shelters?.features);

    if (zoomLevel < 11) {
      // -------------------------------------------------------------
      // REGIME 1: STATE VIEW (zoom < 11)
      // Show ONLY compact District-level aggregates. Zero label collision!
      // -------------------------------------------------------------
      const districtClusters = groupPointsByDistrict(points);
      districtClusters.forEach((cluster) => {
        const icon = createStateClusterIcon(cluster);
        const marker = L.marker([cluster.lat, cluster.lng], { icon }).addTo(layerGroup);
        marker.on('click', () => {
          map.flyTo([cluster.lat, cluster.lng], 12);
        });
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #172033; padding: 4px;">
            <div style="font-weight: 800; font-size: 13px; color: #172033;">${cluster.district} District</div>
            <div style="color: #526174; margin-top: 2px;">Total Habitations: <strong>${cluster.count}</strong></div>
            <div style="color: #526174;">Total Evacuees: <strong>${cluster.totalPopulation.toLocaleString()}</strong></div>
            <div style="color: #526174;">At-Risk Zones: <strong style="color: #B42318;">${cluster.affectedCount}</strong></div>
            <div style="color: #526174;">Shelters: <strong>${cluster.sheltersCount}</strong> (+${cluster.availableCapacity.toLocaleString()} beds)</div>
            <div style="margin-top: 4px; font-size: 11px; color: #2563A6; font-weight: 600;">Click to zoom into district</div>
          </div>
        `);
      });
    } else if (zoomLevel < 14) {
      // -------------------------------------------------------------
      // REGIME 2: DISTRICT VIEW (11 <= zoom < 14)
      // Screen-distance spatial clusters. Smooth dynamic splitting.
      // -------------------------------------------------------------
      const clusters = clusterPointsByScreenDistance(points, map, zoomLevel, 65);
      clusters.forEach((cluster) => {
        if (cluster.count > 1) {
          const icon = createDistrictClusterIcon(cluster);
          const marker = L.marker([cluster.lat, cluster.lng], { icon }).addTo(layerGroup);
          marker.on('click', () => {
            map.flyTo([cluster.lat, cluster.lng], Math.min(15, zoomLevel + 2));
          });
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; color: #172033; padding: 4px;">
              <div style="font-weight: 700; font-size: 12px; color: #172033;">Spatial Cluster: ${cluster.count} Zones</div>
              <div style="color: #526174; margin-top: 2px;">Exposed Population: <strong>${cluster.totalPopulation.toLocaleString()} pax</strong></div>
              ${cluster.affectedCount > 0 ? `<div style="color: #B42318; font-weight: 600;">⚠️ ${cluster.affectedCount} Critical/At-Risk Zones</div>` : ''}
              ${cluster.sheltersCount > 0 ? `<div style="color: #027A48; font-weight: 600;">🏠 ${cluster.sheltersCount} Shelters (+${cluster.availableCapacity} beds)</div>` : ''}
              <div style="margin-top: 4px; font-size: 11px; color: #2563A6; font-weight: 600;">Click to zoom in</div>
            </div>
          `);
        } else {
          // Single isolated item
          const pt = cluster.points[0];
          if (pt.type === 'habitation') {
            const isPriority = pt.isCanonical || pt.isCritical || pt.code === 'HAB-CHOORALMALA';
            const icon = createHabitationIcon(pt, isPriority);
            const marker = L.marker([pt.lat, pt.lng], { icon }).addTo(layerGroup);
            marker.on('click', () => {
              onSelectFeature?.({
                type: 'habitation',
                title: `Habitation: ${pt.name}`,
                subtitle: `${pt.population} Evacuees`,
                details: pt.isCritical ? 'Critical risk zone. Evacuation relocation active.' : 'Normal monitoring status.',
              });
            });
            marker.bindTooltip(`<b>${pt.name}</b> (${pt.population} people)`);
          } else {
            const isRecommended = pt.code === 'SH-GAMMA' && (recommendationActive || planVersion === 2);
            const isSevered = pt.code === 'SH-ALPHA' && r1Blocked;
            const isAssigned = pt.code === 'SH-ALPHA' && !r1Blocked;
            const icon = createShelterIcon(pt, isRecommended, isSevered, isAssigned);
            const marker = L.marker([pt.lat, pt.lng], { icon }).addTo(layerGroup);
            marker.on('click', () => {
              onSelectFeature?.({
                type: 'shelter',
                title: pt.name,
                subtitle: `Available Capacity: ${pt.shelterAvailable ?? 'N/A'} / Total: ${pt.shelterCapacity ?? 'N/A'}`,
                details: `Medical Support: ${pt.medicalSupport ? 'Available on-site' : 'None'} · Status: ${pt.status || 'Active'}`,
              });
            });
            marker.bindTooltip(`<b>${pt.name}</b><br/>Available: +${pt.shelterAvailable ?? 0} beds`);
          }
        }
      });
    } else {
      // -------------------------------------------------------------
      // REGIME 3: LOCAL / OPERATIONAL VIEW (zoom >= 14)
      // Progressive disclosure of individual objects. Zero permanent pax tags.
      // -------------------------------------------------------------
      points.forEach((pt) => {
        if (pt.type === 'habitation') {
          const isPriority = pt.isCanonical || pt.isCritical || pt.code === 'HAB-CHOORALMALA';
          const icon = createHabitationIcon(pt, isPriority);
          const marker = L.marker([pt.lat, pt.lng], { icon }).addTo(layerGroup);
          marker.on('click', () => {
            onSelectFeature?.({
              type: 'habitation',
              title: `Habitation: ${pt.name}`,
              subtitle: `${pt.population} People`,
              details: pt.isCritical ? 'Critical risk zone. Evacuation reassessment required.' : 'Normal status.',
            });
          });
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; color: #172033; padding: 4px;">
              <div style="font-size: 10px; font-weight: 700; color: #526174; text-transform: uppercase;">Origin Habitation</div>
              <div style="font-weight: 700; font-size: 13px; margin: 2px 0; color: #172033;">${pt.name}</div>
              <div style="color: #526174;">Population: <strong>${pt.population} persons</strong></div>
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #E2E8F0; font-size: 11px;">
                ${pt.isCritical ? '<span style="color: #B42318; font-weight: 600;">Affected by ground disruption.</span>' : '<span style="color: #027A48;">Operational status: Clear</span>'}
              </div>
            </div>
          `);
          marker.bindTooltip(`<b>${pt.name}</b> (${pt.population} people)`);
        } else {
          const isRecommended = pt.code === 'SH-GAMMA' && (recommendationActive || planVersion === 2);
          const isSevered = pt.code === 'SH-ALPHA' && r1Blocked;
          const isAssigned = pt.code === 'SH-ALPHA' && !r1Blocked;
          const icon = createShelterIcon(pt, isRecommended, isSevered, isAssigned);
          const marker = L.marker([pt.lat, pt.lng], { icon }).addTo(layerGroup);
          marker.on('click', () => {
            onSelectFeature?.({
              type: 'shelter',
              title: pt.name,
              subtitle: `Available Capacity: ${pt.shelterAvailable ?? 'N/A'} / Total: ${pt.shelterCapacity ?? 'N/A'}`,
              details: `Medical Support: ${pt.medicalSupport ? 'Available on-site' : 'None'} · Status: ${pt.status || 'Active'}`,
            });
          });
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; color: #172033; padding: 4px;">
              <div style="font-size: 10px; font-weight: 700; color: #718096; text-transform: uppercase;">Shelter Facility</div>
              <div style="font-weight: 700; font-size: 13px; margin: 2px 0; color: #172033;">${pt.name}</div>
              <div style="color: #526174;">Available Capacity: <strong style="color: #027A48;">+${pt.shelterAvailable ?? 0}</strong> / ${pt.shelterCapacity ?? 0}</div>
              <div style="color: #526174;">Medical Support: <strong>${pt.medicalSupport ? '✓ Available' : '✗ None'}</strong></div>
              ${isRecommended ? '<div style="margin-top: 4px; padding: 3px 6px; background: #ECFDF3; border-radius: 4px; color: #027A48; font-weight: 600; font-size: 11px;">✓ Recommended Safe Destination via Route R4</div>' : ''}
              ${isSevered ? '<div style="margin-top: 4px; padding: 3px 6px; background: #FEF2F2; border-radius: 4px; color: #B42318; font-weight: 600; font-size: 11px;">⛔ Inaccessible due to Route R1 severance</div>' : ''}
            </div>
          `);
        }
      });
    }
  }, [geodata, r1Blocked, recommendationActive, planVersion, zoomLevel, onSelectFeature]);

  // Center / reset view helper
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([11.545, 76.115], 12);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[480px] bg-[#F5F7FA] overflow-hidden select-none">
      {/* Real-time Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '480px' }} />

      {/* Floating Map Controls & Dynamic Zoom Level Indicator */}
      <div className="absolute top-16 right-4 z-[900] flex flex-col gap-1.5 shadow-sm">
        {/* Dynamic Zoom Resolution Pill */}
        <div className="glass-pill-light rounded-xl px-2.5 py-1 text-[10.5px] font-medium text-[#526174] shadow-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563A6]"></span>
          <span>
            {zoomLevel < 11
              ? 'State Aggregate View'
              : zoomLevel < 14
              ? 'District Spatial Clusters'
              : 'Local Operational View'}{' '}
            <span className="text-[#718096] font-mono">(z:{zoomLevel})</span>
          </span>
        </div>

        <div className="glass-pill-light rounded-xl overflow-hidden flex flex-col shadow-xs divide-y divide-slate-200/50">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center text-[#172033] hover:bg-black/5 active:bg-black/10 text-base font-semibold transition cursor-pointer"
            title="Zoom In"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center text-[#172033] hover:bg-black/5 active:bg-black/10 text-base font-semibold transition cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
        <button
          onClick={handleResetView}
          className="glass-pill-light rounded-xl px-2.5 py-1 text-[11px] font-semibold text-[#172033] hover:bg-black/5 active:bg-black/10 transition shadow-xs text-center cursor-pointer"
          title="Reset map view"
        >
          Reset View
        </button>
      </div>

      {/* Subtle, Calm Floating Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] glass-surface-light rounded-2xl px-3.5 py-2 text-[11px] text-[#172033] shadow-md pointer-events-none hidden sm:block">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF] border-2 border-[#475569] inline-block"></span>
            <span className="text-[#526174]">Origin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-3.5 h-1 inline-block ${r1Blocked ? 'bg-[#B42318] border-dashed border-t border-[#B42318]' : 'bg-[#2563A6]'}`}></span>
            <span className="text-[#526174]">R1 {r1Blocked ? '(Blocked)' : '(Clear)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-[#027A48] inline-block rounded-xs"></span>
            <span className="text-[#526174]">R4 (Bypass)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#ECFDF3] border border-[#ABEFC6] inline-block"></span>
            <span className="text-[#526174]">Safe Shelter</span>
          </div>
        </div>
      </div>
    </div>
  );
}

