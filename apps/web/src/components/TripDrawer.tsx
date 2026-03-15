"use client";

import { Button } from "@One-and-Move/ui/components/button";
import { Input } from "@One-and-Move/ui/components/input";
import { MapPin, Navigation, Route, X } from "lucide-react";
import { useState } from "react";

export default function TripDrawer() {
	const [isOpen, setIsOpen] = useState(false);
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");

	const handleFindRoute = () => {
		// TODO: integrate with routing API
		// For now just a placeholder action
	};

	const isRouteDisabled = from.trim() === "" || to.trim() === "";

	return (
		<>
			{/* Floating trigger button */}
			{!isOpen && (
				<button
					aria-label="Open trip planner"
					className="absolute right-6 bottom-6 z-20 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-semibold text-sm text-white shadow-xl transition-all hover:bg-blue-700 hover:shadow-2xl active:scale-95"
					onClick={() => setIsOpen(true)}
					type="button"
				>
					<Navigation size={16} />
					Plan a Trip
				</button>
			)}

			{/* Drawer panel */}
			<div
				aria-hidden={!isOpen}
				className={`absolute right-0 bottom-0 z-30 flex h-auto w-full flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:right-6 sm:bottom-6 sm:w-80 sm:rounded-2xl ${
					isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-[120%]"
				}`}
			>
				{/* Drawer header */}
				<div className="flex items-center justify-between border-gray-100 border-b px-4 py-3">
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600">
							<Route color="white" size={14} />
						</div>
						<h2 className="font-semibold text-gray-900">Start Trip</h2>
					</div>
					<button
						aria-label="Close trip planner"
						className="text-gray-400 transition-colors hover:text-gray-600"
						onClick={() => setIsOpen(false)}
						type="button"
					>
						<X size={18} />
					</button>
				</div>

				{/* Drawer content */}
				<div className="flex flex-col gap-3 p-4">
					{/* From field */}
					<div className="flex flex-col gap-1">
						<label
							className="flex items-center gap-1.5 font-medium text-gray-600 text-xs"
							htmlFor="trip-from"
						>
							<MapPin className="text-green-500" size={12} />
							From
						</label>
						<Input
							className="rounded-lg"
							id="trip-from"
							onChange={(e) => setFrom(e.target.value)}
							placeholder="Enter starting location"
							type="text"
							value={from}
						/>
					</div>

					{/* To field */}
					<div className="flex flex-col gap-1">
						<label
							className="flex items-center gap-1.5 font-medium text-gray-600 text-xs"
							htmlFor="trip-to"
						>
							<MapPin className="text-red-500" size={12} />
							To
						</label>
						<Input
							className="rounded-lg"
							id="trip-to"
							onChange={(e) => setTo(e.target.value)}
							placeholder="Enter destination"
							type="text"
							value={to}
						/>
					</div>

					{/* Find Route button */}
					<Button
						className="mt-1 w-full rounded-lg bg-blue-600 py-2 font-semibold text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						disabled={isRouteDisabled}
						onClick={handleFindRoute}
						type="button"
					>
						<Navigation size={14} />
						Find Route
					</Button>
				</div>
			</div>

			{/* Backdrop for mobile */}
			{isOpen && (
				<button
					aria-label="Close drawer"
					className="absolute inset-0 z-20 bg-black/20 sm:hidden"
					onClick={() => setIsOpen(false)}
					type="button"
				/>
			)}
		</>
	);
}
