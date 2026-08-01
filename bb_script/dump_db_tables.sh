#!/usr/bin/env bash
# Snapshots CREATE TABLE DDL for every table in the public schema (Aiven DB)
# into individual .sql files under db/tables/ so they can be tracked/diffed in git.
# This is a one-way, read-only snapshot: editing the .sql files here does NOT
# change the database. Rerun this script after changing a table in Postgres
# to refresh the tracked copy.
#
# Usage: ./dump_db_tables.sh   (run from bb_script/, reads bb_script/.env for TARGET_SERVICE_URI)
#
# Requires pg_dump >= the Aiven server's version (server is 17.10; pg_dump
# refuses to dump from a server newer than itself). The system PATH still
# points at the PG 14 client tools, so this uses a standalone PG 17 client
# install at C:\Users\looko\pgsql-17-client\bin instead -- installed
# client-tools-only (no server/service), PATH left untouched.
set -euo pipefail
cd "$(dirname "$0")"
set -a
source .env
set +a

PG_DUMP="/c/Users/looko/pgsql-17-client/bin/pg_dump.exe"

OUT_DIR="../db/tables"
mkdir -p "$OUT_DIR"

psql -Atc "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" "$TARGET_SERVICE_URI" \
  | tr -d '\r' \
  | while IFS= read -r table; do
      [ -z "$table" ] && continue
      "$PG_DUMP" --schema-only --no-owner --no-privileges --no-tablespaces -t "public.${table}" "$TARGET_SERVICE_URI" \
        | tr -d '\r' > "$OUT_DIR/${table}.sql"
      echo "Dumped ${table}.sql"
    done
