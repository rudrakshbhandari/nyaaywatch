#!/usr/bin/env bash
set -euo pipefail

: "${AZURE_BLOB_SAS_URL:?}"
: "${AZURE_COUNTS_SAS_URL:?}"
: "${TARGET_DATABASE_URL:?}"

curl --fail --silent --show-error --retry 3 "$AZURE_BLOB_SAS_URL" -o /tmp/nyaaywatch.dump
restore_args=(--exit-on-error --no-owner --no-acl)
if [[ "${ALLOW_TARGET_OVERWRITE:-false}" == "true" ]]; then
  restore_args+=(--clean --if-exists)
fi
pg_restore "${restore_args[@]}" --dbname="$TARGET_DATABASE_URL" /tmp/nyaaywatch.dump
curl --fail --silent --show-error --retry 3 "$AZURE_COUNTS_SAS_URL" -o /tmp/source-row-counts.tsv
query="$(psql "$TARGET_DATABASE_URL" -Atc "select format('select %L, count(*) from %I.%I;', table_schema||'.'||table_name, table_schema, table_name) from information_schema.tables where table_schema='public' order by 1")"
printf '%s\n' "$query" | psql "$TARGET_DATABASE_URL" -AtF $'\t' > /tmp/target-row-counts.tsv
diff -u /tmp/source-row-counts.tsv /tmp/target-row-counts.tsv
