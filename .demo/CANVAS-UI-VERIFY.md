# Canvas UI Verify (GH Action + Cloud Agent)

Automated browser verification for canvas/hit-testing PRs. A thin GitHub Action triggers a **Cloud Agent** via the Cursor SDK; the agent follows [`.cursor/skills/verify-canvas-interaction/SKILL.md`](../.cursor/skills/verify-canvas-interaction/SKILL.md) and reports pass/fail.

## Architecture

```
GitHub PR (ready_for_review) → canvas-ui-verify.yml → run-canvas-verify.ts → Cloud Agent
                                                                                    ↓
                                                              browser repro, GIF, PR comment
                                                                                    ↓
                                                              CANVAS_VERIFY_RESULT=PASS|FAIL
                                                                                    ↓
                                                              GH check green / red
```

**Control plane:** GitHub Action triggers the agent. **Worker:** Cloud Agent on Cursor infra.

Complements BugBot (code review) with behavioral acceptance testing.

## One-time setup

1. **Repository secret:** add `CURSOR_API_KEY` (team service account or user key with repo access).
2. **Cursor GitHub integration:** Cloud Agent must be able to push to PR branches and comment (same as [fix-proposal automation](./FIX-PROPOSAL-AUTOMATION.md)).
3. **Cloud Agent PAT for PR comments:** add a fine-grained GitHub PAT as **Runtime Secret** `GH_TOKEN` in [Cursor Dashboard → Cloud Agents → Secrets](https://cursor.com/dashboard/cloud-agents) (Issues + Pull requests read/write on this repo). Repo [`.cursor/environment.json`](../.cursor/environment.json) runs [`.cursor/cloud-start.sh`](../.cursor/cloud-start.sh) on startup to verify `GH_TOKEN` is your PAT, not the Cursor `ghs_…` integration token.
4. **Workflow file:** copy [`.demo/workflows/canvas-ui-verify.yml`](./workflows/canvas-ui-verify.yml) to `.github/workflows/` if not already present (agent policy may block direct `.github/` edits).

## Triggers

| Trigger | When |
| --- | --- |
| `pull_request` `ready_for_review` | PR marked ready; canvas-related paths changed |
| `pull_request` `synchronize` | New commits on an open PR (canvas paths) |
| `workflow_dispatch` | Manual re-run; requires `pr_number` input |

Path filter scopes to geometry/element/collision changes.

## Pass/fail contract

The GH check is green **only** when the agent's final message ends with:

```
CANVAS_VERIFY_RESULT=PASS
```

Any other outcome (explicit `FAIL`, missing signal, agent crash) → red check.

| Exit code | Meaning                              |
| --------- | ------------------------------------ |
| 0         | Verification passed                  |
| 1         | Agent failed to start                |
| 2         | Verification failed or indeterminate |

## Local manual trigger

```bash
cd .demo/scripts
npm ci
export CURSOR_API_KEY="cursor_..."
export GITHUB_REPOSITORY="Jstein77/excalidraw-demo"
export PR_NUMBER=42
export PR_HEAD_REF="bugfix/jst-47-rotated-rect-select"  # optional if gh CLI available
npx tsx run-canvas-verify.ts
```

## Demo pipeline

```
Linear → triage → Slack 🔧 → fix proposal → draft PR
  → mark ready → BugBot → canvas-ui-verify → mergeable (if PASS)
```

**Live demo:** mark PR ready → show BugBot comment → show `canvas-ui-verify` running → refresh for GIF comment. Re-run via **Actions → Canvas UI Verify → Run workflow**.

**Narration:** "The check isn't green because the agent ran — it's green because the agent reported PASS."

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `Missing CURSOR_API_KEY` | Add repo secret |
| `Resource not accessible by integration` on `gh pr comment` | Add `GH_TOKEN` Runtime Secret (operator PAT); ensure `.cursor/environment.json` is on the agent branch |
| `Failed to resolve PR head ref` | Set `PR_HEAD_REF` or ensure `GH_TOKEN` is set (`gh` is pre-installed on `ubuntu-latest` runners) |
| Green check but no GIF in comment | Should not happen — PASS requires GIF uploaded in PR comment per prompt |
| Red check, agent finished | Look for `CANVAS_VERIFY_RESULT=FAIL` or missing signal in Actions log |
| Fork PRs | `CURSOR_API_KEY` not available to fork workflows (by design) |

Workflow source: [`.demo/workflows/canvas-ui-verify.yml`](./workflows/canvas-ui-verify.yml)

Launcher: [`.demo/scripts/run-canvas-verify.ts`](./scripts/run-canvas-verify.ts)
