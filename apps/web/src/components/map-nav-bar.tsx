"use client";

import { Button } from "@One-and-Move/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@One-and-Move/ui/components/dropdown-menu";
import { ArrowLeft, LogOut, Moon, Sun, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";

export function MapNavBar() {
	const router = useRouter();
	const { theme, setTheme } = useTheme();
	const { data: session } = authClient.useSession();

	const isDark = theme === "dark";

	return (
		<nav
			className="pointer-events-auto absolute top-0 right-0 left-0 z-50 flex items-center justify-between px-4 py-3"
			style={{ zIndex: 1005 }}
		>
			{/* Left: back button */}
			<Button
				className="h-10 w-10 rounded-full bg-white/80 text-gray-700 shadow-lg backdrop-blur-xl transition-all hover:bg-white dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:bg-neutral-800"
				onClick={() => router.back()}
				size="icon"
				variant="ghost"
			>
				<ArrowLeft size={18} />
				<span className="sr-only">Back to dashboard</span>
			</Button>

			{/* Center: app title */}
			<div className="pointer-events-none absolute inset-x-0 flex justify-center">
				<span className="rounded-full bg-white/80 px-4 py-1.5 font-semibold text-sm text-gray-800 shadow-lg backdrop-blur-xl dark:bg-neutral-900/80 dark:text-neutral-100">
					OneAndMove
				</span>
			</div>

			{/* Right: dark mode toggle + profile */}
			<div className="flex items-center gap-2">
				{/* Dark mode toggle */}
				<Button
					className="h-10 w-10 rounded-full bg-white/80 text-gray-700 shadow-lg backdrop-blur-xl transition-all hover:bg-white dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:bg-neutral-800"
					onClick={() => setTheme(isDark ? "light" : "dark")}
					size="icon"
					variant="ghost"
				>
					{isDark ? <Sun size={17} /> : <Moon size={17} />}
					<span className="sr-only">Toggle dark mode</span>
				</Button>

				{/* Profile dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								className="h-10 w-10 rounded-full bg-white/80 text-gray-700 shadow-lg backdrop-blur-xl transition-all hover:bg-white dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:bg-neutral-800"
								size="icon"
								variant="ghost"
							/>
						}
					>
						<User size={17} />
						<span className="sr-only">Profile menu</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-56 rounded-xl border-white/20 bg-white/95 shadow-xl backdrop-blur-xl dark:border-neutral-700 dark:bg-neutral-900/95"
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-gray-900 dark:text-neutral-100">
								{session?.user?.name ?? "Account"}
							</DropdownMenuLabel>
							{session?.user?.email && (
								<DropdownMenuItem className="text-xs text-gray-500 dark:text-neutral-400">
									{session.user.email}
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300"
								onClick={() => {
									authClient.signOut({
										fetchOptions: {
											onSuccess: () => {
												router.push("/");
											},
										},
									});
								}}
							>
								<LogOut className="mr-2" size={14} />
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</nav>
	);
}
