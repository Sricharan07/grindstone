import type { Metadata } from "next";
import { LeaguePage } from "@/components/league-page";

export const metadata: Metadata = { title: "League" };

export default function LeagueRoute() {
  return <LeaguePage />;
}
