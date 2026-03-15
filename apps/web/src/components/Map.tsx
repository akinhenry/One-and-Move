"use client";

import { BUS_STOPS } from "@One-and-Move/db/data/bus-stops";
import { TAXI_STANDS } from "@One-and-Move/db/data/taxi-stands";
import { Bus, Car, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	createSimulatedUser,
	createSimulatedVehicles,
	DEFAULT_CONFIG,
	resolveRoadPaths,
	type SimulatedUser,
	type SimulatedVehicle,
	type SimulationConfig,
	tickUser,
	tickVehicles,
} from "@/lib/simulation";

/* ── Types ─────────────────────────────────────── */

interface LatLng {
	lat: number;
	lng: number;
}

interface WebMapProps {
	darkMode?: boolean;
	flyTo?: LatLng | null;
	fromMarker?: LatLng | null;
	routePoints?: LatLng[];
	toMarker?: LatLng | null;
}

interface Vehicle {
	avgCost: string;
	capacity: number;
	heading?: number;
	id: string;
	lat: number;
	lng: number;
	name: string;
	route?: string;
	type: "jutc" | "robot_taxi";
}

/* ── Constants ──────────────────────────────────── */

const DEFAULT_CENTER = { lat: 18.0179, lng: -76.8099 };
const DEFAULT_ZOOM = 13;

/**
 * Carto Voyager — iOS-style soft basemap.
 * Single subdomain (no {s}) avoids SSR hostname-resolution issues.
 * @2x suffix requests retina/HiDPI tiles.
 */
const LIGHT_TILE_URL =
	"https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png";
const DARK_TILE_URL =
	"https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png";

/* ── Vehicle popup ──────────────────────────────── */

function VehiclePopup({
	vehicle,
	onClose,
}: {
	vehicle: Vehicle;
	onClose: () => void;
}) {
	const isBus = vehicle.type === "jutc";
	const iconBg = isBus ? "#10b981" : "#8b5cf6";
	const IconComponent = isBus ? Bus : Car;

	return (
		<div
			className="pointer-events-auto min-w-48 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
			style={{
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
			}}
		>
			<div className="p-3">
				<div className="mb-2.5 flex items-center gap-2.5">
					<div
						className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm"
						style={{ backgroundColor: iconBg }}
					>
						<IconComponent color="white" size={17} />
					</div>
					<div className="flex-1">
						<p className="font-semibold text-sm leading-tight text-gray-900 dark:text-neutral-100">
							{vehicle.name}
						</p>
						<p className="text-gray-500 text-xs dark:text-neutral-400">
							{isBus ? "Public Bus" : "Robot Taxi"}
						</p>
					</div>
					<button
						aria-label="Close popup"
						className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
						onClick={onClose}
						type="button"
					>
						✕
					</button>
				</div>
				<div className="space-y-1.5 border-gray-100 border-t pt-2 dark:border-neutral-700">
					<div className="flex justify-between text-xs">
						<span className="text-gray-500 dark:text-neutral-400">
							Est. Capacity
						</span>
						<span className="font-medium text-gray-800 dark:text-neutral-200">
							{vehicle.capacity} passengers
						</span>
					</div>
					<div className="flex justify-between text-xs">
						<span className="text-gray-500 dark:text-neutral-400">
							Avg. Cost
						</span>
						<span className="font-medium text-gray-800 dark:text-neutral-200">
							{vehicle.avgCost}
						</span>
					</div>
					{vehicle.route && (
						<div className="mt-1 border-gray-100 border-t pt-1.5 text-gray-500 text-xs dark:border-neutral-700 dark:text-neutral-400">
							<Navigation className="mr-1 inline" size={10} />
							{vehicle.route}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

/* ── Inner map (runs only in the browser) ───────── */

function MapLibreInner({
	fromMarker,
	toMarker,
	routePoints,
	vehicles,
	flyTo,
	darkMode = false,
	simUser,
}: {
	darkMode?: boolean;
	flyTo?: LatLng | null;
	fromMarker?: LatLng | null;
	toMarker?: LatLng | null;
	routePoints?: LatLng[];
	simUser?: SimulatedUser | null;
	vehicles: Vehicle[];
}) {
	// react-map-gl v8 exports MapLibre-flavoured components from this sub-path
	const { Map, Source, Layer, Marker, NavigationControl } =
		// biome-ignore lint/suspicious/noExplicitAny: dynamic require at runtime only
		require("react-map-gl/maplibre") as typeof import("react-map-gl/maplibre");

	const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
	const [selectedStop, setSelectedStop] = useState<{
		name: string;
		type: "bus" | "taxi";
		lat: number;
		lng: number;
		details?: string;
	} | null>(null);
	// biome-ignore lint/suspicious/noExplicitAny: MapLibre map instance
	const mapRef = useRef<any>(null);

	// Fly to a coordinate whenever flyTo changes
	useEffect(() => {
		if (!flyTo || !mapRef.current) return;
		mapRef.current.flyTo({
			center: [flyTo.lng, flyTo.lat],
			zoom: 15,
			duration: 1200,
		});
	}, [flyTo]);

	// Build GeoJSON for bus stops (with clustering)
	const busStopsGeoJson = useMemo(
		() => ({
			type: "FeatureCollection" as const,
			features: BUS_STOPS.map((stop) => ({
				type: "Feature" as const,
				geometry: {
					type: "Point" as const,
					coordinates: [stop.lng, stop.lat],
				},
				properties: {
					name: stop.name,
					address: stop.address,
					routes: stop.routeIds.join(", "),
					stopType: "bus",
				},
			})),
		}),
		[]
	);

	// Build GeoJSON for taxi stands (with clustering)
	const taxiStandsGeoJson = useMemo(
		() => ({
			type: "FeatureCollection" as const,
			features: TAXI_STANDS.map((stand) => ({
				type: "Feature" as const,
				geometry: {
					type: "Point" as const,
					coordinates: [stand.lng, stand.lat],
				},
				properties: {
					name: stand.name,
					stopType: "taxi",
				},
			})),
		}),
		[]
	);

	// Handle map click: expand clusters or select individual stops
	const handleMapClick = useCallback(
		// biome-ignore lint/suspicious/noExplicitAny: MapLibre event
		(e: any) => {
			setSelectedVehicle(null);
			setSelectedStop(null);

			const map = mapRef.current;
			if (!map) return;

			// Check for cluster clicks first
			const clusterLayers = ["bus-stops-clusters", "taxi-stands-clusters"];
			const features = map.queryRenderedFeatures(e.point, {
				layers: clusterLayers,
			});

			if (features.length > 0) {
				const feature = features[0];
				const sourceId = feature.layer.source;
				const clusterId = feature.properties.cluster_id;
				const source = map.getSource(sourceId);
				if (source) {
					source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
						map.easeTo({
							center: feature.geometry.coordinates,
							zoom: Math.min(zoom, 17),
							duration: 500,
						});
					});
				}
				return;
			}

			// Check for individual stop clicks
			const pointLayers = ["bus-stops-point", "taxi-stands-point"];
			const pointFeatures = map.queryRenderedFeatures(e.point, {
				layers: pointLayers,
			});

			if (pointFeatures.length > 0) {
				const f = pointFeatures[0];
				const [lng, lat] = f.geometry.coordinates;
				setSelectedStop({
					name: f.properties.name,
					type: f.properties.stopType === "bus" ? "bus" : "taxi",
					lat,
					lng,
					details:
						f.properties.stopType === "bus"
							? `Routes: ${f.properties.routes}`
							: undefined,
				});
			}
		},
		[]
	);

	// Build GeoJSON for the route polyline
	const routeGeoJson = useMemo(() => {
		let coords: [number, number][] = [];
		if (routePoints && routePoints.length >= 2) {
			coords = routePoints.map((p) => [p.lng, p.lat]);
		} else if (fromMarker && toMarker) {
			coords = [
				[fromMarker.lng, fromMarker.lat],
				[toMarker.lng, toMarker.lat],
			];
		}

		const features =
			coords.length >= 2
				? [
						{
							type: "Feature" as const,
							properties: {},
							geometry: {
								type: "LineString" as const,
								coordinates: coords,
							},
						},
					]
				: [];

		return {
			type: "FeatureCollection" as const,
			features,
		};
	}, [fromMarker, toMarker, routePoints]);

	const handleVehicleClick = useCallback(
		(vehicle: Vehicle, e: React.MouseEvent) => {
			e.stopPropagation();
			setSelectedVehicle((prev) => (prev?.id === vehicle.id ? null : vehicle));
		},
		[]
	);

	const tileUrl = darkMode ? DARK_TILE_URL : LIGHT_TILE_URL;

	return (
		<Map
			initialViewState={{
				longitude: DEFAULT_CENTER.lng,
				latitude: DEFAULT_CENTER.lat,
				zoom: DEFAULT_ZOOM,
			}}
			interactiveLayerIds={[
				"bus-stops-clusters",
				"bus-stops-point",
				"taxi-stands-clusters",
				"taxi-stands-point",
			]}
			mapLib={import("maplibre-gl")}
			mapStyle={{
				version: 8,
				glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
				sources: {
					"carto-tiles": {
						type: "raster",
						tiles: [tileUrl],
						tileSize: 256,
						attribution:
							"© <a href='https://www.openstreetmap.org/copyright'>OSM</a> © <a href='https://carto.com/'>CARTO</a>",
					},
				},
				layers: [
					{
						id: "carto-tiles-layer",
						type: "raster",
						source: "carto-tiles",
						minzoom: 0,
						maxzoom: 22,
					},
				],
			}}
			onClick={handleMapClick}
			onMouseEnter={() => {
				const canvas = mapRef.current?.getCanvas();
				if (canvas) canvas.style.cursor = "pointer";
			}}
			onMouseLeave={() => {
				const canvas = mapRef.current?.getCanvas();
				if (canvas) canvas.style.cursor = "";
			}}
			ref={mapRef}
			style={{ width: "100%", height: "100%" }}
		>
			<NavigationControl position="bottom-right" />

			{/* Route polyline */}
			<Source data={routeGeoJson} id="route" type="geojson">
				<Layer
					id="route-casing"
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{
						"line-color": darkMode ? "#171717" : "#ffffff",
						"line-width": 7,
						"line-opacity": 0.5,
					}}
					type="line"
				/>
				<Layer
					id="route-line"
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{
						"line-color": "#8b5cf6",
						"line-width": 4,
						"line-opacity": 0.9,
					}}
					type="line"
				/>
			</Source>

			{/* ── Bus stops (clustered) ── */}
			<Source
				cluster
				clusterMaxZoom={14}
				clusterRadius={50}
				data={busStopsGeoJson}
				id="bus-stops"
				type="geojson"
			>
				{/* Cluster circles */}
				<Layer
					filter={["has", "point_count"]}
					id="bus-stops-clusters"
					paint={{
						"circle-color": [
							"step",
							["get", "point_count"],
							"#a7f3d0",
							5,
							"#6ee7b7",
							15,
							"#10b981",
						],
						"circle-radius": [
							"step",
							["get", "point_count"],
							18,
							5,
							22,
							15,
							28,
						],
						"circle-stroke-color": darkMode ? "#1f2937" : "#ffffff",
						"circle-stroke-width": 2,
					}}
					type="circle"
				/>
				{/* Cluster count label */}
				<Layer
					filter={["has", "point_count"]}
					id="bus-stops-cluster-count"
					layout={{
						"text-field": "{point_count_abbreviated}",
						"text-size": 12,
						"text-font": ["Open Sans Bold"],
					}}
					paint={{
						"text-color": "#064e3b",
					}}
					type="symbol"
				/>
				{/* Individual bus stop dots */}
				<Layer
					filter={["!", ["has", "point_count"]]}
					id="bus-stops-point"
					paint={{
						"circle-color": "#10b981",
						"circle-radius": 7,
						"circle-stroke-color": darkMode ? "#1f2937" : "#ffffff",
						"circle-stroke-width": 2,
					}}
					type="circle"
				/>
				{/* Bus stop label (visible at zoom >= 14) */}
				<Layer
					filter={["!", ["has", "point_count"]]}
					id="bus-stops-label"
					layout={{
						"text-field": ["get", "name"],
						"text-size": 11,
						"text-offset": [0, 1.4],
						"text-anchor": "top",
						"text-max-width": 10,
						"text-font": ["Open Sans Regular"],
					}}
					minzoom={14}
					paint={{
						"text-color": darkMode ? "#a7f3d0" : "#065f46",
						"text-halo-color": darkMode ? "#111827" : "#ffffff",
						"text-halo-width": 1.5,
					}}
					type="symbol"
				/>
			</Source>

			{/* ── Taxi stands (clustered) ── */}
			<Source
				cluster
				clusterMaxZoom={14}
				clusterRadius={50}
				data={taxiStandsGeoJson}
				id="taxi-stands"
				type="geojson"
			>
				{/* Cluster circles */}
				<Layer
					filter={["has", "point_count"]}
					id="taxi-stands-clusters"
					paint={{
						"circle-color": [
							"step",
							["get", "point_count"],
							"#fde68a",
							5,
							"#fbbf24",
							15,
							"#d97706",
						],
						"circle-radius": [
							"step",
							["get", "point_count"],
							18,
							5,
							22,
							15,
							28,
						],
						"circle-stroke-color": darkMode ? "#1f2937" : "#ffffff",
						"circle-stroke-width": 2,
					}}
					type="circle"
				/>
				{/* Cluster count label */}
				<Layer
					filter={["has", "point_count"]}
					id="taxi-stands-cluster-count"
					layout={{
						"text-field": "{point_count_abbreviated}",
						"text-size": 12,
						"text-font": ["Open Sans Bold"],
					}}
					paint={{
						"text-color": "#78350f",
					}}
					type="symbol"
				/>
				{/* Individual taxi stand dots */}
				<Layer
					filter={["!", ["has", "point_count"]]}
					id="taxi-stands-point"
					paint={{
						"circle-color": "#d97706",
						"circle-radius": 7,
						"circle-stroke-color": darkMode ? "#1f2937" : "#ffffff",
						"circle-stroke-width": 2,
					}}
					type="circle"
				/>
				{/* Taxi stand label (visible at zoom >= 14) */}
				<Layer
					filter={["!", ["has", "point_count"]]}
					id="taxi-stands-label"
					layout={{
						"text-field": ["get", "name"],
						"text-size": 11,
						"text-offset": [0, 1.4],
						"text-anchor": "top",
						"text-max-width": 10,
						"text-font": ["Open Sans Regular"],
					}}
					minzoom={14}
					paint={{
						"text-color": darkMode ? "#fde68a" : "#92400e",
						"text-halo-color": darkMode ? "#111827" : "#ffffff",
						"text-halo-width": 1.5,
					}}
					type="symbol"
				/>
			</Source>

			{/* Vehicle markers */}
			{vehicles.map((vehicle) => {
				const isBus = vehicle.type === "jutc";
				const accentColor = isBus ? "#10b981" : "#8b5cf6";
				const rotation = vehicle.heading ?? 0;
				return (
					<Marker
						anchor="center"
						key={vehicle.id}
						latitude={vehicle.lat}
						longitude={vehicle.lng}
					>
						<button
							aria-label={vehicle.name}
							className="group cursor-pointer border-none bg-transparent p-0 outline-none"
							onClick={(e) => handleVehicleClick(vehicle, e)}
							type="button"
						>
							<div
								className="drop-shadow-lg transition-transform duration-150 group-hover:scale-110"
								style={{ transform: `rotate(${rotation}deg)` }}
							>
								{isBus ? (
									/* Bus silhouette icon */
									<svg
										height="44"
										viewBox="0 0 44 44"
										width="44"
										xmlns="http://www.w3.org/2000/svg"
									>
										<title>{vehicle.name}</title>
										{/* Direction cone */}
										<polygon
											fill={accentColor}
											opacity="0.4"
											points="22,0 16,12 28,12"
										/>
										{/* Body */}
										<rect
											fill="#1f2937"
											height="24"
											rx="5"
											width="20"
											x="12"
											y="12"
										/>
										{/* Windshield */}
										<rect
											fill={accentColor}
											height="6"
											rx="2"
											width="14"
											x="15"
											y="14"
										/>
										{/* Side windows */}
										<rect
											fill="#9ca3af"
											height="3"
											rx="1"
											width="4"
											x="14"
											y="23"
										/>
										<rect
											fill="#9ca3af"
											height="3"
											rx="1"
											width="4"
											x="20"
											y="23"
										/>
										<rect
											fill="#9ca3af"
											height="3"
											rx="1"
											width="4"
											x="26"
											y="23"
										/>
										{/* Wheels */}
										<circle cx="15" cy="35" fill="#374151" r="2.5" />
										<circle cx="29" cy="35" fill="#374151" r="2.5" />
									</svg>
								) : (
									/* Taxi/car silhouette icon */
									<svg
										height="44"
										viewBox="0 0 44 44"
										width="44"
										xmlns="http://www.w3.org/2000/svg"
									>
										<title>{vehicle.name}</title>
										{/* Direction cone */}
										<polygon
											fill={accentColor}
											opacity="0.4"
											points="22,2 17,12 27,12"
										/>
										{/* Body */}
										<rect
											fill="#1f2937"
											height="22"
											rx="6"
											width="18"
											x="13"
											y="12"
										/>
										{/* Roof / top accent */}
										<rect
											fill={accentColor}
											height="4"
											rx="2"
											width="10"
											x="17"
											y="14"
										/>
										{/* Windows */}
										<rect
											fill="#9ca3af"
											height="4"
											rx="1.5"
											width="5"
											x="14.5"
											y="21"
										/>
										<rect
											fill="#9ca3af"
											height="4"
											rx="1.5"
											width="5"
											x="24.5"
											y="21"
										/>
										{/* Wheels */}
										<circle cx="16" cy="33" fill="#374151" r="2" />
										<circle cx="28" cy="33" fill="#374151" r="2" />
									</svg>
								)}
							</div>
						</button>
					</Marker>
				);
			})}

			{/* From marker (green pin) */}
			{fromMarker && (
				<Marker
					anchor="bottom"
					latitude={fromMarker.lat}
					longitude={fromMarker.lng}
				>
					<svg
						className="drop-shadow-md"
						height="42"
						viewBox="0 0 32 42"
						width="32"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Start</title>
						<path
							d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z"
							fill="#22c55e"
							stroke="white"
							strokeWidth="2"
						/>
						<circle cx="16" cy="16" fill="white" r="6" />
					</svg>
				</Marker>
			)}

			{/* To marker (red pin) */}
			{toMarker && (
				<Marker
					anchor="bottom"
					latitude={toMarker.lat}
					longitude={toMarker.lng}
				>
					<svg
						className="drop-shadow-md"
						height="42"
						viewBox="0 0 32 42"
						width="32"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Destination</title>
						<path
							d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z"
							fill="#ef4444"
							stroke="white"
							strokeWidth="2"
						/>
						<circle cx="16" cy="16" fill="white" r="6" />
					</svg>
				</Marker>
			)}

			{/* Stop / stand info popup */}
			{selectedStop && (
				<Marker
					anchor="bottom"
					latitude={selectedStop.lat}
					longitude={selectedStop.lng}
					offset={[0, -12]}
				>
					<div className="pointer-events-auto min-w-44 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
						<div className="p-3">
							<div className="mb-1.5 flex items-center gap-2">
								<div
									className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
									style={{
										backgroundColor:
											selectedStop.type === "bus" ? "#10b981" : "#d97706",
									}}
								>
									{selectedStop.type === "bus" ? (
										<Bus color="white" size={14} />
									) : (
										<Car color="white" size={14} />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-sm leading-tight text-gray-900 dark:text-neutral-100">
										{selectedStop.name}
									</p>
									<p className="text-xs text-gray-500 dark:text-neutral-400">
										{selectedStop.type === "bus" ? "Bus Stop" : "Taxi Stand"}
									</p>
								</div>
								<button
									aria-label="Close popup"
									className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
									onClick={() => setSelectedStop(null)}
									type="button"
								>
									✕
								</button>
							</div>
							{selectedStop.details && (
								<p className="border-t border-gray-100 pt-1.5 text-xs text-gray-500 dark:border-neutral-700 dark:text-neutral-400">
									{selectedStop.details}
								</p>
							)}
						</div>
					</div>
				</Marker>
			)}

			{/* Simulated user location dot */}
			{simUser?.enabled && (
				<Marker anchor="center" latitude={simUser.lat} longitude={simUser.lng}>
					<div className="relative flex items-center justify-center">
						{/* Soft halo */}
						<div className="absolute h-8 w-8 rounded-full bg-blue-400/25" />
						{/* Blue dot */}
						<div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-md" />
					</div>
				</Marker>
			)}

			{/* Vehicle info popup */}
			{selectedVehicle && (
				<Marker
					anchor="bottom"
					latitude={selectedVehicle.lat}
					longitude={selectedVehicle.lng}
					offset={[0, -50]}
				>
					<VehiclePopup
						onClose={() => setSelectedVehicle(null)}
						vehicle={selectedVehicle}
					/>
				</Marker>
			)}
		</Map>
	);
}

/**
 * SSR guard — MapLibre GL requires browser APIs (window, WebGL).
 * next/dynamic with ssr:false is the correct fix for the white-screen flash:
 * the server sends a spinner placeholder; the real map renders only on the client.
 */
const MapLibreMap = dynamic(() => Promise.resolve(MapLibreInner), {
	ssr: false,
	loading: () => (
		<div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-neutral-950">
			<div className="flex flex-col items-center gap-2 text-gray-400 dark:text-neutral-500">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 dark:border-neutral-600 dark:border-t-blue-400" />
				<span className="text-sm">Loading map…</span>
			</div>
		</div>
	),
});

/* ── Public export ──────────────────────────────── */

export default function WebMap({
	fromMarker,
	toMarker,
	routePoints,
	flyTo,
	darkMode = false,
}: WebMapProps) {
	// ── Simulation state ──────────────────────────────
	const [simVehicles, setSimVehicles] = useState<SimulatedVehicle[]>(() =>
		createSimulatedVehicles()
	);
	const [simUser, setSimUser] = useState<SimulatedUser>(() =>
		createSimulatedUser()
	);
	const [simConfig] = useState<SimulationConfig>(() => DEFAULT_CONFIG);
	const lastTickRef = useRef<number>(Date.now());

	// On mount, snap vehicle waypoints to real road geometry via OSRM
	useEffect(() => {
		let cancelled = false;
		resolveRoadPaths(simVehicles).then((snapped) => {
			if (!cancelled) setSimVehicles([...snapped]);
		});
		return () => {
			cancelled = true;
		};
		// Run once on mount only
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only
	}, []);

	// Tick loop — runs entirely in-browser, no separate process needed
	useEffect(() => {
		if (!simConfig.running) return;
		const id = setInterval(() => {
			const now = Date.now();
			const delta = (now - lastTickRef.current) / 1000;
			lastTickRef.current = now;
			setSimVehicles((prev) => tickVehicles(prev, simConfig, delta));
			setSimUser((prev) => tickUser(prev, simConfig, delta));
		}, simConfig.tickInterval);
		return () => clearInterval(id);
	}, [simConfig]);

	// Map simulated vehicles to the Vehicle shape the map expects
	const vehicles: Vehicle[] = simVehicles.map((v) => ({
		id: v.id,
		type: v.type,
		lat: v.lat,
		lng: v.lng,
		name: v.name,
		capacity: v.capacity,
		avgCost: v.avgCost,
		route: v.route,
		heading: v.heading,
	}));

	return (
		<div className="absolute inset-0 overflow-hidden">
			<MapLibreMap
				darkMode={darkMode}
				flyTo={flyTo}
				fromMarker={fromMarker}
				routePoints={routePoints}
				simUser={simUser}
				toMarker={toMarker}
				vehicles={vehicles}
			/>

			{/* MapLibre GL control overrides */}
			<style>{`
				.maplibregl-map {
					font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif !important;
				}
				.maplibregl-ctrl-group {
					background: ${darkMode ? "rgba(23,23,23,0.92)" : "rgba(255,255,255,0.92)"} !important;
					backdrop-filter: blur(12px) !important;
					border-radius: 12px !important;
					border: none !important;
					box-shadow: 0 2px 12px ${darkMode ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.10)"} !important;
					overflow: hidden !important;
				}
				.maplibregl-ctrl-group button {
					width: 40px !important;
					height: 40px !important;
					border-bottom: 1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} !important;
				}
				.maplibregl-ctrl-group button:last-child {
					border-bottom: none !important;
				}
				.maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon,
				.maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon,
				.maplibregl-ctrl-compass .maplibregl-ctrl-icon {
					filter: ${darkMode ? "invert(85%) sepia(0%) saturate(0%) brightness(1.2)" : "invert(35%) sepia(100%) saturate(1000%) hue-rotate(195deg)"} !important;
				}
				.maplibregl-ctrl-attrib {
					background: ${darkMode ? "rgba(23,23,23,0.75)" : "rgba(255,255,255,0.75)"} !important;
					backdrop-filter: blur(8px) !important;
					border-radius: 8px !important;
					font-size: 10px !important;
					color: ${darkMode ? "#737373" : "#8e8e93"} !important;
				}
				.maplibregl-ctrl-attrib a {
					color: ${darkMode ? "#60a5fa" : "#007AFF"} !important;
				}
			`}</style>
		</div>
	);
}
