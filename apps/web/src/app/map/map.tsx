"use client";

import WebMap from "@/components/Map";
import TripDrawer from "@/components/TripDrawer";

export default function TransitMap() {
	return (
		<div className="relative h-full w-full overflow-hidden">
			<WebMap />
			<TripDrawer />
		</div>
	);
}
