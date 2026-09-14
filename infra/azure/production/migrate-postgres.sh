#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SOURCE_DATABASE_URL:-}" || -z "${TARGET_DATABASE_URL:-}" ]]; then
  echo "SOURCE_DATABASE_URL and TARGET_DATABASE_URL are required." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null || ! command -v pg_restore >/dev/null || ! command -v psql >/dev/null; then
  echo "pg_dump, pg_restore, and psql must be installed." >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT

dump_path="$tmpdir/nyaaywatch.dump"
source_counts="$tmpdir/source-counts.txt"
target_counts="$tmpdir/target-counts.txt"

target_table_count="$(psql "$TARGET_DATABASE_URL" -Atqc \
  "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'r' AND n.nspname = 'public';")"
if [[ "$target_table_count" != "0" && "${ALLOW_TARGET_OVERWRITE:-false}" != "true" ]]; then
  echo "Refusing to restore into a non-empty target database ($target_table_count public tables)." >&2
  echo "Set ALLOW_TARGET_OVERWRITE=true only after an explicit target backup and cutover approval." >&2
  exit 1
fi

echo "Dumping the AWS PostgreSQL source..."
pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$dump_path" \
  "$SOURCE_DATABASE_URL"

echo "Restoring into the Azure PostgreSQL target..."
pg_restore \
  --exit-on-error \
  --no-owner \
  --no-acl \
  --jobs="${PG_RESTORE_JOBS:-4}" \
  --dbname="$TARGET_DATABASE_URL" \
  "$dump_path"

collect_counts() {
  local database_url="$1"
  local output_path="$2"
  : > "$output_path"

  while IFS='|' read -r schema_name table_name; do
    [[ -n "$schema_name" && -n "$table_name" ]] || continue
    row_count="$(psql "$database_url" -Atqc \
      "SELECT count(*) FROM \"$schema_name\".\"$table_name\";")"
    printf '%s|%s|%s\n' "$schema_name" "$table_name" "$row_count" >> "$output_path"
  done < <(psql "$database_url" -AtF '|' -c \
    "SELECT n.nspname, c.relname
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public'
     ORDER BY n.nspname, c.relname;")
}

echo "Comparing public-table row counts..."
collect_counts "$SOURCE_DATABASE_URL" "$source_counts"
collect_counts "$TARGET_DATABASE_URL" "$target_counts"

if ! diff -u "$source_counts" "$target_counts"; then
  echo "PostgreSQL migration failed row-count verification." >&2
  exit 1
fi

echo "PostgreSQL migration and row-count verification succeeded."
