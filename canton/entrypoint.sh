#!/usr/bin/env bash
# canton/entrypoint.sh
# Entrypoint for Canton Multi-Participant Container

set -e

echo "==================================================================="
echo " Starting RefCanton Multi-Participant Synchronizer & Node Cluster"
echo " Canton Version : 3.4.11"
echo " Topology        : 1 Synchronizer + 3 Isolated Participant Nodes"
echo "==================================================================="

# Ensure log and dar directories exist
mkdir -p /canton/log /canton/dars

# Execute Canton daemon with bootstrap script
exec java ${JAVA_OPTS:--Xms512m -Xmx2048m} \
  -jar /canton/bin/canton.jar daemon \
  -c /canton/canton.conf \
  --bootstrap /canton/bootstrap.canton \
  --log-profile container \
  --no-tty
