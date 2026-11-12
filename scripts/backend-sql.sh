#!/usr/bin/env bash
# Run SQL against a Supabase project's database through the Management API, read-write, as one transaction.
#
#   scripts/backend-sql.sh <project-ref> supabase/migrations/0018_x.sql      # apply one migration
#   scripts/backend-sql.sh <project-ref> -c "select cron.alter_job(…)"         # one statement
#   scripts/backend-sql.sh <project-ref> --rollback <migration> <test>         # a migration's checks, rolled back
#
# Why its own script: .claude/settings.json allows exactly this command for the owner's project, so a session can apply
# a migration the owner has approved ("apply 00NN" in CLAUDE.md) or stop a runaway query without a permission prompt,
# and no other command reaches production that way. backend-migrate.sh applies every migration, which re-runs old
# schedule changes; backend-sql-test.sh is the --rollback form, kept for the commands people already use.
#
# The project ref comes first, with no default, so this never targets someone else's project. Auth: the environment's
# proxy, or SUPABASE_ACCESS_TOKEN (sent in a header, never echoed). No key or token lives in this repository.
set -euo pipefail
cd "$(dirname "$0")/.."

REF="${1:-}"
if [[ ! "$REF" =~ ^[a-z]{20}$ ]]; then
  echo "usage: scripts/backend-sql.sh <project-ref> (<file.sql> | -c <sql> | --rollback <file.sql>...)" >&2
  exit 2
fi
shift
AUTH=()
if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then AUTH=(-H "authorization: Bearer ${SUPABASE_ACCESS_TOKEN}"); fi

case "${1:-}" in
  -c) [[ $# -eq 2 ]] || { echo "-c takes one SQL string" >&2; exit 2; }
      body=$(python3 -c 'import json, sys; sys.stdout.write(json.dumps({"query": sys.argv[1]}))' "$2") ;;
  --rollback) shift; [[ $# -ge 1 ]] || { echo "--rollback takes the files to run" >&2; exit 2; }
      body=$(python3 -c '
import json, sys
sql = "\n".join(open(p).read() for p in sys.argv[1:])
sys.stdout.write(json.dumps({"query": "begin;\n" + sql + "\nrollback;\n"}))' "$@") ;;
  *)  [[ $# -eq 1 && -f "$1" ]] || { echo "expected one SQL file" >&2; exit 2; }
      body=$(python3 -c 'import json, sys; sys.stdout.write(json.dumps({"query": open(sys.argv[1]).read()}))' "$1") ;;
esac

out=$(curl -sS -w $'\n%{http_code}' -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" \
  -H 'content-type: application/json' "${AUTH[@]}" --data-binary @- <<<"$body")
code="${out##*$'\n'}"; result="${out%$'\n'*}"
echo "$result"
if [[ ! "$code" =~ ^2 ]] || grep -q '"error"\|"message"' <<<"$result"; then echo "FAILED (HTTP $code)" >&2; exit 1; fi
