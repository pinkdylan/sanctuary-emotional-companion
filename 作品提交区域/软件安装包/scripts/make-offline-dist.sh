#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_DIR="$ROOT_DIR/亲和之心-(sanctuary)"
OUT_DIR="$ROOT_DIR/作品提交区域/软件安装包/releases"
STAMP="$(date +%Y%m%d-%H%M%S)"
PKG_NAME="xinling-sanctuary-offline-${STAMP}"
TMP_DIR="$(mktemp -d)"

mkdir -p "$OUT_DIR"

echo "[1/4] build in $APP_DIR"
cd "$APP_DIR"

if [ "${SKIP_NPM_CI:-0}" = "1" ]; then
  echo "[skip] SKIP_NPM_CI=1 -> 不执行 npm ci（使用现有 node_modules）"
else
  if [ -d node_modules ]; then
    echo "[info] 检测到已有 node_modules，跳过 npm ci（如需强制重装：先删除 node_modules 或设置 SKIP_NPM_CI=0）"
  else
    echo "[info] 未检测到 node_modules，执行 npm ci（需要可访问 npm registry）"
    npm ci
  fi
fi

if [ -d dist ] && [ -f dist/index.html ]; then
  echo "[info] 检测到已有 dist/，跳过 npm run build（如需强制重建：删除 dist/ 或设置 FORCE_BUILD=1）"
else
  if [ "${FORCE_BUILD:-0}" = "1" ]; then
    npm run build
  else
    echo "[warn] 未检测到完整 dist/，尝试执行 npm run build"
    npm run build || {
      echo "[error] 构建失败：当前环境缺少可用的 vite（通常是 node_modules 不完整）。"
      echo "        解决方式：在可联网环境执行 npm ci，再重新运行本脚本；或先手动 npm run build 生成 dist/。"
      exit 1
    }
  fi
fi

echo "[2/4] stage package -> $TMP_DIR/$PKG_NAME"
mkdir -p "$TMP_DIR/$PKG_NAME"
rsync -a \
  --exclude node_modules \
  --exclude .git \
  --exclude .DS_Store \
  "$APP_DIR/" "$TMP_DIR/$PKG_NAME/"

cat > "$TMP_DIR/$PKG_NAME/run.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  npm ci
fi
export NODE_ENV=production
exec node --experimental-strip-types server.ts
EOF
chmod +x "$TMP_DIR/$PKG_NAME/run.sh"

echo "[3/4] compress"
ARCHIVE="$OUT_DIR/${PKG_NAME}.tar.gz"
tar -C "$TMP_DIR" -czf "$ARCHIVE" "$PKG_NAME"

echo "[4/4] cleanup"
rm -rf "$TMP_DIR"

ls -lh "$ARCHIVE"
echo "[ok] created: $ARCHIVE"
