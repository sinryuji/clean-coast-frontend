#!/bin/sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Copy tracked project contents, including dotfiles, while excluding generated and git metadata.
tar \
  --exclude='./output' \
  --exclude='./.git' \
  --exclude='./.next' \
  --exclude='./node_modules' \
  -C "$SCRIPT_DIR" \
  -cf - . | tar -C "$OUTPUT_DIR" -xf -
