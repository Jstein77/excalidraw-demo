#!/usr/bin/env bash
# Run Prettier on agent-edited files (post-edit automation).
set -euo pipefail

input=$(cat)

path=$(node -e "
  try {
    const d = JSON.parse(process.argv[1]);
    process.stdout.write(d.path || d.file_path || '');
  } catch {
    process.stdout.write('');
  }
" "$input")

if [[ -n "$path" && -f "$path" ]]; then
  case "$path" in
    *.ts|*.tsx|*.js|*.jsx|*.json|*.md|*.css)
      npx prettier --write "$path" >/dev/null 2>&1 || true
      ;;
  esac
fi

echo '{}'
