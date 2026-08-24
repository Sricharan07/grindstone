import type { Metadata } from "next";
import { DriveSimulator } from "@/components/drive-simulator";

export const metadata: Metadata = { title: "Drive simulations" };

export default function DrivePage() { return <DriveSimulator />; }
