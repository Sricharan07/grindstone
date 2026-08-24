import type { Metadata } from "next";
import { LearnWorkspace } from "@/components/learn-workspace";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return <LearnWorkspace />;
}
