"use client";

import { JUTC_ROUTES } from "@One-and-Move/db/data/jutc-routes";
import { Button } from "@One-and-Move/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Bus,
	Car,
	Clock,
	DollarSign,
	MapPin,
	Navigation,
	Radio,
	Route,
	Search,
	Square,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import { client } from "@/utils/orpc";

/* ── Types ─────────────────────────────────────── */

export interface LatLng {
	lat: number;
	lng: number;
}

export interface LocationSuggestion {
	address: string;
	coords: LatLng;
	id: string;
	name: string;
}

export interface TripLeg {
	cost: number;
	duration: number; // minutes
	from: string;
	legNumber: number;
	to: string;
	type: "jutc" | "robot_taxi";
	vehicleName: string;
}

export interface TripRoute {
	destination: string;
	legs: TripLeg[];
	totalCost: number;
	totalDuration: number; // minutes
}

interface TripDrawerProps {
	initialFrom?: LocationSuggestion | null;
	initialTo?: LocationSuggestion | null;
	onFromSelect?: (location: LocationSuggestion | null) => void;
	onRouteFound?: (route: TripRoute | null) => void;
	onToSelect?: (location: LocationSuggestion | null) => void;
}

/* ── Mock route builder (until real routing API is integrated) ─── */

function getMockRoute(
	from: LocationSuggestion,
	to: LocationSuggestion
): TripRoute {
	const distance = Math.sqrt(
		(from.coords.lat - to.coords.lat) ** 2 +
			(from.coords.lng - to.coords.lng) ** 2
	);
	const needsMultiLeg = distance > 0.03;

	if (needsMultiLeg) {
		return {
			destination: to.name,
			legs: [
				{
					legNumber: 1,
					from: from.name,
					to: "Half Way Tree",
					type: "jutc",
					vehicleName: "JUTC Bus 32",
					cost: 100,
					duration: 15,
				},
				{
					legNumber: 2,
					from: "Half Way Tree",
					to: to.name,
					type: "robot_taxi",
					vehicleName: "Robot Taxi B3",
					cost: 950,
					duration: 12,
				},
			],
			totalCost: 1050,
			totalDuration: 27,
		};
	}

	return {
		destination: to.name,
		legs: [
			{
				legNumber: 1,
				from: from.name,
				to: to.name,
				type: "robot_taxi",
				vehicleName: "Robot Taxi A1",
				cost: 800,
				duration: 8,
			},
		],
		totalCost: 800,
		totalDuration: 8,
	};
}

/* ── Live suggestion list (LocationIQ via server-side proxy) ────── */

function SuggestionList({
	query,
	onSelect,
	visible,
}: {
	query: string;
	onSelect: (s: LocationSuggestion) => void;
	visible: boolean;
}) {
	// Debounce: only fire the query after the user pauses typing for 350ms
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	useEffect(() => {
		const id = setTimeout(() => setDebouncedQuery(query), 350);
		return () => clearTimeout(id);
	}, [query]);

	const { data: suggestions = [], isFetching } = useQuery({
		queryKey: ["geocode", debouncedQuery],
		queryFn: () => client.geocode.search({ query: debouncedQuery }),
		enabled: visible && debouncedQuery.trim().length >= 2,
		staleTime: 60_000,
		placeholderData: (prev) => prev,
	});

	if (!visible || query.trim().length < 2) {
		return null;
	}

	if (isFetching && suggestions.length === 0) {
		return (
			<div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-xl border border-gray-100 bg-white/95 px-3 py-3 shadow-lg backdrop-blur-xl dark:border-neutral-700 dark:bg-neutral-900/95">
				<div className="flex items-center gap-2 text-gray-400 text-xs dark:text-neutral-500">
					<div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-blue-500 dark:border-neutral-600 dark:border-t-blue-400" />
					Searching…
				</div>
			</div>
		);
	}

	if (suggestions.length === 0) {
		return null;
	}

	return (
		<div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white/95 shadow-lg backdrop-blur-xl dark:border-neutral-700 dark:bg-neutral-900/95">
			{suggestions.map((s: LocationSuggestion) => (
				<button
					className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
					key={s.id}
					onMouseDown={(e) => {
						e.preventDefault();
						onSelect(s);
					}}
					type="button"
				>
					<MapPin
						className="mt-0.5 shrink-0 text-gray-400 dark:text-neutral-500"
						size={14}
					/>
					<div className="min-w-0">
						<p className="truncate font-medium text-gray-900 text-sm dark:text-neutral-100">
							{s.name}
						</p>
						<p className="truncate text-gray-500 text-xs dark:text-neutral-400">
							{s.address}
						</p>
					</div>
				</button>
			))}
		</div>
	);
}

/* ── Route results panel ───────────────────────── */

function RouteResultsPanel({
	route,
	onBack,
	onClose,
}: {
	route: TripRoute;
	onBack: () => void;
	onClose: () => void;
}) {
	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center gap-2 border-gray-100 border-b px-4 py-3 dark:border-neutral-700">
				<button
					aria-label="Go back"
					className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
					onClick={onBack}
					type="button"
				>
					<ArrowLeft size={18} />
				</button>
				<div className="min-w-0 flex-1">
					<h2 className="truncate font-semibold text-gray-900 dark:text-neutral-100">
						Trip to {route.destination}
					</h2>
					<p className="text-gray-500 text-xs dark:text-neutral-400">
						{route.legs.length} {route.legs.length === 1 ? "leg" : "legs"} •{" "}
						Optimal route
					</p>
				</div>
				<button
					aria-label="Close"
					className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
					onClick={onClose}
					type="button"
				>
					<X size={18} />
				</button>
			</div>

			{/* Legs */}
			<div className="flex-1 overflow-y-auto px-4 py-3">
				<div className="space-y-0">
					{route.legs.map((leg, index) => {
						const isBus = leg.type === "jutc";
						const isLast = index === route.legs.length - 1;
						return (
							<div className="relative flex gap-3" key={leg.legNumber}>
								{/* Timeline */}
								<div className="flex flex-col items-center">
									<div
										className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
										style={{
											backgroundColor: isBus ? "#10b981" : "#6b7280",
										}}
									>
										{isBus ? (
											<Bus color="white" size={14} />
										) : (
											<Car color="white" size={14} />
										)}
									</div>
									{!isLast && (
										<div className="my-1 w-0.5 flex-1 rounded-full bg-gray-200 dark:bg-neutral-700" />
									)}
								</div>

								{/* Leg content */}
								<div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
									<div className="flex items-start justify-between">
										<div className="min-w-0">
											<p className="font-medium text-gray-500 text-xs dark:text-neutral-400">
												Leg {leg.legNumber}
											</p>
											<p className="truncate font-semibold text-gray-900 text-sm dark:text-neutral-100">
												{leg.vehicleName}
											</p>
										</div>
										<span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 text-xs dark:bg-neutral-800 dark:text-neutral-300">
											JMD ${leg.cost.toLocaleString()}
										</span>
									</div>
									<p className="mt-0.5 text-gray-500 text-xs dark:text-neutral-400">
										{leg.from} → {leg.to}
									</p>
									<p className="mt-0.5 flex items-center gap-1 text-gray-400 text-xs dark:text-neutral-500">
										<Clock size={10} />
										{leg.duration} min
									</p>
								</div>
							</div>
						);
					})}
				</div>

				{/* Destination marker */}
				<div className="mt-3 flex items-center gap-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 shadow-sm">
						<MapPin color="white" size={14} />
					</div>
					<p className="font-medium text-gray-700 text-sm dark:text-neutral-300">
						Arrive at {route.destination}
					</p>
				</div>
			</div>

			{/* Summary footer */}
			<div className="border-gray-100 border-t px-4 py-3 dark:border-neutral-700">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-1.5">
							<Clock
								className="text-gray-400 dark:text-neutral-500"
								size={14}
							/>
							<span className="font-semibold text-gray-900 text-sm dark:text-neutral-100">
								{route.totalDuration} min
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<DollarSign
								className="text-gray-400 dark:text-neutral-500"
								size={14}
							/>
							<span className="font-semibold text-gray-900 text-sm dark:text-neutral-100">
								JMD ${route.totalCost.toLocaleString()}
							</span>
						</div>
					</div>
					<span className="rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-700 text-xs dark:bg-green-900/40 dark:text-green-400">
						Best Route
					</span>
				</div>
			</div>
		</div>
	);
}

/* ── Main drawer ───────────────────────────────── */

type DrawerView = "search" | "results" | "boarding" | "tracking";

function getSlideClass(
	currentView: DrawerView,
	targetView: DrawerView,
	slideDirection: "left" | "right"
): string {
	if (currentView === targetView) {
		return "translate-x-0";
	}
	const viewOrder: DrawerView[] = ["search", "results", "boarding", "tracking"];
	const currentIdx = viewOrder.indexOf(currentView);
	const targetIdx = viewOrder.indexOf(targetView);

	if (slideDirection === "left") {
		return targetIdx < currentIdx ? "-translate-x-full" : "translate-x-full";
	}
	return targetIdx < currentIdx ? "translate-x-full" : "-translate-x-full";
}

export default function TripDrawer({
	initialFrom,
	initialTo,
	onFromSelect,
	onToSelect,
	onRouteFound,
}: TripDrawerProps) {
	const [open, setOpen] = useState(false);
	const [view, setView] = useState<DrawerView>("search");
	const [slideDirection, setSlideDirection] = useState<"left" | "right">(
		"left"
	);

	// Search state
	const [fromQuery, setFromQuery] = useState(initialFrom?.name ?? "");
	const [toQuery, setToQuery] = useState(initialTo?.name ?? "");
	const [selectedFrom, setSelectedFrom] = useState<LocationSuggestion | null>(
		initialFrom ?? null
	);
	const [selectedTo, setSelectedTo] = useState<LocationSuggestion | null>(initialTo ?? null);
	const [showFromSuggestions, setShowFromSuggestions] = useState(false);
	const [showToSuggestions, setShowToSuggestions] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [route, setRoute] = useState<TripRoute | null>(null);
	const [minimized, setMinimized] = useState(false);

	// Boarding state
	const [boardingType, setBoardingType] = useState<"jutc" | "taxi">("jutc");
	const [licensePlate, setLicensePlate] = useState("");
	const [routeNumber, setRouteNumber] = useState("");
	const [isBoardingLoading, setIsBoardingLoading] = useState(false);

	// Tracking state
	const [liveVehicleId, setLiveVehicleId] = useState<string | null>(null);
	const [trackingElapsed, setTrackingElapsed] = useState(0);
	const [lastPosition, setLastPosition] = useState<LatLng | null>(null);
	const watchIdRef = useRef<number | null>(null);
	const trackingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const toRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleClick = () => {
			setShowFromSuggestions(false);
			setShowToSuggestions(false);
		};
		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, []);

	// Cleanup geolocation watch and timer on unmount
	useEffect(() => {
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
			if (trackingTimerRef.current !== null) {
				clearInterval(trackingTimerRef.current);
			}
		};
	}, []);

	const handleFromSelect = useCallback(
		(suggestion: LocationSuggestion) => {
			setSelectedFrom(suggestion);
			setFromQuery(suggestion.name);
			setShowFromSuggestions(false);
			onFromSelect?.(suggestion);
			setMinimized(true);
		},
		[onFromSelect]
	);

	const handleToSelect = useCallback(
		(suggestion: LocationSuggestion) => {
			setSelectedTo(suggestion);
			setToQuery(suggestion.name);
			setShowToSuggestions(false);
			onToSelect?.(suggestion);
			setMinimized(true);
		},
		[onToSelect]
	);

	const handleFindRoute = useCallback(() => {
		if (!selectedFrom) {
			return;
		}
		if (!selectedTo) {
			return;
		}
		setIsSearching(true);
		setTimeout(() => {
			const mockRoute = getMockRoute(selectedFrom, selectedTo);
			setRoute(mockRoute);
			onRouteFound?.(mockRoute);
			setIsSearching(false);
			setSlideDirection("left");
			setView("results");
		}, 800);
	}, [selectedFrom, selectedTo, onRouteFound]);

	const handleBack = useCallback(() => {
		setSlideDirection("right");
		setView("search");
		setRoute(null);
		onRouteFound?.(null);
	}, [onRouteFound]);

	const handleClose = useCallback(() => {
		setOpen(false);
		setTimeout(() => {
			setView("search");
			setFromQuery("");
			setToQuery("");
			setSelectedFrom(null);
			setSelectedTo(null);
			setRoute(null);
			setLicensePlate("");
			setRouteNumber("");
			setBoardingType("jutc");
			setMinimized(false);
			onFromSelect?.(null);
			onToSelect?.(null);
			onRouteFound?.(null);
		}, 350);
	}, [onFromSelect, onToSelect, onRouteFound]);

	const handleGoToBoarding = useCallback(() => {
		setMinimized(false);
		setSlideDirection("left");
		setView("boarding");
	}, []);

	const handleBackFromBoarding = useCallback(() => {
		setSlideDirection("right");
		setView("search");
	}, []);

	const handleStartTracking = useCallback(async () => {
		if (!licensePlate.trim()) {
			return;
		}
		if (boardingType === "jutc" && !routeNumber) {
			return;
		}

		setIsBoardingLoading(true);

		try {
			// Get initial position
			const position = await new Promise<GeolocationPosition>(
				(resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: true,
						timeout: 10_000,
					});
				}
			);

			const initialLat = position.coords.latitude;
			const initialLng = position.coords.longitude;

			// Call API to start tracking
			const result = await client.crowdsource.startTracking({
				vehicleType: boardingType,
				licensePlate: licensePlate.trim().toUpperCase(),
				routeNumber: boardingType === "jutc" ? routeNumber : undefined,
				lat: initialLat,
				lng: initialLng,
			});

			setLiveVehicleId(result.id);
			setLastPosition({ lat: initialLat, lng: initialLng });
			setTrackingElapsed(0);

			// Start geolocation watch
			const watchId = navigator.geolocation.watchPosition(
				(pos) => {
					const lat = pos.coords.latitude;
					const lng = pos.coords.longitude;
					setLastPosition({ lat, lng });

					// Send update to server
					if (result.id) {
						client.crowdsource
							.updateLocation({
								liveVehicleId: result.id,
								lat,
								lng,
								heading: pos.coords.heading ?? undefined,
								speed: pos.coords.speed ?? undefined,
							})
							.catch(() => {
								// Silently fail — will retry on next position update
							});
					}
				},
				() => {
					// Geolocation error — keep tracking but position won't update
				},
				{
					enableHighAccuracy: true,
					maximumAge: 5_000,
					timeout: 15_000,
				}
			);
			watchIdRef.current = watchId;

			// Start elapsed timer
			const timer = setInterval(() => {
				setTrackingElapsed((prev) => prev + 1);
			}, 1000);
			trackingTimerRef.current = timer;

			setSlideDirection("left");
			setView("tracking");
		} catch {
			// Handle error (geolocation denied, API error, etc.)
		} finally {
			setIsBoardingLoading(false);
		}
	}, [boardingType, licensePlate, routeNumber]);

	const handleStopTracking = useCallback(async () => {
		// Stop geolocation watch
		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
		}
		// Stop timer
		if (trackingTimerRef.current !== null) {
			clearInterval(trackingTimerRef.current);
			trackingTimerRef.current = null;
		}

		// Call API to deactivate
		if (liveVehicleId) {
			try {
				await client.crowdsource.stopTracking({
					liveVehicleId,
				});
			} catch {
				// Best effort
			}
		}

		setLiveVehicleId(null);
		setTrackingElapsed(0);
		setLastPosition(null);
		setLicensePlate("");
		setRouteNumber("");
		setSlideDirection("right");
		setView("search");
	}, [liveVehicleId]);

	const formatElapsed = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const isRouteDisabled =
		selectedFrom === null || selectedTo === null || isSearching;

	const isBoardDisabled =
		!licensePlate.trim() ||
		(boardingType === "jutc" && !routeNumber) ||
		isBoardingLoading;

	return (
		<Drawer.Root
			onOpenChange={(newOpen) => {
				// Prevent closing while actively tracking
				if (!newOpen && view === "tracking") {
					return;
				}
				setOpen(newOpen);
			}}
			open={open}
			shouldScaleBackground={false}
		>
			{/* Floating trigger pill */}
			<Drawer.Trigger asChild>
				<button
					aria-label="Open trip planner"
					className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-5 py-3 text-sm font-semibold text-gray-900 shadow-xl backdrop-blur-xl transition-all hover:bg-white hover:shadow-2xl active:scale-95 dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-100 dark:hover:bg-neutral-800"
					style={{ zIndex: 1002 }}
					type="button"
				>
					<div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500">
						<Navigation color="white" size={13} />
					</div>
					Plan a Trip
				</button>
			</Drawer.Trigger>

			<Drawer.Portal>
				<Drawer.Overlay
					className={`fixed inset-0 transition-colors duration-300 ${
						view === "tracking"
							? "bg-transparent"
							: "bg-black/20 dark:bg-black/40"
					}`}
					style={{
						zIndex: 1010,
						pointerEvents: view === "tracking" ? "none" : "auto",
					}}
				/>

				<Drawer.Content
					aria-describedby={undefined}
					className="fixed inset-x-0 bottom-0 mx-auto flex max-w-lg flex-col rounded-t-3xl bg-white/95 shadow-2xl outline-none backdrop-blur-xl transition-[height] duration-300 ease-in-out dark:bg-neutral-900/95"
					style={{
						zIndex: 1011,
						height:
							view === "tracking"
								? "100px"
								: minimized && view === "search"
									? "8em"
									: "56vh",
					}}
				>
					{/* Drag handle */}
					<div className="flex justify-center pt-3 pb-1">
						<div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-neutral-600" />
					</div>

					<Drawer.Title className="sr-only">Plan a Trip</Drawer.Title>

					{/* Sliding panel container */}
					<div className="relative flex-1 overflow-hidden">
						{/* ── Search panel ────────────────── */}
						<div
							className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${getSlideClass(view, "search", slideDirection)}`}
						>
							{/* ── Minimized compact view ──── */}
							{minimized ? (
								<button
									className="flex w-full flex-col gap-3 px-4 pt-2 pb-4 text-left"
									onClick={() => setMinimized(false)}
									type="button"
								>
									<div className="flex items-center gap-3">
										{/* From / To pills */}
										<div className="flex min-w-0 flex-1 items-center gap-2">
											<div className="flex items-center gap-1.5 min-w-0 flex-1">
												<div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
												<p className="truncate text-sm text-gray-700 dark:text-neutral-300">
													{selectedFrom?.name ?? "Starting location"}
												</p>
											</div>
											<span className="shrink-0 text-gray-300 dark:text-neutral-600">
												→
											</span>
											<div className="flex items-center gap-1.5 min-w-0 flex-1">
												<div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
												<p className="truncate text-sm text-gray-700 dark:text-neutral-300">
													{selectedTo?.name ?? "Destination"}
												</p>
											</div>
										</div>
										<X
											className="shrink-0 text-gray-400 dark:text-neutral-500"
											onClick={(e) => {
												e.stopPropagation();
												handleClose();
											}}
											size={16}
										/>
									</div>
									<Button
										className="h-10 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-600 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
										disabled={isRouteDisabled}
										onClick={(e) => {
											e.stopPropagation();
											setMinimized(false);
											handleFindRoute();
										}}
										type="button"
									>
										<Navigation size={14} />
										Find Route
									</Button>
								</button>
							) : (
								<>
									{/* ── Expanded search view ──── */}
									<div className="flex items-center justify-between px-4 pt-2 pb-3">
										<div className="flex items-center gap-2.5">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
												<Route color="white" size={15} />
											</div>
											<div>
												<h2 className="font-semibold text-gray-900 dark:text-neutral-100">
													Start Trip
												</h2>
												<p className="text-gray-500 text-xs dark:text-neutral-400">
													Find the best route
												</p>
											</div>
										</div>
										<button
											aria-label="Close trip planner"
											className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
											onClick={handleClose}
											type="button"
										>
											<X size={18} />
										</button>
									</div>

									<div className="flex flex-col gap-3 overflow-y-auto px-4 pb-6">
										{/* From */}
										<div
											className="relative"
											onClickCapture={(e) => e.stopPropagation()}
										>
											<label
												className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-neutral-400"
												htmlFor="drawer-from"
											>
												<div className="h-2 w-2 rounded-full bg-green-500" />
												From
											</label>
											<div className="relative">
												<Search
													className="absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
													size={14}
												/>
												<input
													autoComplete="off"
													className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pr-3 pl-8 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-500 dark:focus:bg-neutral-800 dark:focus:ring-blue-900/30"
													id="drawer-from"
													onChange={(e) => {
														setFromQuery(e.target.value);
														setSelectedFrom(null);
														onFromSelect?.(null);
														setShowFromSuggestions(true);
													}}
													onFocus={() => setShowFromSuggestions(true)}
													placeholder="Search starting location..."
													type="text"
													value={fromQuery}
												/>
											</div>
											<SuggestionList
												onSelect={handleFromSelect}
												query={fromQuery}
												visible={showFromSuggestions}
											/>
										</div>

										{/* Connector dots */}
										<div className="flex flex-col items-center gap-0.5 pl-1">
											<div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-neutral-600" />
											<div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-neutral-600" />
											<div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-neutral-600" />
										</div>

										{/* To */}
										<div
											className="relative"
											onClickCapture={(e) => e.stopPropagation()}
										>
											<label
												className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-neutral-400"
												htmlFor="drawer-to"
											>
												<div className="h-2 w-2 rounded-full bg-red-500" />
												To
											</label>
											<div className="relative">
												<Search
													className="absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
													size={14}
												/>
												<input
													autoComplete="off"
													className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pr-3 pl-8 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-500 dark:focus:bg-neutral-800 dark:focus:ring-blue-900/30"
													id="drawer-to"
													onChange={(e) => {
														setToQuery(e.target.value);
														setSelectedTo(null);
														onToSelect?.(null);
														setShowToSuggestions(true);
													}}
													onFocus={() => setShowToSuggestions(true)}
													placeholder="Search destination..."
													ref={toRef}
													type="text"
													value={toQuery}
												/>
											</div>
											<SuggestionList
												onSelect={handleToSelect}
												query={toQuery}
												visible={showToSuggestions}
											/>
										</div>

										<Button
											className="mt-2 h-11 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-600 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
											disabled={isRouteDisabled}
											onClick={handleFindRoute}
											type="button"
										>
											{isSearching ? (
												<>
													<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
													Finding routes...
												</>
											) : (
												<>
													<Navigation size={15} />
													Find Route
												</>
											)}
										</Button>

										{/* Divider */}
										<div className="flex items-center gap-3 pt-1">
											<div className="h-px flex-1 bg-gray-200 dark:bg-neutral-700" />
											<span className="text-xs text-gray-400 dark:text-neutral-500">
												or
											</span>
											<div className="h-px flex-1 bg-gray-200 dark:bg-neutral-700" />
										</div>

										{/* Board vehicle button */}
										<Button
											className="h-11 w-full rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
											onClick={handleGoToBoarding}
											type="button"
										>
											<Bus size={15} />
											I'm Boarding a Vehicle
										</Button>
									</div>
								</>
							)}
						</div>

						{/* ── Results panel ──────────────── */}
						<div
							className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${getSlideClass(view, "results", slideDirection)}`}
						>
							{route && (
								<RouteResultsPanel
									onBack={handleBack}
									onClose={handleClose}
									route={route}
								/>
							)}
						</div>

						{/* ── Boarding panel ──────────────── */}
						<div
							className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${getSlideClass(view, "boarding", slideDirection)}`}
						>
							<div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-neutral-700">
								<button
									aria-label="Go back"
									className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
									onClick={handleBackFromBoarding}
									type="button"
								>
									<ArrowLeft size={18} />
								</button>
								<div className="min-w-0 flex-1">
									<h2 className="font-semibold text-gray-900 dark:text-neutral-100">
										Board Vehicle
									</h2>
									<p className="text-xs text-gray-500 dark:text-neutral-400">
										Track your ride to help others
									</p>
								</div>
								<button
									aria-label="Close"
									className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
									onClick={handleClose}
									type="button"
								>
									<X size={18} />
								</button>
							</div>

							<div className="flex flex-col gap-4 overflow-y-auto px-4 py-4">
								{/* Vehicle type toggle */}
								<div>
									<p className="mb-2 text-xs font-medium text-gray-500 dark:text-neutral-400">
										Vehicle Type
									</p>
									<div className="flex gap-2">
										<button
											className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
												boardingType === "jutc"
													? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
													: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
											}`}
											onClick={() => setBoardingType("jutc")}
											type="button"
										>
											<Bus size={16} />
											JUTC Bus
										</button>
										<button
											className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
												boardingType === "taxi"
													? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
													: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
											}`}
											onClick={() => setBoardingType("taxi")}
											type="button"
										>
											<Car size={16} />
											Taxi
										</button>
									</div>
								</div>

								{/* License plate */}
								<div>
									<label
										className="mb-1 block text-xs font-medium text-gray-500 dark:text-neutral-400"
										htmlFor="license-plate"
									>
										License Plate Number
									</label>
									<input
										autoCapitalize="characters"
										autoComplete="off"
										className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-mono uppercase text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-500 dark:focus:bg-neutral-800 dark:focus:ring-blue-900/30"
										id="license-plate"
										maxLength={20}
										onChange={(e) => setLicensePlate(e.target.value)}
										placeholder="e.g. 1234AB"
										type="text"
										value={licensePlate}
									/>
								</div>

								{/* Route number — only for JUTC */}
								{boardingType === "jutc" && (
									<div>
										<label
											className="mb-1 block text-xs font-medium text-gray-500 dark:text-neutral-400"
											htmlFor="route-number"
										>
											Bus Route Number
										</label>
										<select
											className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-blue-500 dark:focus:bg-neutral-800 dark:focus:ring-blue-900/30"
											id="route-number"
											onChange={(e) => setRouteNumber(e.target.value)}
											value={routeNumber}
										>
											<option value="">Select route…</option>
											{JUTC_ROUTES.map((r) => (
												<option key={r.route} value={r.route}>
													{r.route} — {r.origin} → {r.destination}
												</option>
											))}
										</select>
									</div>
								)}

								{/* Info callout */}
								<div className="rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
									<p className="text-xs leading-relaxed text-blue-700 dark:text-blue-400">
										<Radio className="mr-1 inline -translate-y-px" size={12} />
										Your location will be shared anonymously while you ride,
										helping other commuters see live vehicle positions.
									</p>
								</div>

								<Button
									className="mt-1 h-11 w-full rounded-xl bg-green-600 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition-all hover:bg-green-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
									disabled={isBoardDisabled}
									onClick={handleStartTracking}
									type="button"
								>
									{isBoardingLoading ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
											Starting…
										</>
									) : (
										<>
											<Radio size={15} />
											Start Tracking
										</>
									)}
								</Button>
							</div>
						</div>

						{/* ── Tracking panel (compact bar) ──────────────── */}
						<div
							className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${getSlideClass(view, "tracking", slideDirection)}`}
						>
							<div className="flex items-center gap-3 px-4 py-3">
								{/* Live dot */}
								<div className="relative flex shrink-0">
									<span className="inline-flex h-3 w-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
								</div>

								{/* Vehicle + destination info */}
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">
										{boardingType === "jutc"
											? `JUTC Bus ${routeNumber}`
											: `Taxi ${licensePlate.toUpperCase()}`}
									</p>
									{selectedTo && (
										<p className="truncate text-xs text-gray-500 dark:text-neutral-400">
											To: {selectedTo.name}
										</p>
									)}
								</div>

								{/* Elapsed time */}
								<p className="shrink-0 font-mono text-lg font-bold text-green-600 dark:text-green-400">
									{formatElapsed(trackingElapsed)}
								</p>

								{/* Stop button */}
								<Button
									className="h-9 shrink-0 rounded-xl bg-red-500 px-3 text-xs font-semibold text-white shadow-md shadow-red-500/25 transition-all hover:bg-red-600 hover:shadow-lg"
									onClick={handleStopTracking}
									type="button"
								>
									<Square size={12} />
									Stop
								</Button>
							</div>
						</div>
					</div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}
