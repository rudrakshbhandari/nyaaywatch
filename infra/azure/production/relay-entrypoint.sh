#!/usr/bin/env bash
set -euo pipefail

: "${SOURCE_DATABASE_URL:?}"
: "${AZURE_BLOB_SAS_URL:?}"
: "${AZURE_LOG_SAS_URL:?}"
: "${AZURE_COUNTS_SAS_URL:?}"

log_file=/tmp/relay.log
dump_file=/tmp/nyaaywatch.dump
counts_file=/tmp/source-row-counts.tsv

set +e
: > "$log_file"
pg_dump --format=custom --no-owner --no-acl --file="$dump_file" "$SOURCE_DATABASE_URL" >>"$log_file" 2>&1
rc=$?
if [[ "$rc" -eq 0 ]]; then
  query="$(psql "$SOURCE_DATABASE_URL" -Atc "select format('select %L, count(*) from %I.%I;', table_schema||'.'||table_name, table_schema, table_name) from information_schema.tables where table_schema='public' order by 1")"
  printf '%s\n' "$query" | psql "$SOURCE_DATABASE_URL" -AtF $'\t' > "$counts_file" 2>>"$log_file"
  rc=$?
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
