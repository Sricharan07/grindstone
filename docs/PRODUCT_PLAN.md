# Grindstone product plan

## Product promise

Grindstone is a four-week interview sprint that always answers three questions: what should I do next, why does it matter for an interview, and what evidence will prove I learned it?

## Learner journey

1. **Resume-safe setup** saves the target, language, schedule, and commitment after every change.
2. **Starting check** establishes the first difficulty before training routes unlock.
3. **Today** leads with one exact Start or Resume task, its duration, its interview purpose, and the evidence it will collect.
4. **Curriculum** presents one 24-session path across four weeks instead of asking a new learner to choose among unrelated modes.
5. **Lesson workspace** moves through purpose, concept, prediction, recall, code, hidden tests, explanation, and fresh transfer.
6. **Practice** schedules recall after learning; **Mock** tests independent performance with guided help disabled.
7. **Progress** reports evidence from attempts and independent transfer rather than activity alone.

## Release scope

| Area | Completed behavior |
|---|---|
| Navigation | Today, Curriculum, Practice, and Progress are primary. Specialist rooms live under More. Before activation only Today and Setup are available. |
| Plain language | Internal pedagogy and difficulty labels were replaced in the primary journey with learner-facing terms. |
| Curriculum | Four weeks, six ordered sessions per week, and twelve deep coding lessons spanning foundations, linear patterns, traversal, and interview application. |
| Language support | Every integrated lesson includes Python, Java, and C++ examples, starter contracts, and hidden judge cases. |
| Active learning | Learners must predict before coding, recall after the example is blurred, pass hidden tests, explain the approach, and complete a fresh transfer. |
| AI tutor | On-demand Socratic question, concept reminder, pseudocode, next step, and one-line completion levels; open questions are supported in a lesson-scoped chat. |
| AI boundary | The backend uses the owner's dedicated ChatGPT login through local Codex app-server, forces `gpt-5.6-luna` with `xhigh` reasoning, disables model fallback, tools, writes, network access, and approvals, and applies quotas and timeouts. |
| Mastery | Assisted work is recorded but cannot prove full mastery. Only an independent fresh transfer can do that. |
| Recovery | Setup, lesson code, prediction, explanation, help history, and transfer state survive reloads. Judge and tutor failures preserve the draft and expose retryable errors. |
| Hosting | Private Google-account allowlists, isolated judge and SQL services, owner Codex authentication, backups, and Cloudflare Tunnel remain part of the self-hosted profile. |

## Release gates

- Unit and reducer tests cover curriculum integrity, state migration, tutor policy, hidden lesson harnesses, and assistance-aware mastery.
- Browser end-to-end tests cover the integrated lesson, curriculum, adaptive practice, simulations, codebase lab, recovery states, and malformed APIs.
- Python, Java, and C++ must each pass a real hidden lesson harness through the running judge.
- The production build, typecheck, lint, content audit, Docker Compose validation, and judge containment smoke test must pass.
- Desktop and 390 by 844 mobile checks must show no overlapping controls or browser console errors in Today, Curriculum, and the integrated lesson.
- The final usability audit must score at least 36/40 with no heuristic below 3. The completed release scores 39/40; external-service recovery remains the only 3/4 area.
