#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

IMAGE_NAME="${IMAGE_NAME:-xinling-team/sanctuary:latest}"
OUT_DIR="$ROOT_DIR/作品提交区域/docker镜像交付/exports"
OUT_FILE="$OUT_DIR/xinling-team-sanctuary.tar"

mkdir -p "$OUT_DIR"

echo "[1/2] build image: $IMAGE_NAME"
docker compose build

echo "[2/2] docker save -> $OUT_FILE"
docker save -o "$OUT_FILE" "$IMAGE_NAME"

ls -lh "$OUT_FILE"
echo "[ok] exported"
