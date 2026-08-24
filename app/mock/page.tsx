import type { Metadata } from "next";
import { MockRoom } from "@/components/mock-room";

export const metadata: Metadata = { title: "Mock" };

export default function MockPage() {
  return <MockRoom />;
}
