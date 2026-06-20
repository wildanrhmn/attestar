# Attestar

**Continuous, provable solvency for stablecoin and RWA issuers on Stellar.**

Attestar lets a token issuer prove, on-chain and every epoch, that its reserves cover the full
sum of all holder balances, **without revealing any individual balance**. Every holder can
independently verify that their own balance was counted in the total, and a regulator with a view
key can audit the figures. The proof is a zero-knowledge SNARK verified inside a Soroban smart
contract.

This is the cryptographic, always-on complement to the monthly CPA reserve attestation that
regulations like the US GENIUS Act and EU MiCA now require.

> Built for **Stellar Hacks: Real-World ZK** (June 2026). The full design, rationale, and the
> research that validated the idea live in [`docs/DESIGN.md`](docs/DESIGN.md). Read that first.

## Why this matters

- Proof-of-reserves today is an off-chain, monthly, manual accounting attestation. It is slow,
  trust-based, and gameable. In April 2026 Zondacrypto kept claiming solvency while its hot wallet
  drained 99.7%.
- Stellar is where real stablecoins now live (USDC; MoneyGram's MGUSD launched June 2026).
- Stellar Protocol 25 and 26 added native BN254 and Poseidon host functions, making SNARK
  verification on-chain cheap enough to do continuously.

Attestar turns "trust our monthly PDF" into "verify the math, live, on-chain."

## How it works

1. The issuer builds a **Merkle-sum tree** over all holder balances (each leaf is a Poseidon hash
   of the holder secret and balance; every node also carries the sum of its subtree).
2. A **Circom / Groth16 circuit** proves, in zero knowledge, that the published root commits to a
   set of non-negative balances summing to `total_liabilities`. Per-balance range checks block the
   classic negative-balance attack.
3. A **Soroban contract** verifies the proof using Stellar's BN254 host functions, reads the
   issuer's on-chain reserve balance, optionally adds a signed off-chain fiat-reserve attestation,
   and records `solvent = reserves >= total_liabilities` for the epoch.
4. Each **holder** verifies a Merkle inclusion path proving their balance is part of the proven
   total. A **regulator** uses a view key for full selective disclosure.

### The honest boundary

ZK proves the liabilities sum and the on-chain reserves trustlessly. It cannot prove that
off-chain fiat reserves exist; that figure enters as a signed attestation (oracle). Attestar makes
everything around the monthly CPA attestation continuous and verifiable. It does not replace the
auditor.

## Monorepo layout

| Path | What |
| --- | --- |
| `packages/circuits` | Circom solvency circuit (the ZK core) and proving scripts |
| `packages/sdk` | TypeScript merkle-sum tree + witness builder (kept in lockstep with the circuit) |
| `packages/contracts` | Soroban verifier + attestation registry contract (Rust) |
| `apps/web` | Next.js app: issuer dashboard, holder inclusion check, auditor view |
| `docs/DESIGN.md` | Master design doc |

## Toolchain

- Node + pnpm (JS workspaces), Rust + `stellar` CLI (Soroban), `circom` + `snarkjs` (proving).
- On Windows, the Rust/circom/Stellar toolchain runs in WSL. See `docs/DESIGN.md` for setup.

## Status

On-chain ZK verification works. A real Groth16 proof is verified inside the Soroban contract on
Stellar testnet ([on-chain tx](https://stellar.expert/explorer/testnet/tx/94573ab6e3c3cf8768c6553fc8b819ead12fe13170e2168b86d56426c9ab4c58)),
and a tampered input is correctly rejected. The SDK and circuit produce identical Merkle-sum
roots (proven by `packages/circuits/scripts/lockstep.mjs`). The attestation registry, reserve
reads, and signed fiat-attestation path are implemented.

Remaining for the demo: end-to-end `submit_attestation` flow with a reserve token, the web app
(issuer / holder / auditor), and the demo video.

- Testnet contract: `CDEGNQIHKDYXE7PNV6SHJ6OENSVDPLUEL5KS7TDHTJQIAQBBJMT4U5QS`

## License

MIT
