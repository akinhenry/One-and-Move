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
		<div className="flex min-h-screen flex-1 flex-col bg-white font-sans text-blue-900">
			<Navigation />
			<div className="flex flex-1 items-center justify-center p-4">
				<div className="w-full max-w-md rounded-xl border border-blue-200 bg-white p-6 shadow-lg">
					<Suspense
						fallback={
							<div className="text-center text-blue-600">Loading...</div>
						}
					>
						<AuthForms />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
