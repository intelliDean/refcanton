#!/usr/bin/env bash
# scripts/run_docker.sh
# Build and launch RefCanton multi-participant Canton cluster and web application with Docker Compose

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==================================================================="
echo " RefCanton — Multi-Participant Canton Docker Compose Launcher"
echo "==================================================================="

# 1. Compile Daml DAR if missing
if [ ! -f "$REPO_ROOT/.daml/dist/ref-canton-0.0.1.dar" ]; then
  echo "[1/4] Compiling Daml Smart Contracts (.dar package)..."
  if command -v daml >/dev/null 2>&1; then
    daml build
  elif [ -f "$HOME/.daml/bin/daml" ]; then
    "$HOME/.daml/bin/daml" build
  else
    echo "Daml binary not found in PATH or ~/.daml/bin. Using existing DAR if present."
  fi
else
  echo "[1/4] Daml DAR is up-to-date (.daml/dist/ref-canton-0.0.1.dar)"
fi

# 2. Stage local Canton JAR if available to speed up Docker build
mkdir -p "$REPO_ROOT/canton/bin"
if [ ! -f "$REPO_ROOT/canton/bin/canton.jar" ] && [ -f "$HOME/.daml/sdk/3.4.11/canton/canton.jar" ]; then
  echo "[2/4] Staging local Canton 3.4.11 fat JAR from host SDK..."
  cp "$HOME/.daml/sdk/3.4.11/canton/canton.jar" "$REPO_ROOT/canton/bin/canton.jar"
else
  echo "[2/4] Canton build context ready."
fi

# 3. Build Docker images
echo "[3/4] Building Docker images..."
docker compose build

# 4. Launch containers
echo "[4/4] Launching Canton multi-participant cluster and RefCanton app..."
docker compose up -d

echo ""
echo "==================================================================="
echo " RefCanton Cluster Successfully Deployed via Docker Compose!"
echo "==================================================================="
echo " Web Application & API Gateway : http://localhost:4000"
echo " Canton Synchronizer (Domain)  : localhost:5001 (Sequencer), localhost:5003 (Mediator)"
echo " Participant 1 (Borrower)      : localhost:5011 (gRPC), localhost:5014 (HTTP)"
echo " Participant 2 (Lender A)      : localhost:5021 (gRPC), localhost:5024 (HTTP)"
echo " Participant 3 (Lender B)      : localhost:5031 (gRPC), localhost:5034 (HTTP)"
echo "==================================================================="
echo " View logs with: docker compose logs -f"
echo " Stop with     : docker compose down"
echo "==================================================================="
