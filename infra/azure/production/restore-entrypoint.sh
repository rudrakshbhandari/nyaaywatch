#!/usr/bin/env bash
set -euo pipefail

curl --fail --silent --show-error --retry 3 "$AZURE_BLOB_SAS_URL" -o /tmp/nyaaywatch.dump
pg_restore --exit-on-error --no-owner --no-acl --dbname="$TARGET_DATABASE_URL" /tmp/nyaaywatch.dump
psql "$TARGET_DATABASE_URL" -Atqc "select count(*) from pg_tables where schemaname = 'public'"
