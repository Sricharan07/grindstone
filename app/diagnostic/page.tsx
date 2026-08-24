import type { Metadata } from "next";
import { DiagnosticRunner } from "@/components/diagnostic-runner";

export const metadata: Metadata = { title: "Diagnostic" };

export default function DiagnosticPage() {
  return <DiagnosticRunner />;
}
