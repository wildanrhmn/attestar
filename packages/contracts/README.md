# @attestar/contracts

Soroban (Rust) workspace for Attestar's on-chain verifier and attestation registry.

## Contract: `attestar`

Records a per-epoch solvency attestation for a token issuer.

| Function | Purpose |
| --- | --- |
| `initialize(admin, reserve_token, reserve_holder, attestor)` | one-time setup; `attestor` is the ed25519 pubkey allowed to sign off-chain fiat-reserve figures |
| `set_verifier(vk)` | admin stores the Groth16 verifying key (from `@attestar/circuits`) |
| `submit_attestation(epoch, proof, root, total_liabilities, fiat_reserves, fiat_sig)` | verifies the ZK proof, checks the fiat-reserve signature, reads on-chain reserves, records `solvent = reserves >= liabilities` |
| `get_attestation(epoch)` / `latest()` / `is_solvent(epoch)` | read the registry |

### What is implemented vs pending

- Implemented and testable now: registry storage, on-chain reserve read (`TokenClient::balance`),
  signed fiat-reserve attestation (`ed25519_verify`), solvency comparison, events, getters.
- Pending (Day 4): `groth16::verify` BN254 pairing check. It currently traps on purpose rather
  than returning a misleading result. See `src/groth16.rs` and `docs/DESIGN.md`.

### Public signal layout

The circuit exposes `[root, total]`. The contract reconstructs these as BN254 scalar-field
elements: `root` is the 32-byte Poseidon root; `total` is `total_liabilities` big-endian, left
padded to 32 bytes. This ordering must match the circuit output order.

## Build and test

```bash
# from this directory, with the WSL Rust + stellar toolchain on PATH
cargo test                 # runs the registry/getter tests (no proof needed)
stellar contract build     # produces the wasm for deployment
```

> Confirm the `soroban-sdk` version in `Cargo.toml` matches the installed protocol (P25/P26 expose
> the BN254 + Poseidon host functions) before the first build.
