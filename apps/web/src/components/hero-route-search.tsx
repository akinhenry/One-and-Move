"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Navigation, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LocationSuggestion } from "@/components/TripDrawer";
import { client } from "@/utils/orpc";

/* ── Inline suggestion list ──────────────────────── */

function SuggestionList({
	query,
	onSelect,
	visible,
}: {
	query: string;
	onSelect: (s: LocationSuggestion) => void;
	visible: boolean;
}) {
	const [debounced, setDebounced] = useState(query);
	useEffect(() => {
		const id = setTimeout(() => setDebounced(query), 350);
		return () => clearTimeout(id);
	}, [query]);

	const { data: suggestions = [], isFetching } = useQuery({
		queryKey: ["geocode", debounced],
		queryFn: () => client.geocode.search({ query: debounced }),
		enabled: visible && debounced.trim().length >= 2,
		staleTime: 60_000,
		placeholderData: (prev: LocationSuggestion[] | undefined) => prev,
	});

	if (!visible || query.trim().length < 2) return null;

	if (isFetching && suggestions.length === 0) {
		return (
			<div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-xl border border-slate-200 bg-white/95 px-3 py-3 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-[#111827]/95">
				<div className="flex items-center gap-2 text-slate-400 text-xs dark:text-slate-500">
					<div className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-blue-500 dark:border-slate-600 dark:border-t-blue-400" />
					Searching…
				</div>
			</div>
		);
	}

	if (suggestions.length === 0) return null;

	return (
		<div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-[#111827]/95">
			{suggestions.map((s: LocationSuggestion) => (
				<button
					className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 dark:hover:bg-slate-800"
					key={s.id}
					onMouseDown={(e) => {
						e.preventDefault();
						onSelect(s);
					}}
					type="button"
				>
					<MapPin
						className="mt-0.5 shrink-0 text-blue-400 dark:text-blue-500"
						size={14}
					/>
					<div className="min-w-0">
						<p className="truncate font-medium text-blue-900 text-sm dark:text-slate-100">
							{s.name}
						</p>
						<p className="truncate text-slate-500 text-xs dark:text-slate-400">
							{s.address}
						</p>
					</div>
				</button>
			))}
		</div>
	);
}

/* ── Main widget ──────────────────────────────────── */

interface HeroRouteSearchProps {
	onFromSelect?: (location: LocationSuggestion) => void;
	onToSelect?: (location: LocationSuggestion) => void;
}

export default function HeroRouteSearch({
	onFromSelect,
	onToSelect,
}: HeroRouteSearchProps = {}) {
	const router = useRouter();

	const [fromQuery, setFromQuery] = useState("");
	const [toQuery, setToQuery] = useState("");
	const [selectedFrom, setSelectedFrom] = useState<LocationSuggestion | null>(
		null
	);
	const [selectedTo, setSelectedTo] = useState<LocationSuggestion | null>(null);
	const [showFromSuggestions, setShowFromSuggestions] = useState(false);
	const [showToSuggestions, setShowToSuggestions] = useState(false);

	const fromRef = useRef<HTMLDivElement>(null);
	const toRef = useRef<HTMLDivElement>(null);

	// Close suggestion dropdowns on outside click
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
				setShowFromSuggestions(false);
			}
			if (toRef.current && !toRef.current.contains(e.target as Node)) {
				setShowToSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	const handleFromSelect = (s: LocationSuggestion) => {
		setSelectedFrom(s);
		setFromQuery(s.name);
		setShowFromSuggestions(false);
		onFromSelect?.(s);
	};

	const handleToSelect = (s: LocationSuggestion) => {
		setSelectedTo(s);
		setToQuery(s.name);
		setShowToSuggestions(false);
		onToSelect?.(s);
	};

	const handleSubmit = () => {
		const params = new URLSearchParams();
		if (selectedFrom) {
			params.set("fromName", selectedFrom.name);
			params.set("fromLat", String(selectedFrom.coords.lat));
			params.set("fromLng", String(selectedFrom.coords.lng));
		}
		if (selectedTo) {
			params.set("toName", selectedTo.name);
			params.set("toLat", String(selectedTo.coords.lat));
			params.set("toLng", String(selectedTo.coords.lng));
		}
		const qs = params.toString();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		router.push(`/map${qs ? `?${qs}` : ""}` as any);
	};

	const canSubmit =
		selectedFrom !== null ||
		selectedTo !== null ||
		fromQuery.trim().length >= 2 ||
		toQuery.trim().length >= 2;

	return (
		<div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-6 shadow-xl transition-colors duration-500 dark:border-slate-800 dark:bg-[#111827]">
			{/* From */}
			<div className="mb-4 relative" ref={fromRef}>
				<label
					className="mb-1.5 flex items-center gap-1.5 font-bold text-blue-900 text-sm dark:text-slate-200"
					htmlFor="hero-from"
				>
					<div className="h-2 w-2 rounded-full bg-green-500" />
					From
				</label>
				<div className="relative">
					<Search
						className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-slate-500"
						size={14}
					/>
					<input
						autoComplete="off"
						className="w-full rounded-lg border border-slate-300 bg-zinc-50 py-2.5 pr-3 pl-9 text-blue-900 placeholder-blue-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
						id="hero-from"
						onChange={(e) => {
							setFromQuery(e.target.value);
							setSelectedFrom(null);
							setShowFromSuggestions(true);
						}}
						onFocus={() => setShowFromSuggestions(true)}
						placeholder="e.g. Mona Campus"
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

			{/* To */}
			<div className="mb-5 relative" ref={toRef}>
				<label
					className="mb-1.5 flex items-center gap-1.5 font-bold text-blue-900 text-sm dark:text-slate-200"
					htmlFor="hero-to"
				>
					<div className="h-2 w-2 rounded-full bg-red-500" />
					To
				</label>
				<div className="relative">
					<Search
						className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-slate-500"
						size={14}
					/>
					<input
						autoComplete="off"
						className="w-full rounded-lg border border-slate-300 bg-zinc-50 py-2.5 pr-3 pl-9 text-blue-900 placeholder-blue-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
						id="hero-to"
						onChange={(e) => {
							setToQuery(e.target.value);
							setSelectedTo(null);
							setShowToSuggestions(true);
						}}
						onFocus={() => setShowToSuggestions(true)}
						placeholder="e.g. Downtown Kingston"
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

			<button
				className="mt-2 mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:focus:ring-offset-[#111827] dark:hover:bg-blue-400"
				disabled={!canSubmit}
				onClick={handleSubmit}
				type="button"
			>
				<Navigation size={16} />
				Show me the best route
				<ArrowRight size={16} />
			</button>
		</div>
	);
}
