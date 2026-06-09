#!/usr/bin/env bash
# Blocks agent edits to paths protected by team policy (deterministic guardrail).
set -euo pipefail

input=$(cat)

node <<'NODE' "$input"
const input = process.argv[2];
let data;
try {
  data = JSON.parse(input);
} catch {
  console.log(JSON.stringify({ permission: "allow" }));
  process.exit(0);
}

const toolName = data.tool_name || "";
const toolInput = data.tool_input || {};

const protectedPatterns = [
  /^packages\/excalidraw\/locales\//,
  /^firebase-project\//,
  /^\.github\//,
];

const editTools = new Set(["Write", "StrReplace", "Delete", "EditNotebook"]);
if (!editTools.has(toolName)) {
  console.log(JSON.stringify({ permission: "allow" }));
  process.exit(0);
}

const path =
  toolInput.path ||
  toolInput.file_path ||
  toolInput.target_notebook ||
  "";

for (const pattern of protectedPatterns) {
  if (pattern.test(path)) {
    console.log(
      JSON.stringify({
        permission: "deny",
        user_message: `Policy hook blocked edit to protected path: ${path}`,
        agent_message: `Cannot modify ${path}. Protected by team policy: locales/, firebase-project/, and .github/ CI config are off limits to agents. Edit packages/excalidraw/element/ or packages/utils/geometry/ instead.`,
      }),
    );
    process.exit(0);
  }
}

console.log(JSON.stringify({ permission: "allow" }));
NODE
