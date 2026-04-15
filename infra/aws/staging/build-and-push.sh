#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <image-uri>" >&2
  echo "Example: $0 723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:alpha-20260415" >&2
  exit 1
fi

image_uri="$1"
registry="${image_uri%%/*}"

aws ecr get-login-password --region ap-south-1 \
  | docker login --username AWS --password-stdin "$registry"

docker buildx build \
  --platform linux/amd64 \
  --tag "$image_uri" \
  --push \
  .
