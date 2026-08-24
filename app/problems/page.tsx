import type { Metadata } from "next";
import { ProblemsWorkspace } from "@/components/problems-workspace";

export const metadata: Metadata = { title: "Problems" };

export default async function ProblemsPage({ searchParams }: { searchParams: Promise<{ problem?: string; view?: string; day?: string }> }) {
  const params = await searchParams;
  const view = params.view === "core" || params.view === "all" || params.view === "reviews" ? params.view : "scheduled";
  const day = params.day ? Math.min(28, Math.max(1, Number(params.day) || 1)) : undefined;
  return <ProblemsWorkspace selectedSlug={params.problem} initialView={view} initialDay={day} />;
}
