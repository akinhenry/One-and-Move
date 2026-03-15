import { useForm } from "@tanstack/react-form";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import MapView from "react-native-maps";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient } from "@/utils/orpc";

const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Use at least 8 characters"),
});

function getErrorMessage(error: unknown): string | null {
	if (!error) {
		return null;
	}

	if (typeof error === "string") {
		return error;
	}

	if (Array.isArray(error)) {
		for (const issue of error) {
			const message = getErrorMessage(issue);
			if (message) {
				return message;
			}
		}
		return null;
	}

	if (typeof error === "object" && error !== null) {
		const maybeError = error as { message?: unknown };
		if (typeof maybeError.message === "string") {
			return maybeError.message;
		}
	}

	return null;
}

function SignIn() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [error, setError] = useState<string | null>(null);
	const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null
	);
	const [, setLocationPermissionError] = useState<string | null>(null);
	const { width, height } = Dimensions.get("window");

	const handleGoogleSignIn = async () => {
		try {
			setError(null);
			setIsGoogleSigningIn(true);

			const { error } = await authClient.signIn.social({
				provider: "google",
				callbackURL: "/",
			});

			if (error) {
				setError(getErrorMessage(error) ?? "Failed to sign in with Google");
				return;
			}

			queryClient.refetchQueries();
		} finally {
			setIsGoogleSigningIn(false);
		}
	};

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: signInSchema,
		},
		onSubmit: async ({ value, formApi }) => {
			await authClient.signIn.email(
				{
					email: value.email.trim(),
					password: value.password,
				},
				{
					onError(error) {
						setError(error.error?.message || "Failed to sign in");
					},
					onSuccess() {
						setError(null);
						formApi.reset();
						queryClient.refetchQueries();
					},
				}
			);
		},
	});

	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				setLocationPermissionError("Permission to access location was denied");
				return;
			}
			const loc = await Location.getCurrentPositionAsync({});
			setLocation(loc);
		})();
	}, []);

	return (
		<View style={styles.container}>
			<MapView
				initialRegion={{
					latitude: 18.0179,
					longitude: -76.8099,
					latitudeDelta: 0.0922,
					longitudeDelta: 0.0421,
				}}
				showsUserLocation={!!location}
				style={{ width, height }}
			/>

			<View
				style={[
					styles.card,
					{ backgroundColor: `${theme.card}E6`, borderColor: theme.border },
				]}
			>
				<Text style={[styles.title, { color: theme.text }]}>Sign In</Text>

				<form.Subscribe
					selector={(state) => ({
						isSubmitting: state.isSubmitting,
						validationError: getErrorMessage(state.errorMap.onSubmit),
					})}
				>
					{({ isSubmitting, validationError }) => {
						const formError = error ?? validationError;

						return (
							<>
								{formError ? (
									<View
										style={[
											styles.errorContainer,
											{ backgroundColor: theme.notification + "20" },
										]}
									>
										<Text
											style={[styles.errorText, { color: theme.notification }]}
										>
											{formError}
										</Text>
									</View>
								) : null}

								<form.Field name="email">
									{(field) => (
										<TextInput
											autoCapitalize="none"
											keyboardType="email-address"
											onBlur={field.handleBlur}
											onChangeText={(value) => {
												field.handleChange(value);
												if (error) {
													setError(null);
												}
											}}
											placeholder="Email"
											placeholderTextColor={theme.text}
											style={[
												styles.input,
												{
													color: theme.text,
													borderColor: theme.border,
													backgroundColor: theme.background,
												},
											]}
											value={field.state.value}
										/>
									)}
								</form.Field>

								<form.Field name="password">
									{(field) => (
										<TextInput
											onBlur={field.handleBlur}
											onChangeText={(value) => {
												field.handleChange(value);
												if (error) {
													setError(null);
												}
											}}
											onSubmitEditing={form.handleSubmit}
											placeholder="Password"
											placeholderTextColor={theme.text}
											secureTextEntry
											style={[
												styles.input,
												{
													color: theme.text,
													borderColor: theme.border,
													backgroundColor: theme.background,
												},
											]}
											value={field.state.value}
										/>
									)}
								</form.Field>

								<TouchableOpacity
									disabled={isSubmitting || isGoogleSigningIn}
									onPress={form.handleSubmit}
									style={[
										styles.button,
										{
											backgroundColor: theme.primary,
											opacity: isSubmitting || isGoogleSigningIn ? 0.5 : 1,
										},
									]}
								>
									{isSubmitting ? (
										<ActivityIndicator color="#ffffff" size="small" />
									) : (
										<Text style={styles.buttonText}>Sign In</Text>
									)}
								</TouchableOpacity>

								<TouchableOpacity
									disabled={isSubmitting || isGoogleSigningIn}
									onPress={handleGoogleSignIn}
									style={[
										styles.secondaryButton,
										{
											borderColor: theme.border,
											backgroundColor: theme.background,
											opacity: isSubmitting || isGoogleSigningIn ? 0.5 : 1,
										},
									]}
								>
									{isGoogleSigningIn ? (
										<ActivityIndicator color={theme.text} size="small" />
									) : (
										<Text
											style={[
												styles.secondaryButtonText,
												{ color: theme.text },
											]}
										>
											Continue with Google
										</Text>
									)}
								</TouchableOpacity>
							</>
						);
					}}
				</form.Subscribe>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	card: {
		position: "absolute",
		top: 80,
		left: 16,
		right: 16,
		padding: 16,
		borderWidth: 1,
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 6,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 12,
	},
	errorContainer: {
		marginBottom: 12,
		padding: 8,
	},
	errorText: {
		fontSize: 14,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 16,
		marginBottom: 12,
	},
	button: {
		padding: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 16,
	},
	secondaryButton: {
		borderWidth: 1,
		marginTop: 12,
		padding: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	secondaryButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
});

export { SignIn };
