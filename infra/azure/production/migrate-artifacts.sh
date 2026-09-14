#!/usr/bin/env bash
set -euo pipefail

# Copy the complete AWS artifact bucket into Azure Blob without deleting either
# side.  The source and target credentials stay in the caller's environment.
# A second download verifies every copied file by SHA-256 before this script
# reports success.

: "${SOURCE_S3_URI:?Set SOURCE_S3_URI to the AWS bucket URI, for example s3://bucket}"
: "${TARGET_BLOB_SAS_URL:?Set TARGET_BLOB_SAS_URL to the Azure container SAS URL}"

command -v aws >/dev/null || { echo "aws CLI is required" >&2; exit 1; }
command -v azcopy >/dev/null || { echo "azcopy is required" >&2; exit 1; }
command -v sha256sum >/dev/null || { echo "sha256sum is required" >&2; exit 1; }

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/nyaaywatch-artifacts.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT

source_dir="$work_dir/source"
verify_dir="$work_dir/verify"
mkdir -p "$source_dir" "$verify_dir"

echo "Syncing source artifacts from ${SOURCE_S3_URI}"
aws s3 sync "$SOURCE_S3_URI" "$source_dir" --only-show-errors

manifest="$work_dir/source.sha256"
(
  cd "$source_dir"
  find . -type f -print0 | sort -z | xargs -0 sha256sum
) > "$manifest"

source_files="$(wc -l < "$manifest" | tr -d ' ')"
source_bytes="$(find "$source_dir" -type f -printf '%s\n' | awk '{sum += $1} END {print sum + 0}')"
echo "Source inventory: ${source_files} files, ${source_bytes} bytes"

echo "Uploading artifacts to Azure Blob"
azcopy copy "$source_dir" "$TARGET_BLOB_SAS_URL" \
  --recursive=true \
  --as-subdir=false \
  --overwrite=ifSourceNewer \
  --put-md5 \
  --check-md5=FailIfDifferent

echo "Downloading Azure Blob copy for verification"
azcopy copy "$TARGET_BLOB_SAS_URL" "$verify_dir" \
  --recursive=true \
  --as-subdir=false \
  --overwrite=true \
  --check-md5=FailIfDifferent

verify_manifest="$work_dir/verify.sha256"
(
  cd "$verify_dir"
  find . -type f -print0 | sort -z | xargs -0 sha256sum
) > "$verify_manifest"

sorted_manifest="$work_dir/source.sorted.sha256"
sorted_verify_manifest="$work_dir/verify.sorted.sha256"
LC_ALL=C sort -k2,2 "$manifest" > "$sorted_manifest"
LC_ALL=C sort -k2,2 "$verify_manifest" > "$sorted_verify_manifest"
missing_source_files="$(comm -23 "$sorted_manifest" "$sorted_verify_manifest")"
if [[ -n "$missing_source_files" ]]; then
  echo "Artifact verification failed: Azure is missing source artifacts:" >&2
  printf '%s\n' "$missing_source_files" >&2
  exit 1
fi

verify_files="$(wc -l < "$verify_manifest" | tr -d ' ')"
verify_bytes="$(find "$verify_dir" -type f -printf '%s\n' | awk '{sum += $1} END {print sum + 0}')"
echo "Verified Azure inventory: ${verify_files} files, ${verify_bytes} bytes (source is a verified subset; target-only files are retained)"
echo "Artifact migration completed without modifying the AWS source or deleting Azure data."
