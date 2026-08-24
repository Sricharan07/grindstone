import { redirect } from "next/navigation";

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ lesson?: string }> }) {
  const params = await searchParams;
  redirect(`/learn/${params.lesson ?? "array-scan"}`);
}
