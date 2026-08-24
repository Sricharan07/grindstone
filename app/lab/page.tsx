import type { Metadata } from "next";
import { LabWorkspace } from "@/components/lab-workspace";

export const metadata: Metadata = { title: "Interview labs" };
export default function LabPage() { return <LabWorkspace />; }
