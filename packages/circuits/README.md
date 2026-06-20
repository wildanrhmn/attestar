# @attestar/circuits

The zero-knowledge core of Attestar: a Circom circuit that proves an issuer's total liabilities
(the sum of all holder balances) commit to a published Merkle-sum root, with every balance range
checked, without revealing any individual balance.

## Files

- `circuits/lib/solvency_tree.circom` — the `Leaf`, `Node`, and `SolvencyTree(DEPTH, BITS)` templates.
- `circuits/solvency.circom` — main circuit, `DEPTH = 10` (up to 1024 holders).
- `circuits/solvency_test.circom` — `DEPTH = 2` (4 holders) for fast iteration.

## Public outputs

- `root` — Poseidon Merkle-sum root binding the full holder set.
- `total` — sum of all balances (the liabilities figure the contract compares against reserves).

Everything else (per-holder balances and ids) is private.

## Build

```bash
pnpm install                 # pulls circomlib + snarkjs into this package
bash scripts/ptau.sh 12      # phase-1 powers of tau (use 20 for the depth-10 main circuit)
pnpm build:test              # compile + setup the small depth-2 circuit
# pnpm build                 # the full depth-10 circuit (needs ptau power 20)
```

Artifacts land in `build/<name>/`:

- `<name>.zkey` prover key, `<name>.vkey.json` verifier key (consumed by the Soroban contract),
  and `<name>_js/<name>.wasm` witness generator.

## Design notes

- **Merkle-sum tree**: each leaf hash is `Poseidon(userId, balance)` and carries `sum = balance`;
  each internal node is `Poseidon(leftHash, leftSum, rightHash, rightSum)` with `sum = left + right`.
  The root therefore commits to both the membership set and the exact total.
- **Range checks are mandatory**: `Num2Bits(64)` on every balance blocks the negative-balance
  attack (faking lower liabilities with negative leaves).
- **Completeness** (no holder silently dropped) is enforced outside the circuit: each holder checks
  a Merkle inclusion path against the published root. The TS builder in `@attestar/sdk` produces
  identical roots and the inclusion paths, and must stay in lockstep with these templates.
- The trusted setup here is hackathon-grade (single phase-2 contribution). A production deployment
  needs a real multi-party ceremony.
