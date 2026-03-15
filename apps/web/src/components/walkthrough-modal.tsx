"use client";

import { Bus, Car, Navigation, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* ── Constants ────────────────────────────────────── */

const STORAGE_KEY = "oneandmove_walkthrough_seen";
const TOTAL_STEPS = 2;

/* ── Component ────────────────────────────────────── */

export default function WalkthroughModal() {
	const [step, setStep] = useState(0);
	const [visible, setVisible] = useState(false);
	const [requestingLocation, setRequestingLocation] = useState(false);

	useEffect(() => {
		try {
			const seen = localStorage.getItem(STORAGE_KEY);
			if (!seen) {
				// Small delay so the map has time to render beneath the overlay
				const timer = setTimeout(() => setVisible(true), 600);
				return () => clearTimeout(timer);
			}
		} catch {
			// SSR or storage blocked — silently skip
		}
	}, []);

	const dismiss = useCallback(() => {
		setVisible(false);
		try {
			localStorage.setItem(STORAGE_KEY, "1");
		} catch {
			/* storage blocked */
		}
	}, []);

	const handleNext = useCallback(async () => {
		if (step === 0) {
			// Request GPS permission before advancing to the legend step
			if ("geolocation" in navigator) {
				setRequestingLocation(true);
				try {
					await new Promise<GeolocationPosition>((resolve, reject) =>
						navigator.geolocation.getCurrentPosition(resolve, reject, {
							enableHighAccuracy: true,
							timeout: 10_000,
						})
					);
				} catch {
					// Permission denied or error — still advance so the user isn't stuck
				} finally {
					setRequestingLocation(false);
				}
			}
			setStep(1);
		} else if (step < TOTAL_STEPS - 1) {
			setStep((s) => s + 1);
		} else {
			dismiss();
		}
	}, [step, dismiss]);

	const handleBack = useCallback(() => {
		if (step > 0) setStep((s) => s - 1);
	}, [step]);

	if (!visible) return null;

	return (
		<div
			className="fixed inset-0 z-2000 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-label="Welcome walkthrough"
		>
			<div className="relative mx-4 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
				{/* Close */}
				<button
					aria-label="Skip walkthrough"
					className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
					onClick={dismiss}
					type="button"
				>
					<X size={18} />
				</button>

				{/* Step indicator dots */}
				<div className="flex justify-center gap-2 pt-6">
					{Array.from({ length: TOTAL_STEPS }, (_, i) => (
						<div
							key={i}
							className={`h-2 rounded-full transition-all duration-300 ${
								i === step
									? "w-6 bg-blue-500"
									: "w-2 bg-gray-200 dark:bg-neutral-700"
							}`}
						/>
					))}
				</div>

				{/* Content */}
				<div className="px-6 pt-5 pb-6">
					{step === 0 && <StepGps />}
					{step === 1 && <StepLegend />}
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-neutral-800">
					{step > 0 ? (
						<button
							className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
							onClick={handleBack}
							type="button"
						>
							Back
						</button>
					) : (
						<button
							className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
							onClick={dismiss}
							type="button"
						>
							Skip
						</button>
					)}

					<button
						className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-600 hover:shadow-lg disabled:opacity-60 disabled:shadow-none"
						disabled={requestingLocation}
						onClick={handleNext}
						type="button"
					>
						{requestingLocation && (
							<div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
						)}
						{requestingLocation
							? "Requesting…"
							: step === TOTAL_STEPS - 1
								? "Get Started"
								: "Next"}
					</button>
				</div>
			</div>
		</div>
	);
}

/* ── Step 1: GPS Permission ───────────────────────── */

function StepGps() {
	return (
		<div className="flex flex-col items-center text-center">
			{/* Icon */}
			<div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
				<Navigation className="text-blue-500" size={36} />
			</div>

			<h2 className="mb-2 font-bold text-xl text-gray-900 dark:text-neutral-100">
				Enable Location Access
			</h2>
			<p className="mb-4 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
				OneAndMove needs your GPS location to show nearby buses and taxis in
				real time. Your location stays <strong>private</strong> — it's only used
				on your device to display the map accurately.
			</p>
			<p className="text-xs text-gray-400 dark:text-neutral-500">
				You'll see a browser prompt asking for permission. Tap{" "}
				<strong>"Allow"</strong> to get the best experience.
			</p>
		</div>
	);
}

/* ── Step 2: Map Legend / Symbols ──────────────────── */

function StepLegend() {
	return (
		<div className="flex flex-col items-center">
			<h2 className="mb-1 font-bold text-xl text-gray-900 dark:text-neutral-100">
				Understanding the Map
			</h2>
			<p className="mb-5 text-center text-sm text-gray-500 dark:text-neutral-400">
				Here's what the icons and colours mean.
			</p>

			<div className="w-full space-y-3">
				{/* Bus */}
				<LegendRow
					icon={
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500">
							<Bus color="white" size={18} />
						</div>
					}
					title="JUTC Bus"
					description="Green icons represent JUTC public buses moving along their routes."
				/>

				{/* Taxi */}
				<LegendRow
					icon={
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-500">
							<Car color="white" size={18} />
						</div>
					}
					title="Private Taxi"
					description="White sedan icons show private taxis. Grey badges indicate taxi clusters."
				/>

				{/* Bus stop */}
				<LegendRow
					icon={
						<div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30">
							<div className="h-3 w-3 rounded-full bg-emerald-500" />
						</div>
					}
					title="Bus Stop"
					description="Green dots mark official JUTC bus stops."
				/>

				{/* Taxi stand */}
				<LegendRow
					icon={
						<div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/30">
							<div className="h-3 w-3 rounded-full bg-amber-500" />
						</div>
					}
					title="Taxi Stand"
					description="Amber dots mark known taxi pickup locations."
				/>

				{/* Clusters */}
				<LegendRow
					icon={
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-600">
							<span className="font-bold text-xs text-white">5+</span>
						</div>
					}
					title="Clusters"
					description="When zoomed out, nearby vehicles group into numbered badges. Zoom in to see them individually."
				/>

				{/* Route line */}
				<LegendRow
					icon={
						<div className="flex h-9 w-9 items-center justify-center">
							<div className="h-1 w-7 rounded-full bg-blue-500" />
						</div>
					}
					title="Route Line"
					description="The blue line shows your planned trip route between two locations."
				/>
			</div>
		</div>
	);
}

/* ── Shared legend row ────────────────────────────── */

function LegendRow({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-neutral-800/60">
			<div className="shrink-0">{icon}</div>
			<div className="min-w-0">
				<p className="font-semibold text-sm text-gray-800 dark:text-neutral-200">
					{title}
				</p>
				<p className="text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
					{description}
				</p>
			</div>
		</div>
	);
}
