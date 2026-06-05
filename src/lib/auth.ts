import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

function getBaseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  // Vercel sets VERCEL_URL without a protocol
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Railway sets RAILWAY_PUBLIC_DOMAIN without a protocol
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return "http://localhost:3000";
}

export const auth = betterAuth({
  baseURL: getBaseURL(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
