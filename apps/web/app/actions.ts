"use server";

import { attestar, token, issuerAddress } from "@/lib/stellar";
import { proveSolvency, inclusionFor } from "@/lib/prover";
import type { Holder } from "@attestar/sdk";

export interface HolderInput {
  userId: string;
  balance: string;
}

function toHolders(hs: HolderInput[]): Holder[] {
  return hs
    .filter((h) => h.userId.trim() !== "" && h.balance.trim() !== "")
    .map((h) => ({ userId: BigInt(h.userId), balance: BigInt(h.balance) }));
}

export interface StateView {
  epoch: string | null;
  solvent: boolean | null;
  totalLiabilities: string | null;
  onchainReserves: string;
  attestedReserves: string | null;
  rootHex: string | null;
  timestamp: string | null;
}

export async function getState(): Promise<StateView> {
  const [latest, bal] = await Promise.all([
    attestar()
      .latest()
      .then((t) => t.result),
    token()
      .balance({ id: issuerAddress() })
      .then((t) => t.result),
  ]);

  if (!latest) {
    return {
      epoch: null,
      solvent: null,
      totalLiabilities: null,
      onchainReserves: bal.toString(),
      attestedReserves: null,
      rootHex: null,
      timestamp: null,
    };
  }

  return {
    epoch: latest.epoch.toString(),
    solvent: latest.solvent,
    totalLiabilities: latest.total_liabilities.toString(),
    onchainReserves: bal.toString(),
    attestedReserves: (latest.onchain_reserves + latest.fiat_reserves).toString(),
    rootHex: Buffer.from(latest.root).toString("hex"),
    timestamp: latest.timestamp.toString(),
  };
}

export interface TxResult {
  ok: boolean;
  hash?: string;
  epoch?: string;
  solvent?: boolean;
  error?: string;
}

export async function publishAttestation(holdersInput: HolderInput[]): Promise<TxResult> {
  try {
    const holders = toHolders(holdersInput);
    if (holders.length === 0) return { ok: false, error: "Add at least one holder." };

    const { proof, root, total } = await proveSolvency(holders);
    const client = attestar();
    const latest = (await client.latest()).result;
    const epoch = latest ? BigInt(latest.epoch) + 1n : 1n;

    const tx = await client.submit_attestation({
      epoch,
      proof,
      root,
      total_liabilities: total,
      fiat_reserves: 0n,
      fiat_sig: Buffer.alloc(64),
    });
    const sent = await tx.signAndSend();
    const after = (await client.latest()).result;

    return {
      ok: true,
      hash: sent.sendTransactionResponse?.hash,
      epoch: epoch.toString(),
      solvent: after?.solvent,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function drainReserves(amount: string): Promise<TxResult> {
  try {
    const tx = await token().burn({ from: issuerAddress(), amount: BigInt(amount) });
    const sent = await tx.signAndSend();
    return { ok: true, hash: sent.sendTransactionResponse?.hash };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function mintReserves(amount: string): Promise<TxResult> {
  try {
    const tx = await token().mint({ to: issuerAddress(), amount: BigInt(amount) });
    const sent = await tx.signAndSend();
    return { ok: true, hash: sent.sendTransactionResponse?.hash };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface InclusionResult {
  ok: boolean;
  root: string;
  total: string;
  balance: string;
  pathLength: number;
}

export async function checkInclusion(
  holdersInput: HolderInput[],
  index: number,
): Promise<InclusionResult> {
  return inclusionFor(toHolders(holdersInput), index);
}
