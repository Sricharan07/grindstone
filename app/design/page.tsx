import type { Metadata } from "next";
import { DesignWorkspace } from "@/components/design-workspace";

export const metadata: Metadata = { title: "Design rounds" };
export default function DesignPage() { return <DesignWorkspace />; }
