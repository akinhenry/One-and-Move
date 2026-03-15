"use client";

import { useQuery } from "@tanstack/react-query";
import { Bus, Car, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { client } from "@/utils/orpc";

/* ── Types ─────────────────────────────────────── */

interface LatLng {
	lat: number;
	lng: number;
}

interface WebMapProps {
	flyTo?: LatLng | null;
	fromMarker?: LatLng | null;
	routePoints?: LatLng[];
	toMarker?: LatLng | null;
}

interface Vehicle {
	avgCost: string;
	capacity: number;
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
const IOS_TILE_URL =
	"https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png";

/* ── Mock data (fallback) ───────────────────────── */

const MOCK_VEHICLES: Vehicle[] = [
	{
		id: "1",
		type: "jutc",
		lat: 18.017,
		lng: -76.805,
		name: "JUTC Bus 32",
		capacity: 80,
		avgCost: "JMD $100",
		route: "Half Way Tree → Papine",
	},
	{
		id: "2",
		type: "jutc",
		lat: 18.022,
		lng: -76.812,
		name: "JUTC Bus 21A",
		capacity: 60,
		avgCost: "JMD $100",
		route: "Downtown → Constant Spring",
	},
	{
		id: "3",
		type: "jutc",
		lat: 18.013,
		lng: -76.798,
		name: "JUTC Bus 15",
		capacity: 72,
		avgCost: "JMD $100",
		route: "New Kingston → UWI",
	},
	{
		id: "4",
		type: "robot_taxi",
		lat: 18.016,
		lng: -76.802,
		name: "Robot Taxi A1",
		capacity: 4,
		avgCost: "JMD $800",
	},
	{
		id: "5",
		type: "robot_taxi",
		lat: 18.021,
		lng: -76.819,
		name: "Robot Taxi B3",
		capacity: 4,
		avgCost: "JMD $950",
	},
	{
		id: "6",
		type: "robot_taxi",
		lat: 18.009,
		lng: -76.807,
		name: "Robot Taxi C7",
		capacity: 6,
		avgCost: "JMD $1,200",
	},
];

/* ── Vehicle popup ──────────────────────────────── */

function VehiclePopup({
	vehicle,
	onClose,
}: {
	vehicle: Vehicle;
	onClose: () => void;
}) {
	const isBus = vehicle.type === "jutc";
	const iconBg = isBus ? "#f97316" : "#007AFF";
	const IconComponent = isBus ? Bus : Car;

	return (
		<div
			className="pointer-events-auto min-w-48 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-xl"
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
						<p className="font-semibold text-sm leading-tight text-gray-900">
							{vehicle.name}
						</p>
						<p className="text-gray-500 text-xs">
							{isBus ? "Public Bus" : "Robot Taxi"}
						</p>
					</div>
					<button
						aria-label="Close popup"
						className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100"
						onClick={onClose}
						type="button"
					>
						✕
					</button>
				</div>
				<div className="space-y-1.5 border-gray-100 border-t pt-2">
					<div className="flex justify-between text-xs">
						<span className="text-gray-500">Est. Capacity</span>
						<span className="font-medium text-gray-800">
							{vehicle.capacity} passengers
						</span>
					</div>
					<div className="flex justify-between text-xs">
						<span className="text-gray-500">Avg. Cost</span>
						<span className="font-medium text-gray-800">{vehicle.avgCost}</span>
					</div>
					{vehicle.route && (
						<div className="mt-1 border-gray-100 border-t pt-1.5 text-gray-500 text-xs">
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
}: {
	flyTo?: LatLng | null;
	fromMarker?: LatLng | null;
	toMarker?: LatLng | null;
	routePoints?: LatLng[];
	vehicles: Vehicle[];
}) {
	// react-map-gl v8 exports MapLibre-flavoured components from this sub-path
	const { Map, Source, Layer, Marker, NavigationControl } =
		// biome-ignore lint/suspicious/noExplicitAny: dynamic require at runtime only
		require("react-map-gl/maplibre") as typeof import("react-map-gl/maplibre");

	const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
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

	return (
		<Map
			initialViewState={{
				longitude: DEFAULT_CENTER.lng,
				latitude: DEFAULT_CENTER.lat,
				zoom: DEFAULT_ZOOM,
			}}
			mapLib={import("maplibre-gl")}
			mapStyle={{
				version: 8,
				sources: {
					"carto-voyager": {
						type: "raster",
						tiles: [IOS_TILE_URL],
						tileSize: 256,
						attribution:
							"© <a href='https://www.openstreetmap.org/copyright'>OSM</a> © <a href='https://carto.com/'>CARTO</a>",
					},
				},
				layers: [
					{
						id: "carto-voyager-tiles",
						type: "raster",
						source: "carto-voyager",
						minzoom: 0,
						maxzoom: 22,
					},
				],
			}}
			onClick={() => setSelectedVehicle(null)}
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
						"line-color": "#ffffff",
						"line-width": 7,
						"line-opacity": 0.5,
					}}
					type="line"
				/>
				<Layer
					id="route-line"
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{
						"line-color": "#007AFF",
						"line-width": 4,
						"line-opacity": 0.9,
					}}
					type="line"
				/>
			</Source>

			{/* Vehicle markers */}
			{vehicles.map((vehicle) => {
				const isBus = vehicle.type === "jutc";
				const fill = isBus ? "#f97316" : "#007AFF";
				return (
					<Marker
						anchor="bottom"
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
							<svg
								className="drop-shadow-md transition-transform duration-150 group-hover:scale-110"
								height="38"
								viewBox="0 0 38 38"
								width="38"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>{vehicle.name}</title>
								<circle
									cx="19"
									cy="19"
									fill={fill}
									r="18"
									stroke="white"
									strokeWidth="2.5"
								/>
								<text
									fill="white"
									fontSize="14"
									fontWeight="bold"
									textAnchor="middle"
									x="19"
									y="24"
								>
									{isBus ? "B" : "T"}
								</text>
							</svg>
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
		<div className="flex h-full w-full items-center justify-center bg-gray-50">
			<div className="flex flex-col items-center gap-2 text-gray-400">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
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
}: WebMapProps) {
	// Poll crowdsource API for live vehicles every 10 s
	const { data: liveData } = useQuery({
		queryKey: ["crowdsource", "nearbyVehicles"],
		queryFn: () =>
			client.crowdsource.getNearbyVehicles({
				lat: DEFAULT_CENTER.lat,
				lng: DEFAULT_CENTER.lng,
				radiusKm: 15,
			}),
		refetchInterval: 10_000,
		staleTime: 8_000,
	});

	const vehicles: Vehicle[] =
		liveData && liveData.length > 0
			? liveData.map((v) => ({
					id: v.id,
					type:
						v.vehicleType === "jutc"
							? ("jutc" as const)
							: ("robot_taxi" as const),
					lat: v.lat,
					lng: v.lng,
					name: v.routeNumber
						? `JUTC Bus ${v.routeNumber}`
						: `Taxi ${v.licensePlate}`,
					capacity: v.vehicleType === "jutc" ? 72 : 4,
					avgCost: v.vehicleType === "jutc" ? "JMD $100" : "JMD $800",
					route: v.routeNumber ?? undefined,
				}))
			: MOCK_VEHICLES;

	return (
		<div className="absolute inset-0 overflow-hidden">
			<MapLibreMap
				flyTo={flyTo}
				fromMarker={fromMarker}
				routePoints={routePoints}
				toMarker={toMarker}
				vehicles={vehicles}
			/>

			{/* MapLibre GL control overrides — iOS style */}
			<style>{`
				.maplibregl-map {
					font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif !important;
				}
				.maplibregl-ctrl-group {
					background: rgba(255,255,255,0.92) !important;
					backdrop-filter: blur(12px) !important;
					border-radius: 12px !important;
					border: none !important;
					box-shadow: 0 2px 12px rgba(0,0,0,0.10) !important;
					overflow: hidden !important;
				}
				.maplibregl-ctrl-group button {
					width: 40px !important;
					height: 40px !important;
					border-bottom: 1px solid rgba(0,0,0,0.06) !important;
				}
				.maplibregl-ctrl-group button:last-child {
					border-bottom: none !important;
				}
				.maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon,
				.maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon,
				.maplibregl-ctrl-compass .maplibregl-ctrl-icon {
					filter: invert(35%) sepia(100%) saturate(1000%) hue-rotate(195deg) !important;
				}
				.maplibregl-ctrl-attrib {
					background: rgba(255,255,255,0.75) !important;
					backdrop-filter: blur(8px) !important;
					border-radius: 8px !important;
					font-size: 10px !important;
					color: #8e8e93 !important;
				}
				.maplibregl-ctrl-attrib a {
					color: #007AFF !important;
				}
			`}</style>
		</div>
	);
}
