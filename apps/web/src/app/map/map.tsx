"use client";

import { useTheme } from "next-themes";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WebMap from "@/components/Map";
import { MapNavBar } from "@/components/map-nav-bar";
import type {
	LatLng,
	LocationSuggestion,
	TripRoute,
} from "@/components/TripDrawer";
import TripDrawer from "@/components/TripDrawer";
import WalkthroughModal from "@/components/walkthrough-modal";

export default function TransitMap() {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const searchParams = useSearchParams();

	// Pre-populate from hero search params
	const initialFrom = useMemo<LocationSuggestion | null>(() => {
		const name = searchParams.get("fromName");
		const lat = searchParams.get("fromLat");
		const lng = searchParams.get("fromLng");
		if (!name || !lat || !lng) return null;
		return {
			id: `hero-from`,
			name,
			address: name,
			coords: { lat: Number(lat), lng: Number(lng) },
		};
	}, [searchParams]);

	const initialTo = useMemo<LocationSuggestion | null>(() => {
		const name = searchParams.get("toName");
		const lat = searchParams.get("toLat");
		const lng = searchParams.get("toLng");
		if (!name || !lat || !lng) return null;
		return {
			id: `hero-to`,
			name,
			address: name,
			coords: { lat: Number(lat), lng: Number(lng) },
		};
	}, [searchParams]);

	const [fromMarker, setFromMarker] = useState<LatLng | null>(initialFrom?.coords ?? null);
	const [toMarker, setToMarker] = useState<LatLng | null>(initialTo?.coords ?? null);
	const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
	const [flyTo, setFlyTo] = useState<LatLng | null>(initialFrom?.coords ?? initialTo?.coords ?? null);

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
			<MapNavBar />
			<WebMap
				darkMode={isDark}
				flyTo={flyTo}
				fromMarker={fromMarker}
				routePoints={routePoints}
				toMarker={toMarker}
			/>
			<TripDrawer
				initialFrom={initialFrom}
				initialTo={initialTo}
				onFromSelect={handleFromSelect}
				onRouteFound={handleRouteFound}
				onToSelect={handleToSelect}
			/>
			<WalkthroughModal />
		</div>
	);
}
