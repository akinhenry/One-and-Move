"use client";

import { ArrowRight, Car, Clock, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import WebMap from "@/components/Map";
import Navigation from "@/components/navigation";

export default function Home() {
	return (
		<div className="flex-1 bg-white pb-20 font-sans text-blue-600 transition-colors duration-500 selection:bg-blue-600 selection:text-white dark:bg-transparent dark:text-blue-300">
			{/* Navigation */}
			<Navigation />

			{/* Hero Section */}
			<main className="mx-auto max-w-7xl items-center px-8 pt-16 lg:grid lg:grid-cols-2 lg:gap-16">
				<div>
					<h1 className="mb-6 font-bold text-5xl text-blue-900 leading-tight tracking-tight md:text-6xl">
						Know the true
            arrival time.
					</h1>
					<p className="mb-10 max-w-lg text-blue-800/80 text-lg leading-relaxed">
						One and Move uses real-time location tracking to detect the exact
						location of JUTC buses and private taxis, so you can commute securely
						and safely.
					</p>

					<div className="mb-16 flex flex-wrap items-center gap-4">
						<Link
							className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
							href="/map"
						>
							<MapIcon size={20} />
							Open Map
						</Link>
						<Link
							className="flex items-center gap-2 rounded-lg px-6 py-3 font-bold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-800/50"
							href="#how-it-works"
						>
							How it works
							<ArrowRight size={20} />
						</Link>
					</div>

					<div className="grid max-w-lg grid-cols-3 gap-8 border-blue-600/30 border-t pt-8 dark:border-blue-500/20">
						<div>
							<div className="mb-1 text-blue-800/80 text-sm dark:text-slate-400">
								Route Accuracy
							</div>
							<div className="font-bold text-3xl text-blue-900 dark:text-slate-100">
								95%
							</div>
						</div>
						<div>
							<div className="mb-1 text-blue-800/80 text-sm dark:text-slate-400">
								Active Vehicles
							</div>
							<div className="font-bold text-3xl text-blue-900 dark:text-slate-100">
								120+
							</div>
						</div>
						<div>
							<div className="mb-1 text-blue-800/80 text-sm dark:text-slate-400">
								Avg Refresh
							</div>
							<div className="font-bold text-3xl text-blue-900 dark:text-slate-100">
								1.5s
							</div>
						</div>
					</div>
				</div>

				{/* Right side Visual (Interactive Map) */}
				<div className="mt-12 flex w-full flex-col items-center justify-center gap-6 lg:mt-0 lg:h-full">
					<div className="relative flex aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-blue-200 bg-zinc-100 shadow-xl dark:border-slate-800 dark:bg-slate-900">
						<WebMap />
					</div>

					{/* Interactive Route Menu Strip */}
					<div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-6 shadow-xl transition-colors duration-500 dark:border-slate-800 dark:bg-[#111827]">
						<div className="mb-4">
							<label className="mb-1.5 block font-bold text-blue-900 text-sm dark:text-slate-200">
								From
							</label>
							<input
								className="w-full rounded-lg border border-slate-300 bg-zinc-50 px-4 py-2.5 text-blue-900 placeholder-blue-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
								defaultValue="Mona Campus"
							/>
						</div>
						<div className="mb-4">
							<label className="mb-1.5 block font-bold text-blue-900 text-sm dark:text-slate-200">
								To
							</label>
							<input
								className="w-full rounded-lg border border-slate-300 bg-zinc-50 px-4 py-2.5 text-blue-900 placeholder-blue-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
								defaultValue="Downtown Kingston"
							/>
						</div>

						<button
							className="mt-2 mb-2 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-blue-500 dark:focus:ring-offset-[#111827] dark:hover:bg-blue-400"
							type="button"
						>
							Show me the best route
						</button>
					</div>
				</div>
			</main>

			{/* Features Section */}
			<section className="mx-auto max-w-7xl px-8 pt-32" id="features">
				<h2 className="mb-4 font-bold text-4xl text-blue-900 dark:text-slate-100">
					Features
				</h2>
				<p className="mb-12 max-w-3xl border-blue-200 border-b pb-12 font-medium text-blue-800/90 text-xl dark:border-slate-800 dark:text-blue-200">
					Everything you need to bring an intelligent transit map into your
					hands — without guesswork.
				</p>

				<div className="grid gap-12 md:grid-cols-3">
					<div>
						<div className="mb-4 text-blue-600 dark:text-blue-400">
							<MapIcon className="opacity-90" size={26} />
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-xl dark:text-slate-100">
							Live Map Tracking
						</h3>
						<p className="font-medium text-base text-blue-800/80 leading-relaxed dark:text-slate-300">
							Watch JUTC buses and robot taxis move on a live map, checking
							their availability and proximity in real-time.
						</p>
					</div>
					<div>
						<div className="mb-4 text-blue-600 dark:text-blue-400">
							<Clock className="opacity-90" size={26} />
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-xl dark:text-slate-100">
							Wait Time Estimates
						</h3>
						<p className="font-medium text-base text-blue-800/80 leading-relaxed dark:text-slate-300">
							Eliminate uncertainty with arrival predictions based on actual
							road conditions, speeds, and live geolocation.
						</p>
					</div>
					<div>
						<div className="mb-4 text-blue-600 dark:text-blue-400">
							<Car className="opacity-90" size={26} />
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-xl dark:text-slate-100">
							Vehicle Specifics
						</h3>
						<p className="font-medium text-base text-blue-800/80 leading-relaxed dark:text-slate-300">
							Filter tracking based on your needs—know instantly if your next
							ride is a public bus or an autonomous taxi.
						</p>
					</div>
				</div>
			</section>

			{/* Footer / Explanation Section */}
			<section className="mx-auto max-w-7xl px-8 pt-32" id="how-it-works">
				<div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-8 text-blue-900 shadow-xl transition-colors duration-500 md:p-12 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100">
					<h2 className="mb-6 font-black text-3xl text-blue-900 uppercase tracking-tight md:text-5xl dark:text-slate-100">
						HOW One and move helps you find taxies and jutc
					</h2>
					<div className="max-w-4xl space-y-4 border-blue-600 border-l-4 pl-6 dark:border-blue-500">
						<p className="font-semibold text-blue-800/90 text-lg leading-relaxed md:text-xl dark:text-blue-200">
							One & Move connects directly with JUTC transit networks and robot
							taxi locators to continuously map vehicle fleets onto an
							interactive view.
						</p>
						<p className="font-semibold text-blue-800/90 text-lg leading-relaxed md:text-xl dark:text-blue-200">
							With our system, you aren't guessing when your ride will show up.
							You simply open the app, look at your targeted route, and track
							exactly how far away your bus or taxi is. We provide the control
							and transparency you need to master your daily commute.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
