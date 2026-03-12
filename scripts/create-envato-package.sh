#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"
PACKAGE_NAME="takatracker-envato-v${VERSION}"
ZIP_PATH="$DIST_DIR/${PACKAGE_NAME}.zip"
TMP_BASE="${TMPDIR:-/tmp}/${PACKAGE_NAME}-stage"
STAGE_DIR="$TMP_BASE/$PACKAGE_NAME"

echo "Preparing clean package..."
rm -rf "$TMP_BASE"
mkdir -p "$STAGE_DIR"
mkdir -p "$DIST_DIR"

rsync -a "$ROOT_DIR/" "$STAGE_DIR/" \
  --exclude ".git" \
  --exclude ".expo" \
  --exclude ".vscode" \
  --exclude "node_modules" \
  --exclude "dist" \
  --exclude "dist/**" \
  --exclude ".env" \
  --exclude ".env.*" \
  --exclude "ios/.xcode.env" \
  --exclude "ios/.xcode.env.local" \
  --exclude "npm-debug.*" \
  --exclude "yarn-debug.*" \
  --exclude "yarn-error.*" \
  --exclude "*.log" \
  --exclude "android/app/build" \
  --exclude "android/.gradle" \
  --exclude "ios/build" \
  --exclude "ios/Pods" \
  --exclude ".DS_Store"

echo "Creating zip..."
cd "$TMP_BASE"
rm -f "$ZIP_PATH"
zip -qr "$ZIP_PATH" "$PACKAGE_NAME"
rm -rf "$TMP_BASE"

echo "Package ready:"
echo "$ZIP_PATH"
