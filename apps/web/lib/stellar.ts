import "server-only";
import { Keypair } from "@stellar/stellar-sdk";
import { basicNodeSigner } from "@stellar/stellar-sdk/contract";
import { Client as Attestar } from "attestar-client";
import { Client as Token } from "mock-token-client";

const PASS = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE!;
const RPC = process.env.NEXT_PUBLIC_RPC_URL!;
const ATTESTAR_ID = process.env.ATTESTAR_ID!;
const TOKEN_ID = process.env.TOKEN_ID!;

function issuer() {
  return Keypair.fromSecret(process.env.ISSUER_SECRET!);
}

function common(contractId: string) {
  const kp = issuer();
  const signer = basicNodeSigner(kp, PASS);
  return {
    contractId,
    networkPassphrase: PASS,
    rpcUrl: RPC,
    publicKey: kp.publicKey(),
    signTransaction: signer.signTransaction,
  };
}

export function attestar() {
  return new Attestar(common(ATTESTAR_ID));
}

export function token() {
  return new Token(common(TOKEN_ID));
}

export function issuerAddress() {
  return issuer().publicKey();
}
