import { MapPin } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";

export default function Navigation() {
	return (
		<nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6 font-sans text-blue-600 dark:text-blue-400">
			<div className="flex items-center gap-2 font-bold text-xl tracking-tight">
				<MapPin
					className="text-blue-600 dark:text-blue-400"
					fill="currentColor"
					size={24}
				/>
				<Link className="transition-opacity hover:opacity-80" href="/">
					<span>One & Move</span>
				</Link>
			</div>

			<div className="hidden gap-8 font-medium text-sm md:flex">
				<Link className="transition-opacity hover:opacity-80" href="/#features">
					Features
				</Link>
				<Link className="transition-opacity hover:opacity-80" href="/map">
					Map
				</Link>
				<Link
					className="transition-opacity hover:opacity-80"
					href="/#how-it-works"
				>
					About
				</Link>
				<Link className="transition-opacity hover:opacity-80" href="/#contact">
					Contact
				</Link>
			</div>

			<div className="flex items-center gap-4 font-medium text-sm">
				<ModeToggle />
				<Link
					className="transition-opacity hover:opacity-80 dark:text-slate-200"
					href="/login"
				>
					Log in
				</Link>
				<Link
					className="rounded-md bg-blue-600 px-4 py-2 font-bold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
					href="/login?mode=signup"
				>
					Sign up
				</Link>
			</div>
		</nav>
	);
}
