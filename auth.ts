import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { authenticateInvite } from "@/lib/auth/invites";

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
  providers: [
    Credentials({
      name: "Private invite",
      credentials: {
        login: { label: "Invite login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) => authenticateInvite(credentials.login, credentials.password),
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "credentials") return Boolean(user.id && user.email);
      const email = user.email ?? profile?.email;
      if (!email) return false;
      const allowlist = allowedEmails();
      if (allowlist.size === 0) return process.env.NODE_ENV !== "production" && process.env.AUTH_REQUIRED !== "true";
      return allowlist.has(email.toLowerCase());
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      return token;
    },
    async session({ session, token, user }) {
      if (session.user) session.user.id = user?.id ?? token?.sub ?? session.user.id;
      return session;
    },
  },
  pages: { signIn: "/login" },
});
