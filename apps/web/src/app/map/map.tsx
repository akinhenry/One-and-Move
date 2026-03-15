"use client";

import { useCallback, useState } from "react";
import WebMap from "@/components/Map";
import type {
	LatLng,
	LocationSuggestion,
	TripRoute,
} from "@/components/TripDrawer";
import TripDrawer from "@/components/TripDrawer";

export default function TransitMap() {
	const [fromMarker, setFromMarker] = useState<LatLng | null>(null);
	const [toMarker, setToMarker] = useState<LatLng | null>(null);
	const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
	const [flyTo, setFlyTo] = useState<LatLng | null>(null);

	const handleFromSelect = useCallback((loc: LocationSuggestion | null) => {
		setFromMarker(loc ? loc.coords : null);
		if (loc) setFlyTo(loc.coords);
	}, []);

	const handleToSelect = useCallback((loc: LocationSuggestion | null) => {
		setToMarker(loc ? loc.coords : null);
		if (loc) setFlyTo(loc.coords);
	}, []);

	const handleRouteFound = useCallback(
		(route: TripRoute | null) => {
			if (!route) {
				setRoutePoints([]);
				return;
			}
			if (fromMarker && toMarker) {
				setRoutePoints([fromMarker, toMarker]);
			}
		},
		[fromMarker, toMarker]
	);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<WebMap
				flyTo={flyTo}
				fromMarker={fromMarker}
				routePoints={routePoints}
				toMarker={toMarker}
			/>
			<TripDrawer
				onFromSelect={handleFromSelect}
				onRouteFound={handleRouteFound}
				onToSelect={handleToSelect}
			/>
		</div>
	);
}
