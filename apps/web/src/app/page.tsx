"use client";

import { ArrowRight, Car, Clock, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import HeroRouteSearch from "@/components/hero-route-search";
import WebMap from "@/components/Map";
import Navigation from "@/components/navigation";

export default function Home() {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	return (
		<div className="flex-1 bg-white pb-20 font-sans text-blue-600 transition-colors duration-500 selection:bg-blue-600 selection:text-white dark:bg-transparent dark:text-blue-300">
			{/* Navigation */}
			<Navigation />

			{/* Hero Section */}
			<main className="mx-auto max-w-7xl items-center px-8 pt-16 lg:grid lg:grid-cols-2 lg:gap-16">
				<div>
					<h1 className="mb-6 font-bold text-5xl text-blue-900 leading-tight tracking-tight md:text-6xl dark:text-blue-400">
						Know the true
						<br />
						arrival time.
					</h1>
					<p className="mb-10 max-w-lg text-blue-800/80 text-lg leading-relaxed dark:text-slate-300">
						One and Move uses real-time location tracking to detect the exact
						location of JUTC buses and private taxis, so you can commute
						securely and safely.
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
								JUTC Routes
							</div>
							<div className="font-bold text-3xl text-blue-900 dark:text-slate-100">
								300+
							</div>
						</div>
						<div>
							<div className="mb-1 text-blue-800/80 text-sm dark:text-slate-400">
								Avg Fare Saved
							</div>
							<div className="font-bold text-3xl text-blue-900 dark:text-slate-100">
								$350
							</div>
						</div>
						<div>
							<div className="mb-1 text-blue-800/80 text-sm dark:text-slate-400">
								Parishes Covered
							</div>
							<div className="font-bold text-3xl text-blue-900 dark:text-slate-100">
								14
							</div>
						</div>
					</div>
				</div>

				{/* Right side Visual (Interactive Map) */}
				<div className="mt-12 flex w-full flex-col items-center justify-center gap-6 lg:mt-0 lg:h-full">
					<div className="relative flex aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-blue-200 bg-zinc-100 shadow-xl dark:border-slate-800 dark:bg-slate-900">
						<WebMap darkMode={isDark} key={String(isDark)} />
					</div>

					{/* Interactive Route Menu Strip */}
					<HeroRouteSearch />
				</div>
			</main>

			{/* Features Section */}
			<section className="mx-auto max-w-7xl px-8 pt-32" id="features">
				<div className="mb-12 text-center">
					<p className="mb-3 font-semibold text-blue-500 text-sm uppercase tracking-widest dark:text-blue-400">
						Features
					</p>
					<h2 className="font-black text-4xl text-blue-900 tracking-tight md:text-5xl dark:text-slate-100">
						Everything you need to get around
					</h2>
				</div>

				<div className="grid gap-6 md:grid-cols-3">
					<div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
						<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
							<MapIcon size={22} />
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-xl dark:text-slate-100">
							Live Map Tracking
						</h3>
						<p className="text-blue-800/70 text-base leading-relaxed dark:text-slate-400">
							Watch JUTC buses and robot taxis move on a live map, checking
							their availability and proximity in real-time.
						</p>
					</div>
					<div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
						<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
							<Clock size={22} />
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-xl dark:text-slate-100">
							Wait Time Estimates
						</h3>
						<p className="text-blue-800/70 text-base leading-relaxed dark:text-slate-400">
							Eliminate uncertainty with arrival predictions based on actual
							road conditions, speeds, and live geolocation.
						</p>
					</div>
					<div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
						<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
							<Car size={22} />
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-xl dark:text-slate-100">
							Crowdsourced Tracking
						</h3>
						<p className="text-blue-800/70 text-base leading-relaxed dark:text-slate-400">
							Riders on board report their vehicle in real time, keeping the map
							accurate even where GPS coverage is sparse.
						</p>
					</div>
				</div>
			</section>

			{/* How it works Section */}
			<section className="mx-auto max-w-7xl px-8 pt-32 pb-24" id="how-it-works">
				<div className="mb-12 text-center">
					<p className="mb-3 font-semibold text-blue-500 text-sm uppercase tracking-widest dark:text-blue-400">
						How it works
					</p>
					<h2 className="font-black text-4xl text-blue-900 tracking-tight md:text-5xl dark:text-slate-100">
						Three steps to finding your ride
					</h2>
				</div>

				<div className="grid gap-6 md:grid-cols-3">
					<div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
						<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white font-bold text-lg">
							1
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-xl dark:text-slate-100">
							Open the map
						</h3>
						<p className="text-blue-800/70 text-base leading-relaxed dark:text-slate-400">
							See JUTC buses and robot taxis moving in real time across Kingston
							and beyond, updated continuously by crowdsourced riders.
						</p>
					</div>

					<div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
						<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white font-bold text-lg">
							2
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-xl dark:text-slate-100">
							Plan your trip
						</h3>
						<p className="text-blue-800/70 text-base leading-relaxed dark:text-slate-400">
							Enter your destination and get a multi-leg route combining JUTC
							buses and robot taxis — with fare estimates and travel time.
						</p>
					</div>

					<div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
						<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white font-bold text-lg">
							3
						</div>
						<h3 className="mb-2 font-bold text-blue-900 text-xl dark:text-slate-100">
							Board and contribute
						</h3>
						<p className="text-blue-800/70 text-base leading-relaxed dark:text-slate-400">
							When you board, tap "I'm on this vehicle" to share your live
							location — helping every other commuter behind you.
						</p>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="mx-auto mt-32 max-w-7xl border-blue-100 border-t px-8 py-16 dark:border-slate-800">
				<div className="grid gap-12 md:grid-cols-3">
					{/* Brand */}
					<div>
						<p className="mb-2 font-black text-blue-900 text-xl tracking-tight dark:text-slate-100">
							One &amp; Move
						</p>
						<p className="text-blue-800/60 text-sm leading-relaxed dark:text-slate-500">
							Real-time transit tracking for Jamaica — combining JUTC buses and
							robot taxis into one map.
						</p>
					</div>

					{/* Navigation */}
					<div>
						<p className="mb-4 font-semibold text-blue-900 text-sm uppercase tracking-widest dark:text-slate-300">
							Navigate
						</p>
						<ul className="space-y-2 text-blue-800/70 text-sm dark:text-slate-400">
							<li>
								<Link
									className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
									href="/"
								>
									Home
								</Link>
							</li>
							<li>
								<Link
									className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
									href="/map"
								>
									Live Map
								</Link>
							</li>
							<li>
								<Link
									className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
									href="#features"
								>
									Features
								</Link>
							</li>
							<li>
								<Link
									className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
									href="#how-it-works"
								>
									How it works
								</Link>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div>
						<p className="mb-4 font-semibold text-blue-900 text-sm uppercase tracking-widest dark:text-slate-300">
							Contact
						</p>
						<ul className="space-y-2 text-blue-800/70 text-sm dark:text-slate-400">
							<li>
								<a
									className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
									href="mailto:hello@oneandmove.com"
								>
									hello@oneandmove.com
								</a>
							</li>
							<li>Kingston, Jamaica</li>
							<li>
								<a
									className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
									href="https://github.com/akinhenry/One-and-Move"
									rel="noopener noreferrer"
									target="_blank"
								>
									GitHub
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-12 border-blue-100 border-t pt-8 text-blue-800/40 text-xs dark:border-slate-800 dark:text-slate-600">
					© {new Date().getFullYear()} One &amp; Move. All rights reserved.
				</div>
			</footer>
		</div>
	);
}
