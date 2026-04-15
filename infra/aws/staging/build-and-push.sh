#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <image-uri> [additional-image-uri...]" >&2
  echo "Example: $0 723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:alpha-20260415 723951822728.dkr.ecr.ap-south-1.amazonaws.com/nyaaywatch-staging:latest" >&2
  exit 1
fi

image_uris=("$@")
registry="${image_uris[0]%%/*}"

aws ecr get-login-password --region ap-south-1 \
  | docker login --username AWS --password-stdin "$registry"

build_args=(
  docker buildx build
  --platform linux/amd64
)

for image_uri in "${image_uris[@]}"; do
  build_args+=(--tag "$image_uri")
done

build_args+=(
  --push
  .
)

"${build_args[@]}"
