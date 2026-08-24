import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

function allowedEmails() {
  return new Set(
    (process.env.ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: process.env.DATABASE_URL ? DrizzleAdapter(getDb(), { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens }) : undefined,
  providers: [Google],
  session: { strategy: process.env.DATABASE_URL ? "database" : "jwt" },
  trustHost: true,
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      const allowlist = allowedEmails();
      if (allowlist.size === 0) return process.env.NODE_ENV !== "production" && process.env.AUTH_REQUIRED !== "true";
      return allowlist.has(profile.email.toLowerCase());
    },
    async session({ session, token, user }) {
      if (session.user) session.user.id = user?.id ?? token?.sub ?? session.user.id;
      return session;
    },
  },
  pages: { signIn: "/login" },
});
