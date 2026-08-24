import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "@/components/icons";
import { auth, signIn } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");
  const inviteLogin = Boolean(process.env.AUTH_INVITES);
  const googleLogin = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return <main className="login-page"><section><span className="brand-mark">G</span><p className="context-line">Private cohort</p><h1>Sign in to your sprint.</h1><p>Only invited members can enter. Each login opens a separate learning profile and practice history.</p>{inviteLogin ? <LoginForm /> : null}{googleLogin ? <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}><button type="submit" className="button button--secondary"><LockKeyhole size={18} /> Continue with Google</button></form> : null}<div><ShieldCheck size={17} /><span><strong>Membership restricted</strong><small>Use the private credentials supplied by your cohort owner.</small></span></div></section></main>;
}
