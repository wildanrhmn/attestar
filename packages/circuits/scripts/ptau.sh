#!/usr/bin/env bash
# Download a Powers of Tau (phase 1) file. Usage: bash scripts/ptau.sh [POWER]
# POWER must be >= ceil(log2(constraints)). depth-2 test ~ power 12; depth-10 ~ power 20.
set -euo pipefail

POWER="${1:-12}"
OUT_DIR="build/ptau"
OUT="${OUT_DIR}/pot${POWER}.ptau"
URL="https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${POWER}.ptau"

mkdir -p "${OUT_DIR}"
if [ -f "${OUT}" ]; then
  echo "ptau already present: ${OUT}"
  exit 0
fi

echo "downloading ${URL}"
curl -L --fail -o "${OUT}" "${URL}"
echo "saved ${OUT}"
