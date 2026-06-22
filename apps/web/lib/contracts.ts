"use client";

import { Client as Attestar } from "attestar-client";
import { Client as Token } from "mock-token-client";

const PASS =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";
const ATTESTAR_ID = process.env.NEXT_PUBLIC_ATTESTAR_ID!;
const TOKEN_ID = process.env.NEXT_PUBLIC_TOKEN_ID!;
const READER = process.env.NEXT_PUBLIC_RESERVE_HOLDER ?? "";

type Signer = (
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string },
) => Promise<{ signedTxXdr: string; signerAddress?: string }>;

export function attestarSigner(publicKey: string, signTransaction: Signer) {
  return new Attestar({
    contractId: ATTESTAR_ID,
    networkPassphrase: PASS,
    rpcUrl: RPC,
    publicKey,
    signTransaction,
  });
}

export function tokenSigner(publicKey: string, signTransaction: Signer) {
  return new Token({
    contractId: TOKEN_ID,
    networkPassphrase: PASS,
    rpcUrl: RPC,
    publicKey,
    signTransaction,
  });
}

export function attestarReader(publicKey: string = READER) {
  return new Attestar({ contractId: ATTESTAR_ID, networkPassphrase: PASS, rpcUrl: RPC, publicKey });
}

export function tokenReader(publicKey: string = READER) {
  return new Token({ contractId: TOKEN_ID, networkPassphrase: PASS, rpcUrl: RPC, publicKey });
}

export const contractIds = { attestar: ATTESTAR_ID, token: TOKEN_ID, reserveHolder: READER };
