import "server-only";
import path from "node:path";
import * as snarkjs from "snarkjs";
import {
  MerkleSumTree,
  buildCircuitInput,
  encodeProof,
  fieldToBytes,
  type Holder,
} from "@attestar/sdk";

export const DEMO_DEPTH = 4;

const CIRCUIT_DIR = path.join(
  process.cwd(),
  "..",
  "..",
  "packages",
  "circuits",
  "build",
  "solvency_demo",
);

export interface SolvencyProof {
  proof: { a: Buffer; b: Buffer; c: Buffer };
  root: Buffer;
  rootField: bigint;
  total: bigint;
}

export async function proveSolvency(holders: Holder[]): Promise<SolvencyProof> {
  const tree = await MerkleSumTree.build(holders, DEMO_DEPTH);
  const input = buildCircuitInput(holders, DEMO_DEPTH);

  const { proof } = await snarkjs.groth16.fullProve(
    input,
    path.join(CIRCUIT_DIR, "solvency_demo_js", "solvency_demo.wasm"),
    path.join(CIRCUIT_DIR, "solvency_demo.zkey"),
  );

  const enc = encodeProof(proof);
  return {
    proof: {
      a: Buffer.from(enc.a),
      b: Buffer.from(enc.b),
      c: Buffer.from(enc.c),
    },
    root: Buffer.from(fieldToBytes(tree.root)),
    rootField: tree.root,
    total: tree.total,
  };
}

export async function inclusionFor(holders: Holder[], index: number) {
  const tree = await MerkleSumTree.build(holders, DEMO_DEPTH);
  const proof = tree.proofFor(index);
  const ok = await MerkleSumTree.verifyProof(proof);
  return {
    ok,
    root: tree.root.toString(),
    total: tree.total.toString(),
    balance: proof.balance.toString(),
    pathLength: proof.siblings.length,
  };
}
