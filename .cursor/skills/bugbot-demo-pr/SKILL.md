---
name: bugbot-demo-pr
description: >-
  Seeds pull requests with a demo TODO comment that BugBot flags during live
  presentations. Use when opening a PR in this repo, when the user mentions
  BugBot demo, or when following the Field Engineer demo workflow that shows
  automated PR review.
---

# BugBot Demo PR Seed

This repo uses BugBot as a live-demo prop. Every PR you open should include a
deliberate TODO so BugBot surfaces a review finding on the PR page (~30–60s after
marking ready). Setup: [.demo/BUGBOT-SETUP.md](../../../.demo/BUGBOT-SETUP.md).

## Required comment

Add this **verbatim** comment in a file that is part of the PR diff (prefer the
primary changed file, near the fix):

```typescript
// TODO: Remove me before merging
```

Use the same wording in other languages (`#`, `<!-- -->`, etc.) if the changed
file is not TypeScript/JavaScript.

## When to apply

- **Always** when creating a PR in this demo repo — even if the user did not
  mention BugBot.
- Place the comment once per PR (do not scatter copies across files).
- Do **not** remove it before opening the PR; the demo depends on BugBot flagging
  it. Mention in the PR test plan that the TODO is intentional for the demo and
  should be deleted before merge.

## PR workflow checklist

```
- [ ] Fix + tests complete
- [ ] Add // TODO: Remove me before merging in a changed file
- [ ] Open PR (root cause, fix, test plan per pr-conventions)
- [ ] Mark PR ready → wait ~30–60s → refresh for BugBot review comment
```

If BugBot is not enabled, narrate per BUGBOT-SETUP.md — do not skip the TODO;
it still documents the intended demo flow.
