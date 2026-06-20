use soroban_sdk::{
    contracttype,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
    BytesN, Env, Vec, U256,
};

// BN254 Groth16 artifacts, byte-encoded to match snarkjs output and the Soroban
// host serialization. G1 = be(X) || be(Y) (64 bytes). G2 = be(X.c1) || be(X.c0) ||
// be(Y.c1) || be(Y.c0) (128 bytes, imaginary component first). Encoding is produced
// off-chain by scripts/encode.mjs.

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

// Verifies a Groth16 proof on BN254 using Stellar's host functions.
//
// Accepts iff  e(A, B) == e(alpha, beta) * e(vk_x, gamma) * e(C, delta)
// where        vk_x = ic[0] + sum_i (public_i * ic[i + 1])
//
// vk_x is computed with a single G1 multi-scalar multiplication (P26 host fn). The
// equality is checked as a multi-pairing product equal to 1 (P25 host fn), using
// the negation of A:  e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1.
pub fn verify(
    env: &Env,
    vk: &VerifyingKey,
    proof: &Proof,
    public_inputs: &Vec<BytesN<32>>,
) -> bool {
    let n = public_inputs.len();
    if vk.ic.len() != n + 1 {
        return false;
    }
    let bn = env.crypto().bn254();

    let mut points: Vec<Bn254G1Affine> = Vec::new(env);
    let mut scalars: Vec<Bn254Fr> = Vec::new(env);
    points.push_back(Bn254G1Affine::from_bytes(vk.ic.get_unchecked(0)));
    scalars.push_back(Bn254Fr::from_u256(U256::from_u32(env, 1)));
    for i in 0..n {
        points.push_back(Bn254G1Affine::from_bytes(vk.ic.get_unchecked(i + 1)));
        scalars.push_back(Bn254Fr::from_bytes(public_inputs.get_unchecked(i)));
    }
    let vk_x = bn.g1_msm(points, scalars);

    let neg_a = -Bn254G1Affine::from_bytes(proof.a.clone());
    let b = Bn254G2Affine::from_bytes(proof.b.clone());
    let c = Bn254G1Affine::from_bytes(proof.c.clone());
    let alpha = Bn254G1Affine::from_bytes(vk.alpha.clone());
    let beta = Bn254G2Affine::from_bytes(vk.beta.clone());
    let gamma = Bn254G2Affine::from_bytes(vk.gamma.clone());
    let delta = Bn254G2Affine::from_bytes(vk.delta.clone());

    let mut vp1: Vec<Bn254G1Affine> = Vec::new(env);
    vp1.push_back(neg_a);
    vp1.push_back(alpha);
    vp1.push_back(vk_x);
    vp1.push_back(c);

    let mut vp2: Vec<Bn254G2Affine> = Vec::new(env);
    vp2.push_back(b);
    vp2.push_back(beta);
    vp2.push_back(gamma);
    vp2.push_back(delta);

    bn.pairing_check(vp1, vp2)
}
