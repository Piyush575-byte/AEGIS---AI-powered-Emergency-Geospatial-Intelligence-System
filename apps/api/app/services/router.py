import heapq
import math
from typing import Dict, List, Tuple, Optional, Any
from sqlalchemy.orm import Session
from app.models import Route, Habitation, Shelter

# Geodesic Haversine distance heuristic in km
def haversine_km(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    r = 6371.0 # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c

class GraphEdge:
    def __init__(self, from_node: str, to_node: str, route_code: str, distance_km: float, status: str, capacity_pax_hour: int):
        self.from_node = from_node
        self.to_node = to_node
        self.route_code = route_code
        self.distance_km = distance_km
        self.status = status
        self.capacity_pax_hour = capacity_pax_hour

    def cost(self) -> float:
        if self.status == "blocked":
            return float("inf")
        if self.status == "degraded":
            # Heavy penalty multiplier for degraded/unpaved/slide-prone corridors
            return self.distance_km * 4.0
        # Standard clear route cost
        return self.distance_km

class RoutePathResult:
    def __init__(
        self,
        origin_code: str,
        destination_code: str,
        is_reachable: bool,
        total_distance_km: float,
        path_nodes: List[str],
        traversed_route_codes: List[str],
        primary_route_code: Optional[str],
        explanation: str
    ):
        self.origin_code = origin_code
        self.destination_code = destination_code
        self.is_reachable = is_reachable
        self.total_distance_km = total_distance_km
        self.path_nodes = path_nodes
        self.traversed_route_codes = traversed_route_codes
        self.primary_route_code = primary_route_code
        self.explanation = explanation

    def to_dict(self) -> Dict[str, Any]:
        return {
            "origin_code": self.origin_code,
            "destination_code": self.destination_code,
            "is_reachable": self.is_reachable,
            "total_distance_km": round(self.total_distance_km, 2),
            "path_nodes": self.path_nodes,
            "traversed_route_codes": self.traversed_route_codes,
            "primary_route_code": self.primary_route_code,
            "explanation": self.explanation
        }

class WayanadAStarRouter:
    """
    Deterministic A* router running over the local Wayanad transportation network.
    Does NOT require any external network API.
    """
    def __init__(self, db: Session):
        self.db = db
        self._load_network()

    def _load_network(self):
        # Query active Wayanad route corridor statuses
        routes_in_db = {r.code: r for r in self.db.query(Route).filter(Route.code.in_(["R1", "R2", "R3", "R4"])).all()}

        # Network Nodes with coordinates (lon, lat)
        self.nodes = {
            "N_CHOORALMALA": (76.1752, 11.5398),
            "N_MEPPADI_JN": (76.1480, 11.5490),
            "N_SH_ALPHA": (76.1305, 11.5535),      # Meppadi Community Hall
            "N_SH_BETA": (76.1550, 11.5450),       # Vellarmala School
            "N_SH_DELTA": (76.1400, 11.5280),      # Attamala Community Centre
            "N_VYTHIRI_BYPASS": (76.0800, 11.5550),
            "N_SH_GAMMA": (76.0420, 11.5510),      # Vythiri GHSS
        }

        # Node mapping for Habitations & Shelters
        self.hab_node_map = {
            "HAB-CHOORALMALA": "N_CHOORALMALA"
        }
        self.shelter_node_map = {
            "SH-ALPHA": "N_SH_ALPHA",
            "SH-BETA": "N_SH_BETA",
            "SH-DELTA": "N_SH_DELTA",
            "SH-GAMMA": "N_SH_GAMMA",
        }

        # Build adjacency graph from routes
        self.adj: Dict[str, List[GraphEdge]] = {k: [] for k in self.nodes}

        def add_bidirectional_edge(u: str, v: str, code: str, fallback_dist: float):
            r = routes_in_db.get(code)
            dist = r.distance_km if r else fallback_dist
            status = r.status if r else "clear"
            cap = r.capacity_pax_hour if r else 200

            edge_fwd = GraphEdge(u, v, code, dist, status, cap)
            edge_rev = GraphEdge(v, u, code, dist, status, cap)
            self.adj[u].append(edge_fwd)
            self.adj[v].append(edge_rev)

        # Route R1: Chooralmala -> Meppadi Jn -> Shelter Alpha (Bridge at KM 4.2)
        add_bidirectional_edge("N_CHOORALMALA", "N_SH_ALPHA", "R1", 6.8)
        
        # Route R2: Chooralmala -> Shelter Beta
        add_bidirectional_edge("N_CHOORALMALA", "N_SH_BETA", "R2", 3.2)
        
        # Route R3: Chooralmala -> Shelter Delta (Degraded track)
        add_bidirectional_edge("N_CHOORALMALA", "N_SH_DELTA", "R3", 7.5)
        
        # Route R4: Chooralmala -> Vythiri Bypass -> Shelter Gamma (High capacity arterial)
        add_bidirectional_edge("N_CHOORALMALA", "N_SH_GAMMA", "R4", 16.4)

    def find_shortest_path(self, origin_hab_code: str, dest_shelter_code: str) -> RoutePathResult:
        start_node = self.hab_node_map.get(origin_hab_code)
        target_node = self.shelter_node_map.get(dest_shelter_code)

        if not start_node or not target_node:
            return RoutePathResult(
                origin_code=origin_hab_code,
                destination_code=dest_shelter_code,
                is_reachable=False,
                total_distance_km=0.0,
                path_nodes=[],
                traversed_route_codes=[],
                primary_route_code=None,
                explanation="Origin or destination node not registered in geospatial network."
            )

        target_lon, target_lat = self.nodes[target_node]

        # Priority queue stores tuples: (f_score, counter, current_node, g_score, path_nodes, traversed_routes)
        counter = 0
        open_set = []
        h_start = haversine_km(self.nodes[start_node][0], self.nodes[start_node][1], target_lon, target_lat)
        heapq.heappush(open_set, (h_start, counter, start_node, 0.0, [start_node], []))
        
        g_scores = {node: float("inf") for node in self.nodes}
        g_scores[start_node] = 0.0

        best_result = None

        while open_set:
            f, _, current, g, path, routes_used = heapq.heappop(open_set)

            if current == target_node:
                primary_route = routes_used[0] if routes_used else None
                return RoutePathResult(
                    origin_code=origin_hab_code,
                    destination_code=dest_shelter_code,
                    is_reachable=True,
                    total_distance_km=g,
                    path_nodes=path,
                    traversed_route_codes=routes_used,
                    primary_route_code=primary_route,
                    explanation=f"Optimal viable corridor found via {primary_route} ({round(g, 2)} km)."
                )

            if g > g_scores[current]:
                continue

            for edge in self.adj[current]:
                edge_cost = edge.cost()
                if math.isinf(edge_cost):
                    continue # Blocked route

                tentative_g = g + edge_cost
                if tentative_g < g_scores[edge.to_node]:
                    g_scores[edge.to_node] = tentative_g
                    h = haversine_km(self.nodes[edge.to_node][0], self.nodes[edge.to_node][1], target_lon, target_lat)
                    counter += 1
                    heapq.heappush(
                        open_set,
                        (tentative_g + h, counter, edge.to_node, tentative_g, path + [edge.to_node], routes_used + [edge.route_code])
                    )

        return RoutePathResult(
            origin_code=origin_hab_code,
            destination_code=dest_shelter_code,
            is_reachable=False,
            total_distance_km=0.0,
            path_nodes=[],
            traversed_route_codes=[],
            primary_route_code=None,
            explanation=f"Destination {dest_shelter_code} unreachable due to route blockage on active corridors."
        )
