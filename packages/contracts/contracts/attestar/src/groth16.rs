use soroban_sdk::{contracttype, BytesN, Env, Vec};

// BN254 Groth16 artifacts, byte-encoded to match snarkjs output.
// G1 affine points are 64 bytes (x || y), G2 affine points 128 bytes.

#[contracttype]
#[derive(Clone)]
pub struct Proof {
    pub a: BytesN<64>,
    pub b: BytesN<128>,
    pub c: BytesN<64>,
}

#[contracttype]
#[derive(Clone)]
pub struct VerifyingKey {
    pub alpha: BytesN<64>,
    pub beta: BytesN<128>,
    pub gamma: BytesN<128>,
    pub delta: BytesN<128>,
    // ic length must equal (number of public signals) + 1.
    pub ic: Vec<BytesN<64>>,
}

// PENDING (Day 4): BN254 Groth16 verification using Stellar's host functions.
//
// Verifies:  e(A, B) == e(alpha, beta) * e(vk_x, gamma) * e(C, delta)
// where      vk_x = ic[0] + sum_i (public_i * ic[i + 1])
//
// vk_x is a BN254 multi-scalar multiplication (Protocol 26 host function); the
// equality is a single pairing-product check (Protocol 25 host function). Public
// inputs are the circuit's public signals [root, total] as BN254 scalar-field
// elements. Wiring and the on-chain verification test are tracked in docs/DESIGN.md.
//
// This intentionally traps until wired, rather than returning a misleading result.
pub fn verify(
    env: &Env,
    vk: &VerifyingKey,
    proof: &Proof,
    public_inputs: &Vec<BytesN<32>>,
) -> bool {
    let _ = (env, vk, proof, public_inputs);
    panic!("groth16 verification pending wiring (see docs/DESIGN.md Day 4)")
}
