"use client";

import { JUTC_ROUTES } from "@One-and-Move/db/data/jutc-routes";
import { Button } from "@One-and-Move/ui/components/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@One-and-Move/ui/components/drawer";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Bus,
	Car,
	ChevronDown,
	ChevronRight,
	CircleStop,
	Clock,
	DollarSign,
	Footprints,
	MapPin,
	Navigation,
	Play,
	Radio,
	Route,
	Search,
	Square,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
	duration: number;
	from: string;
	geometry: LatLng[];
	legNumber: number;
	mode: "walk" | "jutc" | "taxi";
	to: string;
	type: "walk" | "jutc" | "robot_taxi";
	vehicleName: string;
}

export interface TripRoute {
	destination: string;
	legs: TripLeg[];
	totalCost: number;
	totalDuration: number;
}

interface TripDrawerProps {
	activeTrip?: { legs: TripLeg[]; currentLegIndex: number } | null;
	initialFrom?: LocationSuggestion | null;
	initialTo?: LocationSuggestion | null;
	onCancelTrip?: () => void;
	onFromSelect?: (location: LocationSuggestion | null) => void;
	onRouteFound?: (route: TripRoute | null) => void;
	onStartTrip?: (route: TripRoute) => void;
	onToSelect?: (location: LocationSuggestion | null) => void;
}

/* ── Route fetcher ─────────────────────────────── */

async function fetchRoutes(
	from: LocationSuggestion,
	to: LocationSuggestion
): Promise<TripRoute[]> {
	const result = await client.routes.getBestRoute({
		originLat: from.coords.lat,
		originLng: from.coords.lng,
		destinationLat: to.coords.lat,
		destinationLng: to.coords.lng,
	});

	return result.map((r) => ({
		destination: to.name,
		legs: r.legs.map((leg) => ({
			legNumber: leg.legNumber,
			from: leg.from,
			to: leg.to,
			mode: leg.mode as "walk" | "jutc" | "taxi",
			type:
				leg.mode === "taxi"
					? ("robot_taxi" as const)
					: (leg.mode as "walk" | "jutc"),
			vehicleName: leg.vehicleName,
			cost: leg.cost,
			duration: leg.duration,
			geometry: leg.geometry,
		})),
		totalCost: r.totalCost,
		totalDuration: r.totalDuration,
	}));
}

/* ── Suggestion list ───────────────────────────── */

function SuggestionList({
	query,
	onSelect,
	visible,
}: {
	query: string;
	onSelect: (s: LocationSuggestion) => void;
	visible: boolean;
}) {
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

	if (!visible || query.trim().length < 2) return null;

	if (isFetching && suggestions.length === 0) {
		return (
			<div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-xl border border-border bg-popover px-3 py-3 shadow-lg">
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					<div className="h-3 w-3 animate-spin rounded-full border border-border border-t-primary" />
					Searching…
				</div>
			</div>
		);
	}

	if (suggestions.length === 0) return null;

	return (
		<div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
			{suggestions.map((s: LocationSuggestion) => (
				<button
					className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted"
					key={s.id}
					onMouseDown={(e) => {
						e.preventDefault();
						onSelect(s);
					}}
					type="button"
				>
					<MapPin className="mt-0.5 shrink-0 text-muted-foreground" size={14} />
					<div className="min-w-0">
						<p className="truncate font-medium text-foreground text-sm">
							{s.name}
						</p>
						<p className="truncate text-muted-foreground text-xs">
							{s.address}
						</p>
					</div>
				</button>
			))}
		</div>
	);
}

/* ── Leg icon/color helpers ────────────────────── */

function getLegIcon(mode: string) {
	if (mode === "jutc") return Bus;
	if (mode === "taxi") return Car;
	return Footprints;
}

function getLegColor(mode: string) {
	if (mode === "jutc") return "bg-emerald-500";
	if (mode === "taxi") return "bg-amber-500";
	return "bg-muted-foreground";
}

/* ── Drawer view type ──────────────────────────── */

type DrawerView = "search" | "results" | "boarding" | "tracking" | "navigating";

/* ── Main component ────────────────────────────── */

export default function TripDrawer({
	activeTrip,
	initialFrom,
	initialTo,
	onCancelTrip,
	onFromSelect,
	onToSelect,
	onRouteFound,
	onStartTrip,
}: TripDrawerProps) {
	const [open, setOpen] = useState(false);
	const [view, setView] = useState<DrawerView>("search");

	/* Search state */
	const [fromQuery, setFromQuery] = useState(initialFrom?.name ?? "");
	const [toQuery, setToQuery] = useState(initialTo?.name ?? "");
	const [selectedFrom, setSelectedFrom] = useState<LocationSuggestion | null>(
		initialFrom ?? null
	);
	const [selectedTo, setSelectedTo] = useState<LocationSuggestion | null>(
		initialTo ?? null
	);
	const [showFromSuggestions, setShowFromSuggestions] = useState(false);
	const [showToSuggestions, setShowToSuggestions] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [route, setRoute] = useState<TripRoute | null>(null);

	/* Boarding state */
	const [boardingType, setBoardingType] = useState<"jutc" | "taxi">("jutc");
	const [licensePlate, setLicensePlate] = useState("");
	const [routeNumber, setRouteNumber] = useState("");
	const [isBoardingLoading, setIsBoardingLoading] = useState(false);

	/* Tracking state */
	const [liveVehicleId, setLiveVehicleId] = useState<string | null>(null);
	const [trackingElapsed, setTrackingElapsed] = useState(0);
	const [lastPosition, setLastPosition] = useState<LatLng | null>(null);
	const [trackingMinimized, setTrackingMinimized] = useState(false);
	const watchIdRef = useRef<number | null>(null);
	const trackingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const toRef = useRef<HTMLInputElement>(null);

	/* ── Global click to dismiss suggestions ───── */
	useEffect(() => {
		const handleClick = () => {
			setShowFromSuggestions(false);
			setShowToSuggestions(false);
		};
		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, []);

	/* ── Cleanup geolocation & timer on unmount ── */
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

	/* ── Jump to navigating view when active trip present ── */
	useEffect(() => {
		if (open && activeTrip) {
			setView("navigating");
		}
	}, [open, activeTrip]);

	/* ── Handlers ──────────────────────────────── */

	const handleFromSelect = useCallback(
		(suggestion: LocationSuggestion) => {
			setSelectedFrom(suggestion);
			setFromQuery(suggestion.name);
			setShowFromSuggestions(false);
			onFromSelect?.(suggestion);
		},
		[onFromSelect]
	);

	const handleToSelect = useCallback(
		(suggestion: LocationSuggestion) => {
			setSelectedTo(suggestion);
			setToQuery(suggestion.name);
			setShowToSuggestions(false);
			onToSelect?.(suggestion);
		},
		[onToSelect]
	);

	const handleFindRoute = useCallback(async () => {
		if (!selectedFrom || !selectedTo) return;
		setIsSearching(true);
		try {
			const routes = await fetchRoutes(selectedFrom, selectedTo);
			const best = routes[0] ?? null;
			setRoute(best);
			onRouteFound?.(best);
			setView("results");
		} catch {
			/* stay on search */
		} finally {
			setIsSearching(false);
		}
	}, [selectedFrom, selectedTo, onRouteFound]);

	const handleBack = useCallback(() => {
		setView("search");
		setRoute(null);
		onRouteFound?.(null);
	}, [onRouteFound]);

	const handleStartTripNav = useCallback(() => {
		if (!route) return;
		onStartTrip?.(route);
		setView("navigating");
	}, [route, onStartTrip]);

	const handleCancelTripNav = useCallback(() => {
		onCancelTrip?.();
		setView("results");
	}, [onCancelTrip]);

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
			onFromSelect?.(null);
			onToSelect?.(null);
			onRouteFound?.(null);
		}, 350);
	}, [onFromSelect, onToSelect, onRouteFound]);

	const handleGoToBoarding = useCallback(() => {
		setView("boarding");
	}, []);

	const handleBackFromBoarding = useCallback(() => {
		setView("search");
	}, []);

	const handleStartTracking = useCallback(async () => {
		if (!licensePlate.trim()) return;
		if (boardingType === "jutc" && !routeNumber) return;

		setIsBoardingLoading(true);
		try {
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

			const watchId = navigator.geolocation.watchPosition(
				(pos) => {
					const lat = pos.coords.latitude;
					const lng = pos.coords.longitude;
					setLastPosition({ lat, lng });

					if (result.id) {
						client.crowdsource
							.updateLocation({
								liveVehicleId: result.id,
								lat,
								lng,
								heading: pos.coords.heading ?? undefined,
								speed: pos.coords.speed ?? undefined,
							})
							.catch(() => {});
					}
				},
				() => {},
				{ enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
			);
			watchIdRef.current = watchId;

			const timer = setInterval(() => {
				setTrackingElapsed((prev) => prev + 1);
			}, 1000);
			trackingTimerRef.current = timer;

			setView("tracking");
		} catch {
			/* handle geolocation / API error */
		} finally {
			setIsBoardingLoading(false);
		}
	}, [boardingType, licensePlate, routeNumber]);

	const handleStopTracking = useCallback(async () => {
		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
		}
		if (trackingTimerRef.current !== null) {
			clearInterval(trackingTimerRef.current);
			trackingTimerRef.current = null;
		}
		if (liveVehicleId) {
			try {
				await client.crowdsource.stopTracking({ liveVehicleId });
			} catch {
				/* best effort */
			}
		}
		setLiveVehicleId(null);
		setTrackingElapsed(0);
		setLastPosition(null);
		setTrackingMinimized(false);
		setLicensePlate("");
		setRouteNumber("");
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

	/* ── Allow closing drawer for all views ── */
	const canClose = true;

	const handleOpenChange = useCallback((nextOpen: boolean) => {
		if (nextOpen) {
			setOpen(true);
		} else {
			// Just close without clearing state
			setOpen(false);
		}
	}, []);

	/* ── Trigger button (always rendered) ──────── */
	const triggerButton = (
		<DrawerTrigger asChild>
			<button
				aria-label={activeTrip ? "View active trip" : "Open trip planner"}
				className={`absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-xl backdrop-blur-xl transition-all active:scale-95 ${
					activeTrip
						? "border-green-400/60 bg-green-500 text-white hover:bg-green-600 dark:border-green-500/60 dark:bg-green-600"
						: "border-border bg-background/90 text-foreground hover:bg-background hover:shadow-2xl"
				}`}
				style={{ zIndex: 1002 }}
				type="button"
			>
				<div
					className={`flex h-7 w-7 items-center justify-center rounded-full ${
						activeTrip ? "bg-white/25" : "bg-blue-500"
					}`}
				>
					<Navigation color="white" size={13} />
				</div>
				{activeTrip
					? `Active Trip · Leg ${activeTrip.currentLegIndex + 1}/${activeTrip.legs.length}`
					: "Plan a Trip"}
			</button>
		</DrawerTrigger>
	);

	/* ── Active trip pill with stop button (when navigating) ── */
	const activeTripPill =
		activeTrip && route ? (
			<div
				className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-green-400/60 bg-green-500 px-4 py-2.5 shadow-xl backdrop-blur-xl"
				style={{ zIndex: 1002 }}
			>
				<DrawerTrigger asChild>
					<button
						aria-label="View active trip details"
						className="flex items-center gap-2 text-white transition-opacity hover:opacity-90"
						type="button"
					>
						<div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
							<Navigation color="white" size={11} />
						</div>
						<div className="flex flex-col items-start gap-0.5">
							<span className="text-xs font-semibold leading-none">
								{activeTrip.legs[activeTrip.currentLegIndex]?.to ?? "Next stop"}
							</span>
							<span className="text-[10px] leading-none text-white/80">
								Leg {activeTrip.currentLegIndex + 1}/{activeTrip.legs.length}
							</span>
						</div>
					</button>
				</DrawerTrigger>
				<div className="mx-1 h-4 w-px bg-white/30" />
				<button
					aria-label="Stop trip"
					className="flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/30"
					onClick={(e) => {
						e.stopPropagation();
						handleCancelTripNav();
					}}
					type="button"
				>
					<CircleStop size={12} />
					Stop
				</button>
			</div>
		) : null;

	/* ── Tracking pill (when broadcasting location) ── */
	const trackingPill = (
		<div
			className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-emerald-400/60 bg-emerald-500 px-4 py-2.5 shadow-xl backdrop-blur-xl"
			style={{ zIndex: 1002 }}
		>
			<DrawerTrigger asChild>
				<button
					aria-label="View tracking details"
					className="flex items-center gap-2 text-white transition-opacity hover:opacity-90"
					type="button"
				>
					<div className="relative flex h-6 w-6 items-center justify-center">
						<span className="inline-flex h-6 w-6 animate-ping rounded-full bg-white/40 opacity-75" />
						<span className="absolute inline-flex h-3 w-3 rounded-full bg-white" />
					</div>
					<div className="flex flex-col items-start gap-0.5">
						<span className="text-xs font-semibold leading-none">
							{boardingType === "jutc"
								? `JUTC ${routeNumber}`
								: `Taxi ${licensePlate.toUpperCase()}`}
						</span>
						<span className="text-[10px] leading-none text-white/80">
							{formatElapsed(trackingElapsed)} elapsed
						</span>
					</div>
				</button>
			</DrawerTrigger>
			<div className="mx-1 h-4 w-px bg-white/30" />
			<button
				aria-label="Stop tracking"
				className="flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/30"
				onClick={(e) => {
					e.stopPropagation();
					handleStopTracking();
				}}
				type="button"
			>
				<Square size={12} />
				Stop
			</button>
		</div>
	);

	/* ── Render the correct drawer content ─────── */
	const renderContent = () => {
		/* ── SEARCH ─────────────────────────────── */
		if (view === "search") {
			return (
				<DrawerContent
					className="bg-background/95 backdrop-blur-xl"
					style={{ zIndex: 1011 }}
				>
					<DrawerHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
									<Route color="white" size={15} />
								</div>
								<div>
									<DrawerTitle>Start Trip</DrawerTitle>
									<DrawerDescription>Find the best route</DrawerDescription>
								</div>
							</div>
							<DrawerClose asChild>
								<button
									aria-label="Close trip planner"
									className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									type="button"
								>
									<X size={18} />
								</button>
							</DrawerClose>
						</div>
					</DrawerHeader>

					{/* Search body */}
					<div className="flex flex-col gap-3 overflow-y-auto px-4 pb-6">
						{/* From */}
						<div
							className="relative"
							onClickCapture={(e) => e.stopPropagation()}
						>
							<label
								className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
								htmlFor="drawer-from"
							>
								<div className="h-2 w-2 rounded-full bg-emerald-500" />
								From
							</label>
							<div className="relative">
								<Search
									className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
									size={14}
								/>
								<input
									autoComplete="off"
									className="h-10 w-full rounded-xl border border-input bg-muted pr-3 pl-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
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
							<div className="h-1 w-1 rounded-full bg-border" />
							<div className="h-1 w-1 rounded-full bg-border" />
							<div className="h-1 w-1 rounded-full bg-border" />
						</div>

						{/* To */}
						<div
							className="relative"
							onClickCapture={(e) => e.stopPropagation()}
						>
							<label
								className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
								htmlFor="drawer-to"
							>
								<div className="h-2 w-2 rounded-full bg-destructive" />
								To
							</label>
							<div className="relative">
								<Search
									className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
									size={14}
								/>
								<input
									autoComplete="off"
									className="h-10 w-full rounded-xl border border-input bg-muted pr-3 pl-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
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

						{/* Find route */}
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
							<div className="h-px flex-1 bg-border" />
							<span className="text-xs text-muted-foreground">or</span>
							<div className="h-px flex-1 bg-border" />
						</div>

						{/* Board vehicle */}
						<Button
							className="h-11 w-full rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
							onClick={handleGoToBoarding}
							type="button"
						>
							<Bus size={15} />
							I'm Boarding a Vehicle
						</Button>
					</div>
				</DrawerContent>
			);
		}

		/* ── RESULTS ────────────────────────────── */
		if (view === "results" && route) {
			return (
				<DrawerContent
					className="max-h-[70dvh] bg-background/95 backdrop-blur-xl"
					style={{ zIndex: 1011 }}
				>
					{/* Header with back */}
					<DrawerHeader className="border-b border-border pb-3">
						<div className="flex items-center gap-2">
							<button
								aria-label="Go back"
								className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
								onClick={handleBack}
								type="button"
							>
								<ArrowLeft size={18} />
							</button>
							<div className="min-w-0 flex-1">
								<DrawerTitle className="truncate text-base">
									Trip to {route.destination}
								</DrawerTitle>
								<DrawerDescription>
									{route.legs.length} {route.legs.length === 1 ? "leg" : "legs"}{" "}
									· Optimal route
								</DrawerDescription>
							</div>
							<DrawerClose asChild>
								<button
									aria-label="Close"
									className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									type="button"
								>
									<X size={18} />
								</button>
							</DrawerClose>
						</div>
					</DrawerHeader>

					{/* Legs timeline */}
					<div className="flex-1 overflow-y-auto px-4 py-3">
						<div className="space-y-0">
							{route.legs.map((leg, index) => {
								const mode =
									leg.mode ?? (leg.type === "jutc" ? "jutc" : "taxi");
								const isWalk = mode === "walk";
								const isLast = index === route.legs.length - 1;
								const LegIcon = getLegIcon(mode);

								return (
									<div className="relative flex gap-3" key={leg.legNumber}>
										<div className="flex flex-col items-center">
											<div
												className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${getLegColor(mode)}`}
											>
												<LegIcon color="white" size={14} />
											</div>
											{!isLast && (
												<div className="my-1 w-0.5 flex-1 rounded-full bg-border" />
											)}
										</div>
										<div
											className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-4"}`}
										>
											<div className="flex items-start justify-between">
												<div className="min-w-0">
													<p className="font-medium text-muted-foreground text-xs">
														Leg {leg.legNumber}
													</p>
													<p className="truncate font-semibold text-foreground text-sm">
														{leg.vehicleName}
													</p>
												</div>
												<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
													{isWalk
														? "Free"
														: `JMD $${leg.cost.toLocaleString()}`}
												</span>
											</div>
											<p className="mt-0.5 text-muted-foreground text-xs">
												{leg.from} → {leg.to}
											</p>
											<p className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
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
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
								<MapPin color="white" size={14} />
							</div>
							<p className="font-medium text-foreground text-sm">
								Arrive at {route.destination}
							</p>
						</div>
					</div>

					{/* Summary footer */}
					<DrawerFooter className="border-t border-border">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-1.5">
									<Clock className="text-muted-foreground" size={14} />
									<span className="font-semibold text-foreground text-sm">
										{route.totalDuration} min
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<DollarSign className="text-muted-foreground" size={14} />
									<span className="font-semibold text-foreground text-sm">
										JMD ${route.totalCost.toLocaleString()}
									</span>
								</div>
							</div>
						</div>
						<Button
							className="h-11 w-full rounded-xl bg-green-600 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition-all hover:bg-green-700 hover:shadow-lg"
							onClick={handleStartTripNav}
							type="button"
						>
							<Play size={15} />
							Start Trip
						</Button>
					</DrawerFooter>
				</DrawerContent>
			);
		}

		/* ── NAVIGATING ─────────────────────────── */
		if (view === "navigating" && activeTrip && route) {
			const currentLeg = activeTrip.legs[activeTrip.currentLegIndex];
			if (!currentLeg) return null;

			const { mode } = currentLeg;
			const isWalk = mode === "walk";
			const isBus = mode === "jutc";
			const LegIcon = getLegIcon(mode);
			const remainingLegs = activeTrip.legs.slice(
				activeTrip.currentLegIndex + 1
			);
			const remainingDuration =
				remainingLegs.reduce((s, l) => s + l.duration, 0) + currentLeg.duration;

			return (
				<DrawerContent
					className="max-h-[70dvh] bg-background/95 backdrop-blur-xl"
					style={{ zIndex: 1011 }}
				>
					{/* Current leg header */}
					<DrawerHeader className="border-b border-border pb-3">
						<div className="flex items-center gap-3">
							<div
								className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${getLegColor(mode)}`}
							>
								<LegIcon color="white" size={14} />
							</div>
							<div className="min-w-0 flex-1">
								<DrawerTitle className="text-sm">
									{isWalk ? "Walk" : currentLeg.vehicleName}
								</DrawerTitle>
								<DrawerDescription className="text-xs">
									{currentLeg.from} → {currentLeg.to}
								</DrawerDescription>
							</div>
							<span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 font-mono font-semibold text-blue-700 text-xs dark:bg-blue-900/40 dark:text-blue-400">
								Leg {activeTrip.currentLegIndex + 1}/{activeTrip.legs.length}
							</span>
						</div>
					</DrawerHeader>

					{/* Detail */}
					<div className="flex-1 overflow-y-auto px-4 py-3">
						<div className="rounded-xl border border-border bg-muted/50 p-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Clock className="text-muted-foreground" size={14} />
									<span className="font-medium text-foreground text-sm">
										~{currentLeg.duration} min
									</span>
								</div>
								{!isWalk && (
									<span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
										JMD ${currentLeg.cost.toLocaleString()}
									</span>
								)}
							</div>
							{!isWalk && (
								<p className="mt-2 text-muted-foreground text-xs">
									{isBus ? "Board the bus at" : "Take the taxi at"}{" "}
									<span className="font-medium text-foreground">
										{currentLeg.from}
									</span>
								</p>
							)}
							{isWalk && (
								<p className="mt-2 text-muted-foreground text-xs">
									Walk to{" "}
									<span className="font-medium text-foreground">
										{currentLeg.to}
									</span>
								</p>
							)}
						</div>

						{/* Upcoming */}
						{remainingLegs.length > 0 && (
							<div className="mt-3">
								<p className="mb-2 font-medium text-muted-foreground text-xs">
									Up next
								</p>
								<div className="space-y-1.5">
									{remainingLegs.map((leg) => {
										const NextIcon = getLegIcon(leg.mode);
										return (
											<div
												className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5"
												key={leg.legNumber}
											>
												<NextIcon className="text-muted-foreground" size={12} />
												<span className="flex-1 truncate text-muted-foreground text-xs">
													{leg.vehicleName} → {leg.to}
												</span>
												<ChevronRight className="text-border" size={12} />
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* Footer */}
					<DrawerFooter className="border-t border-border">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<Clock className="text-muted-foreground" size={14} />
								<span className="font-semibold text-foreground text-sm">
									~{remainingDuration} min remaining
								</span>
							</div>
							<div className="flex items-center gap-1.5">
								<DollarSign className="text-muted-foreground" size={14} />
								<span className="font-semibold text-foreground text-sm">
									JMD ${route.totalCost.toLocaleString()}
								</span>
							</div>
						</div>
						<Button
							className="h-10 w-full rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground shadow-md transition-all hover:bg-destructive/90 hover:shadow-lg"
							onClick={handleCancelTripNav}
							type="button"
						>
							<CircleStop size={14} />
							Cancel Trip
						</Button>
					</DrawerFooter>
				</DrawerContent>
			);
		}

		/* ── BOARDING ───────────────────────────── */
		if (view === "boarding") {
			return (
				<DrawerContent
					className="max-h-[80dvh] bg-background/95 backdrop-blur-xl"
					style={{ zIndex: 1011 }}
				>
					<DrawerHeader className="border-b border-border pb-3">
						<div className="flex items-center gap-2">
							<button
								aria-label="Go back"
								className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
								onClick={handleBackFromBoarding}
								type="button"
							>
								<ArrowLeft size={18} />
							</button>
							<div className="min-w-0 flex-1">
								<DrawerTitle>Board Vehicle</DrawerTitle>
								<DrawerDescription>
									Track your ride to help others
								</DrawerDescription>
							</div>
							<DrawerClose asChild>
								<button
									aria-label="Close"
									className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									type="button"
								>
									<X size={18} />
								</button>
							</DrawerClose>
						</div>
					</DrawerHeader>

					<div className="flex flex-col gap-4 overflow-y-auto px-4 py-4">
						{/* Vehicle type toggle */}
						<div>
							<p className="mb-2 text-xs font-medium text-muted-foreground">
								Vehicle Type
							</p>
							<div className="flex gap-2">
								<button
									className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
										boardingType === "jutc"
											? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
											: "border-input bg-muted text-muted-foreground hover:bg-accent"
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
											: "border-input bg-muted text-muted-foreground hover:bg-accent"
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
								className="mb-1 block text-xs font-medium text-muted-foreground"
								htmlFor="license-plate"
							>
								License Plate Number
							</label>
							<input
								autoCapitalize="characters"
								autoComplete="off"
								className="h-10 w-full rounded-xl border border-input bg-muted px-3 font-mono text-sm uppercase text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
								id="license-plate"
								maxLength={20}
								onChange={(e) => setLicensePlate(e.target.value)}
								placeholder="e.g. 1234AB"
								type="text"
								value={licensePlate}
							/>
						</div>

						{/* Route number — JUTC only */}
						{boardingType === "jutc" && (
							<div>
								<label
									className="mb-1 block text-xs font-medium text-muted-foreground"
									htmlFor="route-number"
								>
									Bus Route Number
								</label>
								<select
									className="h-10 w-full rounded-xl border border-input bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
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
								Your location will be shared anonymously while you ride, helping
								other commuters see live vehicle positions.
							</p>
						</div>

						{/* Start tracking */}
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
				</DrawerContent>
			);
		}

		/* ── TRACKING (compact bar) ─────────────── */
		if (view === "tracking") {
			return (
				<DrawerContent
					className="bg-background/95 backdrop-blur-xl"
					onClick={() => {
						if (trackingMinimized) setTrackingMinimized(false);
					}}
					style={{ zIndex: 1011 }}
				>
					<DrawerTitle className="sr-only">Live Tracking</DrawerTitle>
					<DrawerDescription className="sr-only">
						Currently broadcasting your position
					</DrawerDescription>
					<div
						className={`flex items-center gap-3 px-4 py-2 transition-opacity duration-200 ${
							trackingMinimized
								? "pointer-events-none opacity-0"
								: "opacity-100"
						}`}
					>
						{/* Live dot */}
						<div className="relative flex shrink-0">
							<span className="inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
						</div>

						{/* Vehicle + destination info */}
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold text-foreground">
								{boardingType === "jutc"
									? `JUTC Bus ${routeNumber}`
									: `Taxi ${licensePlate.toUpperCase()}`}
							</p>
							{selectedTo && (
								<p className="truncate text-xs text-muted-foreground">
									To: {selectedTo.name}
								</p>
							)}
						</div>

						{/* Elapsed time */}
						<p className="shrink-0 font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
							{formatElapsed(trackingElapsed)}
						</p>

						{/* Minimize */}
						<button
							aria-label="Minimize tracking bar"
							className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
							onClick={() => setTrackingMinimized(true)}
							type="button"
						>
							<ChevronDown size={16} />
						</button>

						{/* Stop */}
						<Button
							className="h-9 shrink-0 rounded-xl bg-destructive px-3 text-xs font-semibold text-destructive-foreground shadow-md transition-all hover:bg-destructive/90 hover:shadow-lg"
							onClick={handleStopTracking}
							type="button"
						>
							<Square size={12} />
							Stop
						</Button>
					</div>
				</DrawerContent>
			);
		}

		return null;
	};

	return (
		<Drawer
			modal={false}
			onOpenChange={handleOpenChange}
			open={open}
			shouldScaleBackground={false}
		>
			{view === "navigating" && activeTrip
				? activeTripPill
				: view === "tracking"
					? trackingPill
					: triggerButton}
			{renderContent()}
		</Drawer>
	);
}
