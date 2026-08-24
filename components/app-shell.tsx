"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Code2,
  Columns3,
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
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import { useLearnerState } from "./state/learner-state-provider";

const trainingNav = [
  { href: "/", label: "Today", icon: Gauge },
  { href: "/curriculum", label: "Curriculum", icon: ListChecks },
  { href: "/practice", label: "Practice", icon: Target },
  { href: "/progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
];

const specialistNav = [
  { href: "/learn", label: "Lesson workspace", icon: BookOpen },
  { href: "/mock", label: "Mock interview", icon: Timer },
  { href: "/solve", label: "Coding gym", icon: Code2 },
  { href: "/drive", label: "Interview simulations", icon: Timer },
  { href: "/lab", label: "Technical labs", icon: Code2 },
  { href: "/design", label: "Design rounds", icon: Columns3 },
  { href: "/hr", label: "Communication", icon: MessageSquareText },
  { href: "/sprint-review", label: "Weekly review", icon: CalendarDays },
  { href: "/league", label: "Cohort", icon: Trophy },
];

const titles: Record<string, string> = {
  "/": "Today",
  "/learn": "Lesson workspace",
  "/practice": "Practice",
  "/mock": "Mock interview",
  "/progress": "Progress",
  "/league": "Cohort",
  "/drive": "Interview simulations",
  "/curriculum": "Curriculum",
  "/lab": "Technical labs",
  "/design": "Design rounds",
  "/hr": "Communication",
  "/sprint-review": "Weekly review",
  "/settings": "Settings",
};

function SetupGate({ diagnosticReady }: { diagnosticReady: boolean }) {
  return (
    <section className="setup-gate">
      <span className="result-mark"><Target size={23} /></span>
      <p className="context-line">One step before training</p>
      <h1>{diagnosticReady ? "Finish the starting check to unlock your plan." : "Set your target before training starts."}</h1>
      <p>{diagnosticReady ? "Your setup is saved. The check finds the right starting difficulty and prevents random practice." : "Grindstone needs your interview target, language, and available time before it can choose useful work."}</p>
      <Link href={diagnosticReady ? "/diagnostic" : "/onboarding"} className="button button--primary">
        {diagnosticReady ? "Resume starting check" : "Continue setup"} <ArrowRight size={17} />
      </Link>
    </section>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, ready } = useLearnerState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const trainingReady = state.profile.diagnosticComplete;
  const setupHref = state.onboarding.completed ? "/diagnostic" : "/onboarding";
  const setupLabel = state.onboarding.completed ? "Starting check" : "Setup";
  const setupNav = [
    { href: "/", label: "Today", icon: Gauge },
    { href: setupHref, label: setupLabel, icon: Target },
  ];
  const primaryNav = trainingReady ? trainingNav : setupNav;
  const publicPath = pathname === "/" || pathname === "/onboarding" || pathname === "/login" || pathname === "/settings";
  const diagnosticAllowed = pathname === "/diagnostic" && state.onboarding.completed;
  const blocked = ready && !trainingReady && !publicPath && !diagnosticAllowed;
  const immersive = pathname === "/onboarding" || pathname === "/login" || diagnosticAllowed || (trainingReady && pathname === "/solve");

  if (!ready) return <div className="app-loading" role="status">Loading your saved plan...</div>;
  if (immersive) return <>{children}</>;

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Primary navigation">
        <Link href="/" className="brand" aria-label="Grindstone home">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span className="brand-word">grindstone</span>
        </Link>

        {trainingReady ? (
          <div className="sprint-mini">
            <div className="sprint-mini__topline"><span>Week {state.sprint.week} of 4</span><span>{state.sprint.daysRemaining} days</span></div>
            <div className="sprint-mini__track" aria-label={`${28 - state.sprint.daysRemaining} of 28 sprint days complete`}><span style={{ transform: `scaleX(${(28 - state.sprint.daysRemaining) / 28})` }} /></div>
            <p>{state.sprint.goal}</p>
          </div>
        ) : (
          <div className="setup-mini"><span>Setup</span><strong>{state.onboarding.completed ? "Step 2 of 2" : "Step 1 of 2"}</strong><p>{state.onboarding.completed ? "Find your starting level" : "Choose your target and schedule"}</p></div>
        )}

        <nav className="nav-list">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} title={item.label} className={cn("nav-item", isActive(item.href) && "nav-item--active")}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span></Link>;
          })}
        </nav>

        {trainingReady && (
          <div className="more-navigation">
            <button type="button" className={cn("nav-item", moreOpen && "nav-item--active")} aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}>
              <MoreHorizontal size={18} /><span>More</span><ChevronRight size={15} className={cn(moreOpen && "chevron-open")} />
            </button>
            {moreOpen && <nav className="nav-list nav-list--secondary" aria-label="Specialist training rooms">{specialistNav.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} title={item.label} className={cn("nav-item", isActive(item.href) && "nav-item--active")}><Icon size={17} /><span>{item.label}</span></Link>; })}</nav>}
          </div>
        )}

        <div className="sidebar-spacer" />
        <Link className="profile-control" href="/settings" title="Open settings">
          <Avatar initials={state.profile.initials} size="sm" />
          <span><strong>{state.profile.name}</strong><small>{trainingReady ? state.profile.target : "Setup in progress"}</small></span>
          <Settings size={16} />
        </Link>
      </aside>

      <header className="mobile-header">
        <Link href="/" className="brand" aria-label="Grindstone home"><span className="brand-mark" aria-hidden="true">G</span><span className="brand-word">grindstone</span></Link>
        <button type="button" className="icon-button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setMobileMenuOpen(false)}>
          <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation">
            <header><strong>Go to</strong><button type="button" className="icon-button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button></header>
            {primaryNav.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href}><Icon size={18} />{item.label}<ChevronRight size={16} /></Link>; })}
            {trainingReady && <><span className="mobile-menu__label">Specialist rooms</span>{specialistNav.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href}><Icon size={18} />{item.label}<ChevronRight size={16} /></Link>; })}</>}
            <Link href="/settings"><Settings size={18} />Settings<ChevronRight size={16} /></Link>
          </div>
        </div>
      )}

      <div className="app-stage">
        <header className="topbar">
          <h1>{titles[pathname] ?? "Grindstone"}</h1>
          {trainingReady && <div className="topbar-actions"><div className="streak-readout" title="Current minimum-session streak"><Flame size={16} /><span>{state.streak.days}</span></div><Link href="/sprint-review" className="icon-button" aria-label="Open weekly review"><Bell size={18} /></Link></div>}
        </header>
        <main className="app-main">{blocked ? <SetupGate diagnosticReady={state.onboarding.completed} /> : children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {primaryNav.slice(0, 4).map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={cn(isActive(item.href) && "bottom-nav__active")}><Icon size={19} /><span>{item.label}</span></Link>; })}
        {trainingReady && <button type="button" onClick={() => setMobileMenuOpen(true)}><MoreHorizontal size={19} /><span>More</span></button>}
      </nav>
    </div>
  );
}
