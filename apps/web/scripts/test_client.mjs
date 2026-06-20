import path from "node:path";
import * as snarkjs from "snarkjs";
import { Keypair } from "@stellar/stellar-sdk";
import { basicNodeSigner } from "@stellar/stellar-sdk/contract";
import { Client as Attestar } from "attestar-client";
import { Client as Token } from "mock-token-client";
import {
  MerkleSumTree,
  buildCircuitInput,
  encodeProof,
  fieldToBytes,
} from "@attestar/sdk";

const PASS = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE;
const RPC = process.env.NEXT_PUBLIC_RPC_URL;
const kp = Keypair.fromSecret(process.env.ISSUER_SECRET);
const signer = basicNodeSigner(kp, PASS);
const opts = (id) => ({
  contractId: id,
  networkPassphrase: PASS,
  rpcUrl: RPC,
  publicKey: kp.publicKey(),
  signTransaction: signer.signTransaction,
});

const att = new Attestar(opts(process.env.ATTESTAR_ID));
const tok = new Token(opts(process.env.TOKEN_ID));

const latest = (await att.latest()).result;
console.log("latest before:", latest);

const bal = (await tok.balance({ id: kp.publicKey() })).result;
console.log("reserve balance:", bal);

const holders = [
  { userId: 1n, balance: 300000n },
  { userId: 2n, balance: 200000n },
  { userId: 3n, balance: 150000n },
];
const tree = await MerkleSumTree.build(holders, 4);
const input = buildCircuitInput(holders, 4);
const DIR = path.join(process.cwd(), "..", "..", "packages", "circuits", "build", "solvency_demo");
const { proof } = await snarkjs.groth16.fullProve(
  input,
  path.join(DIR, "solvency_demo_js", "solvency_demo.wasm"),
  path.join(DIR, "solvency_demo.zkey"),
);
const enc = encodeProof(proof);
const epoch = latest ? BigInt(latest.epoch) + 1n : 1n;
console.log("submitting epoch", epoch, "total", tree.total);

const tx = await att.submit_attestation({
  epoch,
  proof: { a: Buffer.from(enc.a), b: Buffer.from(enc.b), c: Buffer.from(enc.c) },
  root: Buffer.from(fieldToBytes(tree.root)),
  total_liabilities: tree.total,
  fiat_reserves: 0n,
  fiat_sig: Buffer.alloc(64),
});
const sent = await tx.signAndSend();
console.log("submit hash:", sent.sendTransactionResponse?.hash);

const latest2 = (await att.latest()).result;
console.log("latest after:", latest2);
