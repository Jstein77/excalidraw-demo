import { execSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { Agent, CursorAgentError } from "@cursor/sdk";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

function parseVerifyResult(agentText: string): "PASS" | "FAIL" | null {
  const lines = agentText
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const lastLine = lines[lines.length - 1];
  if (lastLine === "CANVAS_VERIFY_RESULT=PASS") return "PASS";
  if (lastLine === "CANVAS_VERIFY_RESULT=FAIL") return "FAIL";
  if (agentText.includes("CANVAS_VERIFY_RESULT:PASS")) return "PASS";
  if (agentText.includes("CANVAS_VERIFY_RESULT:FAIL")) return "FAIL";
  return null;
}

function writeStepSummary(
  agentId: string,
  result: "PASS" | "FAIL" | "INDETERMINATE",
  extra?: string,
): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const body = [
    "## Canvas UI Verify",
    "",
    `- Agent ID: \`${agentId}\``,
    `- Result: **${result}**`,
    extra ? `- ${extra}` : null,
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
  appendFileSync(summaryPath, body);
}

function buildPrompt(
  prNumber: string,
  owner: string,
  repo: string,
  headRef: string,
): string {
  return `PR #${prNumber} on ${owner}/${repo}, branch \`${headRef}\`.

You are a **read-only canvas UI verification agent** on a cloud VM with this repo checked out at the PR head. Your only job is to verify UI interaction and report results — you are not a code author on this PR.

**Hard constraints — do not violate:**
- Do NOT modify, create, or delete any source files in the repo.
- Do NOT commit, push, amend, or otherwise change git history.
- Do NOT open or update the PR (title, body, labels, etc.) — only add a PR comment with verification results.
- Do NOT commit verification artifacts (screenshots, GIFs) to the repo.

Follow \`.cursor/skills/verify-canvas-interaction/SKILL.md\` for the verification workflow only. Use repro coordinates from \`.demo/browser-repro-coords.md\`.

Do everything yourself on this VM:
1. Setup (Node 22, \`yarn install --frozen-lockfile\`)
2. Run Vitest commands from the PR test plan (read PR #${prNumber} description/body for the test plan)
3. Start dev server, run full browser repro for rotated-rectangle selection
4. Capture step screenshots, assemble GIF with ffmpeg
5. Post a PR comment with inline GIF (GitHub user attachment) using this exact structure:

\`\`\`markdown
### Summary
A 1-2 sentence summary. Include the test result (PASS or FAIL).

### Verified
- [x] \`yarn test packages/utils/geometry --watch=false\`
- [x] Filled rectangle rotated ~45°, deselected, center click selects
- [x] Unrotated filled rectangle center click still selects
(Adjust checklist items to match what you actually ran.)

### Notes
Any notes (e.g. env quirks, skipped steps, failure details).

### UI GIF
![Rotated rectangle center-click selection verification](https://github.com/user-attachments/assets/{asset-id})

<!-- CANVAS_VERIFY_RESULT:PASS -->
\`\`\`

If verification fails, use the same structure with FAIL in Summary, explain what failed in Notes, and attach the last screenshot/GIF in UI GIF.

**Required — your final message must end with exactly one of these lines (nothing after it):**
- \`CANVAS_VERIFY_RESULT=PASS\` — browser repro succeeded, GIF assembled, PR comment posted
- \`CANVAS_VERIFY_RESULT=FAIL\` — any step failed

Also include \`<!-- CANVAS_VERIFY_RESULT:PASS -->\` or \`<!-- CANVAS_VERIFY_RESULT:FAIL -->\` in the PR comment body.`;
}

function resolveHeadRef(owner: string, repo: string, prNumber: string): string {
  const existing = process.env.PR_HEAD_REF;
  if (existing) return existing;

  try {
    const out = execSync(
      `gh pr view ${prNumber} --repo ${owner}/${repo} --json headRefName -q .headRefName`,
      { encoding: "utf8" },
    ).trim();
    if (!out) throw new Error("empty headRefName");
    return out;
  } catch (err) {
    console.error(
      "Failed to resolve PR head ref. Set PR_HEAD_REF or ensure gh CLI is available.",
      err,
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const apiKey = requireEnv("CURSOR_API_KEY");
  const prNumber = requireEnv("PR_NUMBER");
  const repository = requireEnv("GITHUB_REPOSITORY");
  const [owner, repo] = repository.split("/");
  if (!owner || !repo) {
    console.error("GITHUB_REPOSITORY must be owner/repo");
    process.exit(1);
  }

  const headRef = resolveHeadRef(owner, repo, prNumber);
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const prompt = buildPrompt(prNumber, owner, repo, headRef);

  console.log(`Launching cloud agent for PR #${prNumber} (${headRef})...`);

  let agentId = "unknown";
  let streamedText = "";

  try {
    await using agent = await Agent.create({
      apiKey,
      model: { id: "composer-2.5" },
      cloud: {
        repos: [{ url: repoUrl, startingRef: headRef }],
        skipReviewerRequest: true,
      },
    });

    agentId = agent.agentId;
    console.log(`Agent ID: ${agentId}`);

    const run = await agent.send(prompt);
    for await (const event of run.stream()) {
      if (event.type === "assistant") {
        for (const block of event.message.content) {
          if (block.type === "text") {
            process.stdout.write(block.text);
            streamedText += block.text;
          }
        }
      }
    }

    const result = await run.wait();

    if (result.status === "error" || result.status === "cancelled") {
      console.error(`Run ${result.status}: ${result.id}`);
      writeStepSummary(agentId, "FAIL", `Run status: ${result.status}`);
      process.exit(2);
    }

    const text = (result.result ?? streamedText).trim();
    const verifyResult = parseVerifyResult(text);

    if (verifyResult === "PASS") {
      console.log("\nCANVAS_VERIFY_RESULT=PASS");
      writeStepSummary(agentId, "PASS");
      process.exit(0);
    }

    if (verifyResult === "FAIL") {
      console.error("\nCANVAS_VERIFY_RESULT=FAIL");
      writeStepSummary(agentId, "FAIL");
      process.exit(2);
    }

    console.error("\nMissing CANVAS_VERIFY_RESULT signal — treating as FAIL");
    writeStepSummary(
      agentId,
      "INDETERMINATE",
      "Agent completed without PASS/FAIL signal",
    );
    process.exit(2);
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(
        `Startup failed: ${err.message}, retryable=${err.isRetryable}`,
      );
      writeStepSummary(agentId, "FAIL", `Startup: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

main();
