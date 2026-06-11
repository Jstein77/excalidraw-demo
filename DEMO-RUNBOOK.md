# Cursor 201 Demo Runbook (DO NOT SHOW ON SCREEN)

Repo: https://github.com/Jstein77/excalidraw-demo  
Demo-start branch: `main` (seeded bug + `.cursor/` config, no regression test yet)

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
