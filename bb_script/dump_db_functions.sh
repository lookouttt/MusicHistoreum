#!/usr/bin/env bash
# Snapshots every Postgres function in the public schema (on the Aiven DB) into
# individual .sql files under db/functions/ so they can be tracked/diffed in git.
# This is a one-way, read-only snapshot: editing the .sql files here does NOT
# change the database. Rerun this script after changing a function in Postgres
# to refresh the tracked copy.
#
# Usage: ./dump_db_functions.sh   (run from bb_script/, reads bb_script/.env for TARGET_SERVICE_URI)
set -euo pipefail
cd "$(dirname "$0")"
set -a
source .env
set +a

OUT_DIR="../db/functions"
mkdir -p "$OUT_DIR"

psql -Atc "
  SELECT p.oid, p.proname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    -- exclude functions owned by an extension (e.g. fuzzystrmatch's levenshtein/soundex/etc.)
    -- those aren't app logic, just installed extension internals living in the public schema
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
    )
  ORDER BY p.proname, p.oid;
" "$TARGET_SERVICE_URI" | while IFS='|' read -r oid proname; do
  # psql on Windows emits CRLF; `read` only strips the trailing \n, so strip
  # the stray \r too or it ends up baked into the filename as an invisible byte
  oid="${oid%$'\r'}"
  proname="${proname%$'\r'}"
  [ -z "$oid" ] && continue
  # if this proname has more than one overload, suffix the file with the oid to avoid collisions
  count=$(psql -Atc "SELECT count(*) FROM pg_proc WHERE proname = '${proname}' AND pronamespace = 'public'::regnamespace;" "$TARGET_SERVICE_URI")
  count="${count%$'\r'}"
  if [ "$count" -gt 1 ]; then
    fname="${proname}_${oid}.sql"
  else
    fname="${proname}.sql"
  fi
  psql -Atc "SELECT pg_get_functiondef(${oid}) || ';';" "$TARGET_SERVICE_URI" | tr -d '\r' > "$OUT_DIR/${fname}"
  echo "Dumped $fname"
done
