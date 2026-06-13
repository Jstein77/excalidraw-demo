# Fix proposal automation — E2E test plan

Two layers: **automated validation** (fix path + Vitest, no main changes) and **manual pipeline test** (Linear → triage → Slack reaction → draft PR).

## Automated validation (local)

Simulates the fix-proposal agent on a disposable worktree. Does not modify `main` (keeps the seeded bug for live demos).

```bash
chmod +x .demo/scripts/validate-fix-proposal.sh
.demo/scripts/validate-fix-proposal.sh
```

**What it checks:**

1. Buggy `rotationOrigin` block still present on `main`
2. Fix applied: `const rotationOrigin: Point = center;` in `getPolygonShape`
3. Regression test added under `packages/utils/geometry/`
4. `yarn test packages/utils/geometry --watch=false` passes

## Manual pipeline test (Cursor Automations)

Prerequisites:

- Automation 1 (bug triage) updated per [BUG-TRIAGE-AUTOMATION.md](./BUG-TRIAGE-AUTOMATION.md)
- Automation 2 (bug fix proposal) created per [FIX-PROPOSAL-AUTOMATION.md](./FIX-PROPOSAL-AUTOMATION.md)
  - Prefill: [fix-proposal-automation-prefill.json](./fix-proposal-automation-prefill.json)
  - **Finish in editor:** select `#bug-triage` channel (Slack channel ID)
- Canvas UI verify workflow: [CANVAS-UI-VERIFY.md](./CANVAS-UI-VERIFY.md) — `CURSOR_API_KEY` repo secret

### Steps

| # | Action | Expected |
| --- | --- | --- |
| 1 | Create Linear issue from [LINEAR-ISSUE.md](./LINEAR-ISSUE.md) with label `bug` | Issue created |
| 2 | Wait for triage automation | Linear: start + summary comments; labels applied |
| 3 | Check `#bug-triage` | Message with `**[JST-XX]**`, severity/complexity, and `React with :hammer_and_wrench: to propose a fix` |
| 4 | React `:hammer_and_wrench:` on triage summary | Fix-proposal automation starts |
| 5 | Wait for Cloud Agent run | Draft PR on `Jstein77/excalidraw-demo` |
| 6 | Verify PR | Root cause, fix, test plan; Vitest in CI/checks |
| 7 | Verify Linear comment | Draft PR link + one-line root cause |
| 8 | Verify Slack thread reply | PR link, test status, next steps |
| 9 | Mark PR ready | BugBot review per [BUGBOT-SETUP.md](./BUGBOT-SETUP.md) |
| 10 | Canvas UI verify | [CANVAS-UI-VERIFY.md](./CANVAS-UI-VERIFY.md) — GH Action triggers Cloud Agent; check green only if `CANVAS_VERIFY_RESULT=PASS`; GIF in PR comment |

### Gate checks

| Scenario               | Expected automation behavior |
| ---------------------- | ---------------------------- |
| Complexity `L`         | Slack reply only — no PR     |
| Missing repro (non-P0) | Ask for repro — no PR        |
| S/M with full repro    | Draft PR with fix + test     |

## Open automation prefill

To create Automation 2 in the Automations editor:

```bash
# From Agents Window — ask agent to open prefill from:
.demo/fix-proposal-automation-prefill.json
```

Or use **Cursor → Automations → New** and copy settings from [FIX-PROPOSAL-AUTOMATION.md](./FIX-PROPOSAL-AUTOMATION.md).
