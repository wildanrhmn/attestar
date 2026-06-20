#!/usr/bin/env bash
# Provide a Powers of Tau (phase 1, prepared for phase 2) file.
# Usage: bash scripts/ptau.sh [POWER]
# POWER must be >= ceil(log2(constraints)). depth-2 test ~ power 13.
# Tries a download mirror first, then falls back to local generation (no network).
set -euo pipefail

POWER="${1:-13}"
OUT_DIR="build/ptau"
OUT="${OUT_DIR}/pot${POWER}.ptau"
SNARKJS="${SNARKJS:-npx snarkjs}"

mkdir -p "${OUT_DIR}"
if [ -f "${OUT}" ]; then
  echo "ptau already present: ${OUT}"
  exit 0
fi

PADDED=$(printf "%02d" "${POWER}")
for URL in \
  "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_${PADDED}.ptau" \
  "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${PADDED}.ptau"; do
  echo "trying ${URL}"
  if curl -L --fail -s -o "${OUT}" "${URL}"; then
    echo "downloaded ${OUT}"
    exit 0
  fi
  rm -f "${OUT}"
done

echo "download failed; generating powers of tau locally (power ${POWER})"
TMP="${OUT_DIR}/_pot${POWER}"
${SNARKJS} powersoftau new bn128 "${POWER}" "${TMP}_0.ptau" -v
${SNARKJS} powersoftau contribute "${TMP}_0.ptau" "${TMP}_1.ptau" \
  --name="attestar-dev" -v -e="$(head -c 64 /dev/urandom | base64)"
${SNARKJS} powersoftau prepare phase2 "${TMP}_1.ptau" "${OUT}" -v
rm -f "${TMP}_0.ptau" "${TMP}_1.ptau"
echo "generated ${OUT}"
