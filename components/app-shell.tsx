"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Code2,
  Columns3,
  FlaskConical,
  Flame,
  Gauge,
  ListChecks,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Settings,
  Target,
  Timer,
  Trophy,
  X,
} from "@/components/icons";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import { useLearnerState } from "./state/learner-state-provider";

const primaryNav = [
  { href: "/", label: "Today", icon: Gauge },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Target },
  { href: "/mock", label: "Mock", icon: Timer },
  { href: "/progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
];

const secondaryNav = [
  { href: "/solve", label: "Coding gym", icon: Code2 },
  { href: "/drive", label: "Drive simulations", icon: Timer },
  { href: "/curriculum", label: "Curriculum", icon: ListChecks },
  { href: "/lab", label: "Interview labs", icon: FlaskConical },
  { href: "/design", label: "Design rounds", icon: Columns3 },
  { href: "/hr", label: "HR & communication", icon: MessageSquareText },
  { href: "/sprint-review", label: "Check-ins & gates", icon: CalendarDays },
  { href: "/league", label: "League", icon: Trophy },
];

const titles: Record<string, string> = {
  "/": "Today",
  "/learn": "Learn",
  "/practice": "Practice",
  "/mock": "Mock room",
  "/progress": "Progress",
  "/league": "League",
  "/drive": "Drive simulations",
  "/curriculum": "Curriculum",
  "/lab": "Interview labs",
  "/design": "Design rounds",
  "/hr": "HR & communication",
  "/sprint-review": "Check-ins & gates",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state } = useLearnerState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const immersive = pathname === "/solve" || pathname === "/onboarding" || pathname === "/diagnostic" || pathname === "/login";

  if (immersive) return <>{children}</>;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Primary navigation">
        <Link href="/" className="brand" aria-label="Grindstone home">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span className="brand-word">grindstone</span>
        </Link>

        <div className="sprint-mini">
          <div className="sprint-mini__topline">
            <span>Sprint {state.sprint.number}</span>
            <span>{state.sprint.daysRemaining} days</span>
          </div>
          <div className="sprint-mini__track" aria-hidden="true">
            <span style={{ width: `${Math.round(((28 - state.sprint.daysRemaining) / 28) * 100)}%` }} />
          </div>
          <p>Week {state.sprint.week} · {state.sprint.week === 1 ? "Diagnose & found" : state.sprint.week === 2 ? "Acquisition" : state.sprint.week === 3 ? "Application & speed" : "Simulation & taper"}</p>
        </div>

        <nav className="nav-list">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-item", isActive(item.href) && "nav-item--active")}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="nav-rule" />
        <nav className="nav-list" aria-label="More training areas">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-item", isActive(item.href) && "nav-item--active")}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />
        <Link className="profile-control" href="/onboarding" title="Open profile settings">
          <Avatar initials={state.profile.initials} size="sm" />
          <span>
            <strong>{state.profile.name}</strong>
            <small>{state.profile.target}</small>
          </span>
          <Settings size={16} />
        </Link>
      </aside>

      <header className="mobile-header">
        <Link href="/" className="brand" aria-label="Grindstone home">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span className="brand-word">grindstone</span>
        </Link>
        <button
          type="button"
          className="icon-button"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          {[...primaryNav, ...secondaryNav].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                <Icon size={18} />
                {item.label}
                <ChevronRight size={16} />
              </Link>
            );
          })}
        </div>
      )}

      <div className="app-stage">
        <header className="topbar">
          <h1>{titles[pathname] ?? "Grindstone"}</h1>
          <div className="topbar-actions">
            <div className="streak-readout" title="Current daily-floor streak">
              <Flame size={16} />
              <span>{state.streak.days}</span>
            </div>
            <Link href="/sprint-review" className="icon-button" aria-label="Open check-ins">
              <Bell size={18} />
            </Link>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {primaryNav.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(isActive(item.href) && "bottom-nav__active")}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setMobileMenuOpen(true)}>
          <MoreHorizontal size={19} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
