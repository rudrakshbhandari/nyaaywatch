#!/usr/bin/env bash

set -euo pipefail

docker compose up -d postgres localstack
echo "Waiting for postgres..."
until pg_isready -h localhost -p 5432 -U postgres -d nyaaywatch >/dev/null 2>&1; do
  sleep 1
done

echo "Services are up."
