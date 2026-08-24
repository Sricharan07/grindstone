import type { Metadata } from "next";
import { HrWorkspace } from "@/components/hr-workspace";

export const metadata: Metadata = { title: "HR and communication" };
export default function HrPage() { return <HrWorkspace />; }
