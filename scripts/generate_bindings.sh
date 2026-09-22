#!/usr/bin/env bash
set -euo pipefail

# Generate TypeScript bindings from compiled DAR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export PATH="$HOME/.daml/bin:$PATH"

DAR_FILE="$ROOT_DIR/.daml/dist/ref-canton-0.0.1.dar"
OUT_DIR="$ROOT_DIR/backend/daml-js"

echo "Building DAR..."
(cd "$ROOT_DIR" && daml build)

echo "Generating TypeScript bindings into $OUT_DIR..."
mkdir -p "$OUT_DIR"
daml codegen js "$DAR_FILE" -o "$OUT_DIR"

echo "TypeScript bindings generated successfully!"
