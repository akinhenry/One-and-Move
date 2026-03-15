"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Navigation from "@/components/navigation";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

function AuthForms() {
	const searchParams = useSearchParams();
	const isSignUpMode = searchParams.get("mode") === "signup";

	const [showSignIn, setShowSignIn] = useState(!isSignUpMode);

	useEffect(() => {
		setShowSignIn(searchParams.get("mode") !== "signup");
	}, [searchParams]);

	return showSignIn ? (
		<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	);
}

export default function LoginPage() {
	return (
		<div className="flex min-h-screen flex-1 flex-col bg-background font-sans text-foreground">
			<Navigation />
			<div className="flex flex-1 items-center justify-center p-4">
				<div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
					<Suspense
						fallback={
							<div className="text-center text-muted-foreground">
								Loading...
							</div>
						}
					>
						<AuthForms />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
