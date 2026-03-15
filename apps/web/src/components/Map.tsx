"use client";

import { useState } from "react";
import MapGL, {
	Layer,
	Marker,
	NavigationControl,
	Popup,
	Source,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Bus, Car, X } from "lucide-react";

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

const MOCK_ROUTE = {
	type: "Feature" as const,
	properties: {},
	geometry: {
		type: "LineString" as const,
		coordinates: [
			[-76.8099, 18.0179],
			[-76.805, 18.017],
			[-76.802, 18.016],
			[-76.8, 18.015],
		],
	},
};

export default function WebMap() {
	const [viewState, setViewState] = useState({
		longitude: -76.8099,
		latitude: 18.0179,
		zoom: 13,
	});

	const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

	return (
		<div className="relative h-full w-full">
			<MapGL
				{...viewState}
				mapboxAccessToken={
					process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
					"pk.eyJ1IjoiZHVtbXkiLCJhIjoiY2xhMTI3bHJnMGEwaDNwdGVybGwwMjJqNiJ9.dummy"
				}
				mapStyle="mapbox://styles/mapbox/streets-v12"
				onMove={(evt) => setViewState(evt.viewState)}
				style={{ width: "100%", height: "100%" }}
			>
				<NavigationControl position="top-right" />

				{/* Vehicle Markers */}
				{MOCK_VEHICLES.map((vehicle) => (
					<Marker
						anchor="bottom"
						key={vehicle.id}
						latitude={vehicle.lat}
						longitude={vehicle.lng}
						onClick={(e) => {
							e.originalEvent.stopPropagation();
							setSelectedVehicle(vehicle);
						}}
					>
						{vehicle.type === "jutc" ? (
							<div
								className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110"
								style={{ backgroundColor: "#f97316" }}
								title={vehicle.name}
							>
								<Bus color="white" size={20} strokeWidth={2.5} />
							</div>
						) : (
							<div
								className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110"
								style={{ backgroundColor: "#3b82f6" }}
								title={vehicle.name}
							>
								<Car color="white" size={20} strokeWidth={2.5} />
							</div>
						)}
					</Marker>
				))}

				{/* Info Popup on vehicle click */}
				{selectedVehicle && (
					<Popup
						anchor="bottom"
						className="z-50"
						closeButton={false}
						latitude={selectedVehicle.lat}
						longitude={selectedVehicle.lng}
						offset={48}
						onClose={() => setSelectedVehicle(null)}
					>
						<div className="relative min-w-45 rounded-lg bg-white p-3 shadow-xl">
							<button
								aria-label="Close popup"
								className="absolute top-2 right-2 text-gray-400 transition-colors hover:text-gray-600"
								onClick={() => setSelectedVehicle(null)}
								type="button"
							>
								<X size={14} />
							</button>

							<div className="mb-2 flex items-center gap-2">
								{selectedVehicle.type === "jutc" ? (
									<div
										className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
										style={{ backgroundColor: "#f97316" }}
									>
										<Bus color="white" size={16} />
									</div>
								) : (
									<div
										className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
										style={{ backgroundColor: "#3b82f6" }}
									>
										<Car color="white" size={16} />
									</div>
								)}
								<div>
									<p className="font-semibold text-gray-900 text-sm leading-tight">
										{selectedVehicle.name}
									</p>
									<p className="text-gray-500 text-xs">
										{selectedVehicle.type === "jutc"
											? "Public Bus"
											: "Robot Taxi"}
									</p>
								</div>
							</div>

							<div className="space-y-1 border-gray-100 border-t pt-2">
								<div className="flex justify-between text-xs">
									<span className="text-gray-500">Est. Capacity</span>
									<span className="font-medium text-gray-800">
										{selectedVehicle.capacity} passengers
									</span>
								</div>
								<div className="flex justify-between text-xs">
									<span className="text-gray-500">Avg. Cost</span>
									<span className="font-medium text-gray-800">
										{selectedVehicle.avgCost}
									</span>
								</div>
								{selectedVehicle.route && (
									<div className="mt-1 border-gray-100 border-t pt-1 text-gray-500 text-xs">
										{selectedVehicle.route}
									</div>
								)}
							</div>
						</div>
					</Popup>
				)}

				{/* Route polyline */}
				<Source data={MOCK_ROUTE} id="route" type="geojson">
					<Layer
						id="route-line"
						paint={{
							"line-color": "#3b82f6",
							"line-width": 4,
							"line-opacity": 0.7,
						}}
						type="line"
					/>
				</Source>
			</MapGL>

			{/* Legend */}
			<div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 rounded-lg bg-white/90 p-2.5 text-xs shadow-md backdrop-blur-sm">
				<div className="flex items-center gap-2">
					<div
						className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
						style={{ backgroundColor: "#f97316" }}
					>
						<Bus color="white" size={11} />
					</div>
					<span className="text-gray-700">JUTC Bus</span>
				</div>
				<div className="flex items-center gap-2">
					<div
						className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
						style={{ backgroundColor: "#3b82f6" }}
					>
						<Car color="white" size={11} />
					</div>
					<span className="text-gray-700">Robot Taxi</span>
				</div>
			</div>
		</div>
	);
}
