# Cursor 201 Demo Runbook (DO NOT SHOW ON SCREEN)

Repo: https://github.com/Jstein77/excalidraw-demo  
Demo-start branch: `main` (seeded bug + `.cursor/` config, no regression test yet)

---

## Official briefing — Cursor · Solutions Team

### Objective

You’ve already kicked off a trial with a successful 101-level presentation. Now it’s time to go deeper. In this session, you’ll deliver a **20-minute follow-up presentation** to a smaller, more technical group of Cursor users who are actively evaluating the product at Adobe. These users already understand Cursor’s basics and are looking for advanced workflows, tips, and tricks.

Your goal is to demonstrate technical depth, showcase advanced capabilities, and position yourself as a trusted advisor and power user. This is also an opportunity to show leadership how AI coding tools should be used at scale across modern engineering organizations.

As with the first session, you can use any combination of slides, a live demo, or any method you choose to best showcase how you’d teach and communicate technical workflows.

### Goals

- **Show Cursor 201** — Demonstrate more advanced topics or an end-to-end workflow that exemplifies Cursor’s value to customer engineering teams. Go for depth over breadth.
- **Highlight workflow design** — Present a realistic engineering problem of your choice and demonstrate how an advanced user might solve it using Cursor end-to-end (e.g., custom rules or commands, MCP servers, hooks, browser automations).
- **Inspire with thought leadership** — Share strategies, best practices, or frameworks that reflect how you believe teams should use AI to build software better and faster.
- **Create new “aha!” moments** — Go beyond feature explanations — show creative or clever ways for users to get leverage from the platform.

**Avoid:** Re-teaching Cursor 101 fundamentals or speaking generically about AI without hands-on application.

### What we’re looking for

- **Advanced platform knowledge** — Are you fluent in Cursor’s more powerful capabilities? Depth in a few areas is better than surface-level coverage of many.
- **Workflow design thinking** — Can you design and communicate clear, effective workflows that help engineering teams get real value from Cursor?
- **Leadership & coaching ability** — Can you teach others how to think about AI coding tools and evangelize best practices?
- **Technical depth** — Can you confidently discuss models, context windows, memory, tool selection, and the underlying mechanics of how Cursor works?

### Resources

- Cursor (request extra usage credits from the Solutions team if needed)
- [Cursor Docs](https://cursor.com/docs)

### How the session works

| Segment | Duration | Notes |
| --- | --- | --- |
| **Field Engineer — Cursor 201 Deep Dive Session 1** | 20 min | Live presentation & deep dive. Present as if to the technical pilot group from the original customer. Include at least one live walkthrough of an advanced workflow. Conversational — pause, ask questions, check in with the “customer.” |
| **Field Engineer — Cursor 201 Deep Dive Session 2** | 5 min | Technical Q&A — advanced questions, objections, or “how do I do X in Cursor?” from power users |
| Discussion | 5 min | Share your perspective on the role of Field Engineering in AI tooling. How do you believe AI will reshape software development teams? |

Creativity is welcome — as long as conclusions are clearly useful and applicable to a large enterprise like Adobe, you’re relatively unconstrained in repo and format choice.

---

## Pre-demo checklist (30 min before)

- [ ] `nvm use && yarn install` (Node 22)
- [ ] `yarn start` → http://localhost:3000 loads
- [ ] Authenticate **Linear MCP** (Cursor Settings → MCP → Linear OAuth)
- [ ] Create Linear ticket from `.demo/LINEAR-ISSUE.md` (or pull via MCP)
- [ ] Enable **BugBot** on repo — see `.demo/BUGBOT-SETUP.md`
- [ ] Confirm `main` is pushed; working tree clean
- [ ] Optional: kick off background agent on a trivial issue at minute 2

---

## 20-minute run of show

| Min | Beat | Action | Narration (technical depth) |
| --- | --- | --- | --- |
| 0–1 | Frame | "Same class of problem as a web canvas editor — Excalidraw stand-in for Adobe web editors." | Creative-tool domain: hit-testing, rotation, document model |
| 1–2 | Context in | "Pull the Linear ticket" via MCP | MCP = tools/resources exposed to model; agent reads schema, decides when to call |
| 2–4 | Reproduce | Agent opens browser, reproduces bug (see `.demo/browser-repro-coords.md`) | Browser automation = verifiable feedback loop; not just codegen |
| 4–8 | Investigate | Agent searches codebase — expect path through `App.getElementAtPosition` → `getPolygonShape` | Semantic search vs grep; watch tool selection in reasoning |
| 6 | **Rules** | Pause when agent opens `packages/utils/geometry/shape.ts` | `element-conventions.mdc` injected via glob — encode knowledge not prompts |
| 7 | **Hook demo** | Ask agent to edit `packages/excalidraw/locales/en.json` | `preToolUse` hook **denies** deterministically — rules ask, hooks enforce |
| 8–12 | Fix + test | Agent fixes `rotationOrigin` in `getPolygonShape`, adds `rotation-selection.test.ts` | Model choice: thinking model for root cause; fast model ok for test boilerplate |
| 12–14 | Verify | `yarn test packages/utils/geometry/rotation-selection.test.ts --watch=false` + browser re-test | Agents need verifiable feedback loops — invest in testability |
| 14–17 | Ship | Agent commits, opens PR with root cause + test plan (per `pr-conventions.mdc`) |  |
| 17–20 | BugBot | Show PR review comment | Layered trust: rules → hooks → CI/BugBot |

---

## Root cause (for steering if agent stalls)

**File:** `packages/utils/geometry/shape.ts`  
**Function:** `getPolygonShape`  
**Bug:** `rotationOrigin` set to `pointFrom(x, y)` for rectangles instead of element center.  
**Fix:** `const rotationOrigin: Point = center;`  
**Test:** `packages/utils/geometry/rotation-selection.test.ts`

Introduced in commit `refactor: align rect hit shape pivot with element origin`.

---

## Agent prompt (paste to start live demo)

```
We have a Linear bug report about rotated rectangles not selecting on click.
1. Fetch the Linear issue via MCP for full repro steps.
2. Start the dev server if needed and reproduce in the browser — screenshot the failure.
3. Find root cause in the hit-testing pipeline and fix it.
4. Add a Vitest regression test under packages/utils/geometry/ per project rules.
5. Run the targeted test suite and re-verify in the browser.
6. Open a PR with root cause and test plan.
Do NOT edit files under packages/excalidraw/locales/ or firebase-project/ — team policy blocks this.
```

---

## Q&A prep

| Question | Answer |
| --- | --- |
| Context window / fresh chat? | Long investigations: start fresh chat when context degrades; @-mention key files |
| Rules vs hooks? | Rules = probabilistic instructions in system prompt; hooks = deterministic code at lifecycle events |
| Data privacy? | Privacy mode / enterprise controls — no code stored for training when enabled |
| Works on our monorepo? | Same patterns: encode conventions in rules, guardrails in hooks, MCP for issue trackers |

---

## Reset after demo / rehearsal

```bash
git checkout main
git pull origin main
# Close any demo PR without merging:
gh pr close <number> --delete-branch
# Restart dev server from clean main
```

Dry-run PR #1 was closed without merge during setup — use same flow after live demo.

---

## Thought-leadership sound bites

1. **Encode knowledge, not prompts** — rules/skills/hooks in repo, not tribal prompting skill
2. **Agents need verifiable feedback loops** — tests + browser verification
3. **Trust through determinism** — hooks enforce what rules merely suggest
