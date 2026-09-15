#!/usr/bin/env bash
set -euo pipefail

: "${SOURCE_DATABASE_URL:?}"
: "${AZURE_BLOB_SAS_URL:?}"
: "${AZURE_LOG_SAS_URL:?}"
: "${AZURE_COUNTS_SAS_URL:?}"

# The AWS-managed secret may include the RDS libpq compatibility flag. It is
# accepted by the AWS runtime but rejected by PostgreSQL 16, so strip only
# that provider-specific query parameter before opening the source session.
SOURCE_DATABASE_URL="$(printf '%s' "$SOURCE_DATABASE_URL" | sed -e 's/?uselibpqcompat=true&/?/' -e 's/&uselibpqcompat=true//')"
export SOURCE_DATABASE_URL

log_file=/tmp/relay.log
dump_file=/tmp/nyaaywatch.dump
counts_file=/tmp/source-row-counts.tsv
snapshot_owner_pid=''

cleanup() {
  if [[ -n "$snapshot_owner_pid" ]]; then
    printf 'COMMIT;\n' >&"${SNAPSHOT_PSQL[1]}" 2>/dev/null || true
    wait "$snapshot_owner_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

set +e
: > "$log_file"
coproc SNAPSHOT_PSQL { psql -XAtq "$SOURCE_DATABASE_URL"; }
snapshot_owner_pid="$!"
printf 'BEGIN ISOLATION LEVEL REPEATABLE READ;\nSELECT pg_export_snapshot();\n' >&"${SNAPSHOT_PSQL[1]}"
IFS= read -r snapshot <&"${SNAPSHOT_PSQL[0]}"
if [[ -z "${snapshot:-}" ]]; then
  printf '%s\n' 'failed to export a PostgreSQL snapshot' >>"$log_file"
  rc=1
else
  pg_dump --format=custom --no-owner --no-acl --snapshot="$snapshot" --file="$dump_file" "$SOURCE_DATABASE_URL" >>"$log_file" 2>&1
  rc=$?
fi
if [[ "$rc" -eq 0 ]]; then
  raw_counts_file=/tmp/source-row-counts.raw.tsv
  psql -XqAtF $'\t' "$SOURCE_DATABASE_URL" >"$raw_counts_file" 2>>"$log_file" <<SQL
BEGIN ISOLATION LEVEL REPEATABLE READ;
SET TRANSACTION SNAPSHOT '$snapshot';
SELECT format('select %L, count(*) from %I.%I;', table_schema||'.'||table_name, table_schema, table_name)
FROM information_schema.tables
WHERE table_schema='public'
ORDER BY 1
\gexec
COMMIT;
SQL
  rc=$?
  if [[ "$rc" -eq 0 ]]; then
    awk -F $'\t' 'NF == 2 && $2 ~ /^[0-9]+$/ { print }' "$raw_counts_file" >"$counts_file"
    rc=$?
  fi
fi
if [[ "$rc" -eq 0 ]]; then
  curl --fail --silent --show-error --retry 3 -X PUT -H "x-ms-blob-type: BlockBlob" --upload-file "$dump_file" "$AZURE_BLOB_SAS_URL" >>"$log_file" 2>&1
  rc=$?
fi
if [[ "$rc" -eq 0 ]]; then
  curl --fail --silent --show-error --retry 3 -X PUT -H "x-ms-blob-type: BlockBlob" --upload-file "$counts_file" "$AZURE_COUNTS_SAS_URL" >>"$log_file" 2>&1
  rc=$?
fi
curl --fail --silent --show-error --retry 3 -X PUT -H "x-ms-blob-type: BlockBlob" --upload-file "$log_file" "$AZURE_LOG_SAS_URL" >/dev/null 2>&1 || true
exit "$rc"
