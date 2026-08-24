import type { Metadata } from "next";
import { SprintReview } from "@/components/sprint-review";

export const metadata: Metadata = { title: "Sprint review" };
export default function SprintReviewPage() { return <SprintReview />; }
