import fs from "node:fs";

const dir = "build/solvency_test";
const f = JSON.parse(fs.readFileSync(`${dir}/fixtures.json`, "utf8"));

fs.writeFileSync(
  `${dir}/arg_vk.json`,
  JSON.stringify({ alpha: f.alpha, beta: f.beta, gamma: f.gamma, delta: f.delta, ic: f.ic }),
);
fs.writeFileSync(
  `${dir}/arg_proof.json`,
  JSON.stringify({ a: f.proof_a, b: f.proof_b, c: f.proof_c }),
);
fs.writeFileSync(`${dir}/arg_pub.json`, JSON.stringify(f.pub));

const badPub = f.pub.slice();
const flipped = badPub[1].slice(0, -1) + (badPub[1].endsWith("0") ? "1" : "0");
badPub[1] = flipped;
fs.writeFileSync(`${dir}/arg_pub_bad.json`, JSON.stringify(badPub));

console.log("arg files written to", dir);
