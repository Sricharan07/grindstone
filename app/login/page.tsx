import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "@/components/icons";
import { auth, signIn } from "@/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");
  return <main className="login-page"><section><span className="brand-mark">G</span><p className="context-line">Private cohort</p><h1>Sign in to your sprint.</h1><p>Only approved members can create a profile. Your practice history stays inside the cohort.</p><form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}><button type="submit" className="button button--primary"><LockKeyhole size={18} /> Continue with Google</button></form><div><ShieldCheck size={17} /><span><strong>Membership restricted</strong><small>Use the Google account invited by your cohort.</small></span></div></section></main>;
}
