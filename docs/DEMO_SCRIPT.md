# Attestar — 2 to 3 minute demo script

A shot-by-shot script for the submission video. Talking points on the left, what to show on the
right. Keep it calm and concrete; the live transactions carry the weight.

## 0:00 – 0:20 · The problem

> "Proof-of-reserves today is a monthly PDF. An accountant signs a document, and everyone takes it
> on faith. In April 2026 a regulated exchange kept publishing solvency reports while its reserves
> drained to nothing. The proof always arrives too late, and you can never check it yourself."

Show: the hero. Headline "Solvency you can verify, not just trust." and the live green SOLVENT seal.

## 0:20 – 0:45 · What Attestar is

> "Attestar proves a stablecoin issuer's reserves cover every holder balance, on-chain, every
> epoch, without revealing a single account. The proof is a zero-knowledge SNARK, verified inside a
> Soroban smart contract on Stellar."

Show: scroll past the hero stats (epoch, reserves, liabilities) into the three steps.

## 0:45 – 1:10 · How it works

> "The issuer builds a Merkle-sum tree of every balance. A Groth16 circuit proves the published
> total is the honest sum of non-negative balances, revealing none of them. A Soroban contract
> checks that proof with Stellar's BN254 host functions, reads the on-chain reserves, and records
> the epoch as solvent only if reserves cover the proven liabilities."

Show: the Commit / Prove / Verify panels.

## 1:10 – 2:15 · The live demo (the core)

> "Everything here is a real transaction on Stellar testnet. Here is the holder ledger, private to
> the issuer. I publish an attestation."

Show: the console. Click **Publish attestation**. Narrate while the proof generates and submits.

> "The proof was generated from the ledger and verified on-chain. Solvent. Here is the transaction."

Show: the SOLVENT seal, click **View transaction** to open stellar.expert briefly.

> "Now watch what happens when the issuer quietly drains the reserves."

Show: type a drain amount, click **Drain**. Reserves drop.

> "Same honest proof, same liabilities. But the reserves no longer cover them, so the contract
> records the truth."

Show: click **Publish attestation** again. The seal flips to red **INSOLVENT**.

> "No one can fake this. The proof can't lie about the liabilities, and the reserves are read
> straight from the chain. And any holder can check that their own balance was counted."

Show: click a holder chip under "Holder inclusion check"; show the confirmation line.

## 2:15 – 2:40 · The honest boundary and close

> "Zero-knowledge proves the liabilities and the on-chain reserves trustlessly. It can't prove a
> bank balance exists; that enters as a signed attestation. So Attestar doesn't replace the
> auditor, it makes everything around them continuous and verifiable. The ZK is doing the real
> work, and it's verified on Stellar."

Show: the footer (the honest-boundary note and the contract link on the explorer).

## Notes

- Reset to a clean solvent state before recording: click **Restore reserves**, then
  **Publish attestation**.
- If a transaction is slow, keep talking; the button shows "Generating proof and submitting
  on-chain".
- Have the contract open on stellar.expert in a second tab to show the attestation events.
