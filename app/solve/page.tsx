import type { Metadata } from "next";
import { SolveWorkbench } from "@/components/solve-workbench";

export const metadata: Metadata = { title: "Solve" };

export default function SolvePage() {
  return <SolveWorkbench />;
}
