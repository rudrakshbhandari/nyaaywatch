#!/usr/bin/env bash
set -euo pipefail

curl --fail --silent --show-error --retry 3 "$AZURE_BLOB_SAS_URL" -o /tmp/nyaaywatch.dump
restore_args=(--exit-on-error --no-owner --no-acl)
if [[ "${ALLOW_TARGET_OVERWRITE:-false}" == "true" ]]; then
  restore_args+=(--clean --if-exists)
fi
pg_restore "${restore_args[@]}" --dbname="$TARGET_DATABASE_URL" /tmp/nyaaywatch.dump
psql "$TARGET_DATABASE_URL" -Atqc "select count(*) from pg_tables where schemaname = 'public'"
