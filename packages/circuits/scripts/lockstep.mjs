import fs from "node:fs";
import * as snarkjs from "snarkjs";
import { MerkleSumTree, buildCircuitInput } from "../../sdk/dist/index.js";

const DEPTH = 2;
const BUILD = "build/solvency_test";

const holders = [
  { userId: 111n, balance: 5000n },
  { userId: 222n, balance: 3000n },
  { userId: 333n, balance: 1500n },
];

const tree = await MerkleSumTree.build(holders, DEPTH);
const input = buildCircuitInput(holders, DEPTH);

const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  input,
  `${BUILD}/solvency_test_js/solvency_test.wasm`,
  `${BUILD}/solvency_test.zkey`,
);

const circuitRoot = BigInt(publicSignals[0]);
const circuitTotal = BigInt(publicSignals[1]);

const vkey = JSON.parse(fs.readFileSync(`${BUILD}/solvency_test.vkey.json`, "utf8"));
const proofOk = await snarkjs.groth16.verify(vkey, publicSignals, proof);

const incl = tree.proofFor(0);
const inclOk = await MerkleSumTree.verifyProof(incl);

const rootMatch = circuitRoot === tree.root;
const totalMatch = circuitTotal === tree.total;

console.log("SDK root     :", tree.root.toString());
console.log("circuit root :", circuitRoot.toString());
console.log("SDK total    :", tree.total.toString());
console.log("circuit total:", circuitTotal.toString());
console.log("");
console.log("root match        :", rootMatch);
console.log("total match       :", totalMatch);
console.log("proof verifies    :", proofOk);
console.log("inclusion verifies:", inclOk);

const allOk = rootMatch && totalMatch && proofOk && inclOk && tree.total === 9500n;
console.log("");
console.log(allOk ? "LOCKSTEP OK" : "LOCKSTEP FAILED");
process.exit(allOk ? 0 : 1);
