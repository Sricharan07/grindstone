"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  Code2,
  Gauge,
  ListChecks,
  Menu,
  Settings,
  X,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { sprintDay } from "@/lib/curriculum/catalog";
import { useLearnerState } from "./state/learner-state-provider";
import { Avatar } from "./ui/avatar";

const primaryNav = [
  { href: "/", label: "Today", icon: Gauge },
  { href: "/curriculum", label: "Curriculum", icon: ListChecks },
  { href: "/problems", label: "Problems", icon: Code2 },
  { href: "/progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
] as const;

const titles: Record<string, string> = {
  "/": "Today",
  "/curriculum": "Curriculum",
  "/problems": "Problems",
  "/progress": "Progress",
  "/settings": "Settings",
  "/session": "Daily session",
};

function SetupRequired() {
  return (
    <section className="setup-required">
      <span className="setup-required__mark">G</span>
      <div>
        <p className="section-label">Finish setup first</p>
        <h1>Your 28-day plan needs one language and one daily time.</h1>
        <p>Setup takes about two minutes and saves after every choice.</p>
      </div>
      <Link href="/onboarding" className="button button--primary">Continue setup <ArrowRight size={17} /></Link>
    </section>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, ready, persistence } = useLearnerState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const onboarded = state.profile.onboardingComplete;
  const immersive = pathname === "/onboarding" || pathname === "/login" || pathname.startsWith("/learn/");
  const publicPath = pathname === "/" || pathname === "/onboarding" || pathname === "/login" || pathname === "/settings";
  const blocked = ready && !onboarded && !publicPath;
  const currentDay = sprintDay(state.sprint.day);

  if (!ready) {
    return (
      <main className="boot-screen" role="status" aria-live="polite">
        <span className="brand-mark" aria-hidden="true">G</span>
        <p>Loading your saved sprint...</p>
      </main>
    );
  }

  if (immersive) return <>{children}</>;

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const title = Object.entries(titles).find(([route]) => route === "/" ? pathname === "/" : pathname.startsWith(route))?.[1] ?? "Grindstone";

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Primary navigation">
        <Link href="/" className="brand" aria-label="Grindstone Today">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span className="brand-copy"><strong>Grindstone</strong><small>Interview sprint</small></span>
        </Link>

        {onboarded ? (
          <section className="sprint-context" aria-label={`Day ${state.sprint.day} of 28`}>
            <div><span>Day {state.sprint.day} of 28</span><strong>Week {state.sprint.week}</strong></div>
            <div className="sprint-track" aria-hidden="true"><span style={{ transform: `scaleX(${state.sprint.day / 28})` }} /></div>
            <p>{currentDay.title}</p>
          </section>
        ) : (
          <section className="sprint-context sprint-context--setup">
            <div><span>Setup</span><strong>2 min</strong></div>
            <p>Choose Python or Java and start Day 1.</p>
          </section>
        )}

        <nav className="nav-list" aria-label="Primary navigation">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn("nav-item", isActive(item.href) && "nav-item--active")}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />
        <span className={cn("save-status", persistence === "browser" && "save-status--local")}>
          <i aria-hidden="true" /> {persistence === "postgres" ? "Saved" : persistence === "memory" ? "Saved for this session" : "Saved on this browser"}
        </span>
        <Link className="profile-control" href="/settings">
          <Avatar initials={state.profile.initials} size="sm" />
          <span><strong>{state.profile.name}</strong><small>{onboarded ? state.profile.language === "python" ? "Python" : "Java" : "Setup incomplete"}</small></span>
          <Settings size={16} />
        </Link>
      </aside>

      <header className="mobile-header">
        <Link href="/" className="brand" aria-label="Grindstone Today"><span className="brand-mark" aria-hidden="true">G</span><strong>Grindstone</strong></Link>
        <button type="button" className="icon-button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setMobileMenuOpen(false)}>
          <nav className="mobile-menu" aria-label="Navigation">
            <header><strong>Go to</strong><button type="button" className="icon-button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button></header>
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}><Icon size={18} />{item.label}</Link>;
            })}
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)}><Settings size={18} />Settings</Link>
          </nav>
        </div>
      )}

      <section className="app-stage">
        <header className="topbar">
          <div><p>{onboarded ? `Day ${state.sprint.day} of 28` : "Setup"}</p><h1>{title}</h1></div>
          {onboarded && <Link href="/" className="topbar-resume">Resume today <ArrowRight size={16} /></Link>}
        </header>
        <main className="app-main">{blocked ? <SetupRequired /> : children}</main>
      </section>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} className={cn(isActive(item.href) && "bottom-nav__active")}><Icon size={19} /><span>{item.label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
