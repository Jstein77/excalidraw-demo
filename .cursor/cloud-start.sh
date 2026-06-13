#!/usr/bin/env bash
set -euo pipefail

# Add GH_TOKEN in Cursor Dashboard → Cloud Agents → Secrets (Runtime Secret):
# fine-grained PAT with Issues + Pull requests write on this repo.
# gh CLI reads GH_TOKEN for API calls (e.g. gh pr comment).

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "cloud-start: GH_TOKEN not set — gh pr comment may fail (integration token lacks issues scope)" >&2
elif [[ "${GH_TOKEN}" == ghs_* ]]; then
  echo "cloud-start: GH_TOKEN is the Cursor integration token — set operator PAT as GH_TOKEN in Cloud Agents → Secrets" >&2
fi
