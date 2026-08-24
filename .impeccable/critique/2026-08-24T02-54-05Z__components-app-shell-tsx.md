---
target: whole Grindstone first-time experience and menu navigation
total_score: 18
p0_count: 0
p1_count: 3
timestamp: 2026-08-24T02-54-05Z
slug: components-app-shell-tsx
---
## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 2 | Draft learners see sprint, streak, and check-in status before setup. |
| 2 | Match system / real world | 2 | PRIMM, mastery priors, blocked acquisition, and Tier A/B need translation. |
| 3 | User control and freedom | 2 | Onboarding choices are not resumable and mobile menu behavior is incomplete. |
| 4 | Consistency and standards | 3 | Visual language is strong, but profile settings routes into onboarding. |
| 5 | Error prevention | 2 | Draft learners can enter training and mocks before prerequisites. |
| 6 | Recognition rather than recall | 1 | Collapsed navigation loses labels and advanced modes are unexplained. |
| 7 | Flexibility and efficiency | 1 | No direct resume-next-rep path despite a scheduler knowing the next action. |
| 8 | Aesthetic and minimalist design | 2 | Restrained visuals are undermined by 13 co-equal destinations. |
| 9 | Error recovery | 2 | Task errors are mostly useful, but onboarding draft recovery is absent. |
| 10 | Help and documentation | 1 | Pedagogy exists, but core product terms lack help at decision points. |
| **Total** | | **18/40** | **Poor: first-time information architecture needs restructuring.** |

## Anti-Patterns Verdict

The interface does not immediately look generic or careless. Its restrained dark palette, lime action color, consistent controls, and serious simulation surfaces feel specific to Grindstone. The copy and page composition are more AI-adjacent: several pages repeat a green context line, aphoristic imperative headline, and explanatory paragraph. The visual system is crafted; the information architecture is insufficiently edited.

The deterministic detector found one low-impact warning: `transition: width` on `.progress-fill` at `app/globals.css:114`. It is a true positive but unrelated to the reported navigation confusion. No false positives were identified.

No reliable visual overlay was produced. Browser mutation was blocked by URL policy, so the detector script was not injected and no overlay server was started. Screenshot, DOM, accessibility-tree, source, and CLI evidence were used instead.

## Overall Impression

The user is correct. Grindstone's individual rooms are generally coherent, but the product presents the whole training facility before establishing the learner's route. The largest opportunity is to turn Today into the controlling journey and make Learn, Practice, Mock, and specialist rooms contextual destinations launched by the plan rather than equal starting points.

## What's Working

- Onboarding has a clear three-step structure, visible progress, concrete diagnostic length, and reassuring copy at high-pressure moments.
- The visual system is cohesive and serious. Accent color is reserved for action and state rather than decoration.
- Evidence-oriented details are strong: plan items explain why, readiness is based on observed attempts, and mock policies are explicit.

## Priority Issues

### [P1] The next scheduled action is not dominant

Once active, Today puts sprint visualization and standup before the daily plan. The product promise says the next action should precede analytics and explanation, but the screen asks the learner to interpret context first.

Fix: lead with one `Next: [specific rep]` surface containing duration, schedule reason, evidence collected, and one Start/Resume action. Move standup, burndown, readiness, and cohort activity below it or behind disclosure.

Suggested command: `$impeccable distill Today into one next-action-first command surface`

### [P1] Navigation is flat and state-agnostic

`components/app-shell.tsx` exposes five primary and eight secondary destinations. Desktop overflows shorter viewports; at 1024px all labels disappear without tooltips or accessible names. Mobile More repeats primary destinations in a 13-row flat list, lacks active state and modal semantics, and can overlap the bottom bar.

Fix: before diagnostic show only Today and Setup. After activation keep four or five stable top-level destinations, group specialist rooms, make More secondary-only, and add active state, focus management, Escape/backdrop behavior, and labeled collapsed icons.

Suggested command: `$impeccable distill components/app-shell.tsx`

### [P1] Draft learners can bypass the intended journey

The first-run Today content correctly says Start onboarding, but the surrounding shell lets the learner open Learn, Practice, Mock, Progress, Labs, Drive, and Gates. The UI simultaneously says setup is required and every tool is ready.

Fix: gate or redirect training routes while the sprint is draft. Explain the missing prerequisite with one Continue setup action. After activation distinguish work scheduled for today from optional exploration.

Suggested command: `$impeccable onboard the draft-to-diagnostic-to-first-plan journey`

### [P2] Product language requires decoding

Terms such as Tier A/B, mastery priors, route-spanning, PRIMM, L1/L2/L3, and blocked acquisition make new learners learn the product before they can use it. Aphoristic headings add tone but often fail to provide direction.

Fix: use action-specific headings and plain-language sublabels, expand unfamiliar terms at first use, and carry the schedule reason into each workspace.

Suggested command: `$impeccable clarify first-time navigation, onboarding, and mode language`

### [P2] Learn exposes future work too early

Learn presents depth choices, five phases, the current prediction, and the Transfer Lab in one long page. On mobile, later phase labels are clipped. The learner sees the full instructional apparatus instead of the current step.

Fix: reveal only the current phase and one completion action, keep prior phases retrievable, reveal Transfer Lab after Make, and default to the scheduled depth.

Suggested command: `$impeccable distill components/learn-workspace.tsx`

## Persona Red Flags

**Confused first-timer:** sees 13 destinations before onboarding, can mistake Learn or Mock for the intended first action, and encounters DSA, mastery priors, and PRIMM without help.

**Accessibility-dependent learner:** loses all navigation labels at the collapsed desktop width, encounters unnamed icon-only links, very small metadata, and a mobile menu without dialog semantics or inert background.

**Interrupted mobile learner:** can lose onboarding choices when leaving, must scan a 13-row More menu, and may find the last menu item obscured by bottom navigation.

## Minor Observations

- `Week 1 · Diagnose & found` reads like broken copy.
- Profile settings opens the onboarding wizard rather than a populated settings view.
- More repeats Today, Learn, Practice, and Mock rather than containing only overflow destinations.
- The deterministic width transition should use a transform-based progress fill.

## Questions to Consider

- If the planner knows the highest-value next rep, why should the learner choose among 13 tools?
- Are Learn, Practice, and Mock permanent destinations, or delivery modes that Today should launch contextually?
- What should disappear completely until the diagnostic produces evidence?
- What single sentence should every workspace answer about why this task matters today?
