import { db } from "@One-and-Move/db";
import * as schema from "@One-and-Move/db/schema/auth";
import { env } from "@One-and-Move/env/server";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

const createSocialProviderConfig = <T extends Record<string, unknown>>(
  clientId: string | undefined,
  clientSecret: string | undefined,
  options?: T
) => {
  if (!(clientId && clientSecret)) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    ...(options ?? {}),
  };
};

const googleProvider = createSocialProviderConfig(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  {
    prompt: "select_account" as const,
  }
);

const appleProvider = createSocialProviderConfig(
  env.APPLE_CLIENT_ID,
  env.APPLE_CLIENT_SECRET
);

const facebookProvider = createSocialProviderConfig(
  env.FACEBOOK_CLIENT_ID,
  env.FACEBOOK_CLIENT_SECRET
);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema,
  }),
  trustedOrigins: [
    env.CORS_ORIGIN,
    "One-and-Move://",
    ...(env.NODE_ENV === "development"
      ? [
        "exp://",
        "exp://**",
        "exp://192.168.*.*:*/**",
        "http://localhost:8081",
      ]
      : []),
  ],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      preferredTransportMode: {
        type: "string",
        required: false,
      },
    },
  },
  socialProviders: {
    ...(googleProvider ? { google: googleProvider } : {}),
    ...(appleProvider ? { apple: appleProvider } : {}),
    ...(facebookProvider ? { facebook: facebookProvider } : {}),
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [nextCookies(), expo()],
});
