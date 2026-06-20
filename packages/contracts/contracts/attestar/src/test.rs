#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

fn setup(env: &Env) -> (AttestarContractClient<'_>, Address) {
    let contract_id = env.register(AttestarContract, ());
    let client = AttestarContractClient::new(env, &contract_id);
    let admin = Address::generate(env);
    let token = Address::generate(env);
    let holder = Address::generate(env);
    let attestor = BytesN::from_array(env, &[7u8; 32]);
    client.initialize(&admin, &token, &holder, &attestor);
    (client, admin)
}

#[test]
fn init_sets_up_empty_registry() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin) = setup(&env);
    assert_eq!(client.get_attestation(&1), None);
    assert_eq!(client.latest(), None);
    assert_eq!(client.is_solvent(&1), false);
}

#[test]
fn double_init_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin) = setup(&env);
    let again = client.try_initialize(
        &Address::generate(&env),
        &Address::generate(&env),
        &Address::generate(&env),
        &BytesN::from_array(&env, &[1u8; 32]),
    );
    assert_eq!(again, Err(Ok(Error::AlreadyInitialized)));
}

use crate::fixtures;
use crate::groth16::{self, Proof, VerifyingKey};
use ed25519_dalek::{Signer, SigningKey};
use soroban_sdk::token::StellarAssetClient;
use soroban_sdk::{vec, Vec};

// The depth-2 fixture proof commits to these public signals.
const FIXTURE_TOTAL: u128 = 9500;

fn attestor_signing_key() -> SigningKey {
    SigningKey::from_bytes(&[9u8; 32])
}

fn fiat_signature(sk: &SigningKey, epoch: u64, fiat: u128) -> [u8; 64] {
    let mut msg = [0u8; 24];
    msg[..8].copy_from_slice(&epoch.to_be_bytes());
    msg[8..].copy_from_slice(&fiat.to_be_bytes());
    sk.sign(&msg).to_bytes()
}

struct Harness<'a> {
    env: Env,
    client: AttestarContractClient<'a>,
    token_admin: StellarAssetClient<'a>,
    reserve_holder: Address,
    sk: SigningKey,
}

fn deploy_with_reserves(env: &Env) -> Harness<'_> {
    env.mock_all_auths();

    let issuer = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(issuer.clone());
    let token_addr = sac.address();
    let token_admin = StellarAssetClient::new(env, &token_addr);
    let reserve_holder = Address::generate(env);

    let sk = attestor_signing_key();
    let attestor = BytesN::from_array(env, &sk.verifying_key().to_bytes());

    let cid = env.register(AttestarContract, ());
    let client = AttestarContractClient::new(env, &cid);
    client.initialize(&issuer, &token_addr, &reserve_holder, &attestor);
    client.set_verifier(&make_vk(env));

    Harness {
        env: env.clone(),
        client,
        token_admin,
        reserve_holder,
        sk,
    }
}

fn submit(h: &Harness, epoch: u64, total: u128, fiat: u128) -> crate::Attestation {
    let proof = make_proof(&h.env);
    let root = bytesn(&h.env, &fixtures::PUB[0]);
    let sig = BytesN::from_array(&h.env, &fiat_signature(&h.sk, epoch, fiat));
    h.client
        .submit_attestation(&epoch, &proof, &root, &total, &fiat, &sig)
}

#[test]
fn solvent_when_reserves_cover_liabilities() {
    let env = Env::default();
    let h = deploy_with_reserves(&env);
    h.token_admin.mint(&h.reserve_holder, &12_000);

    let att = submit(&h, 1, FIXTURE_TOTAL, 0);

    assert!(att.solvent);
    assert_eq!(att.total_liabilities, FIXTURE_TOTAL);
    assert_eq!(att.onchain_reserves, 12_000);
    assert!(h.client.is_solvent(&1));
    assert_eq!(h.client.latest(), Some(att));
}

#[test]
fn insolvent_when_reserves_below_liabilities() {
    let env = Env::default();
    let h = deploy_with_reserves(&env);
    h.token_admin.mint(&h.reserve_holder, &5_000);

    let att = submit(&h, 1, FIXTURE_TOTAL, 0);

    assert!(!att.solvent);
    assert!(!h.client.is_solvent(&1));
}

#[test]
fn fiat_reserves_count_toward_solvency() {
    let env = Env::default();
    let h = deploy_with_reserves(&env);
    h.token_admin.mint(&h.reserve_holder, &5_000);

    // on-chain 5000 alone is short; a signed fiat attestation of 5000 tips it solvent.
    let att = submit(&h, 1, FIXTURE_TOTAL, 5_000);

    assert!(att.solvent);
    assert_eq!(att.onchain_reserves, 5_000);
    assert_eq!(att.fiat_reserves, 5_000);
}

#[test]
fn rejects_proof_with_mismatched_total() {
    let env = Env::default();
    let h = deploy_with_reserves(&env);
    h.token_admin.mint(&h.reserve_holder, &12_000);

    let proof = make_proof(&env);
    let root = bytesn(&env, &fixtures::PUB[0]);
    let sig = BytesN::from_array(&env, &fiat_signature(&h.sk, 1, 0));
    // claimed total (9999) does not match the total the proof commits to (9500)
    let res = h
        .client
        .try_submit_attestation(&1, &proof, &root, &9_999u128, &0u128, &sig);

    assert_eq!(res, Err(Ok(Error::InvalidProof)));
}

#[test]
fn rejects_duplicate_epoch() {
    let env = Env::default();
    let h = deploy_with_reserves(&env);
    h.token_admin.mint(&h.reserve_holder, &12_000);
    submit(&h, 1, FIXTURE_TOTAL, 0);

    let proof = make_proof(&env);
    let root = bytesn(&env, &fixtures::PUB[0]);
    let sig = BytesN::from_array(&env, &fiat_signature(&h.sk, 1, 0));
    let res = h
        .client
        .try_submit_attestation(&1, &proof, &root, &FIXTURE_TOTAL, &0u128, &sig);

    assert_eq!(res, Err(Ok(Error::EpochExists)));
}

fn bytesn<const N: usize>(env: &Env, a: &[u8; N]) -> BytesN<N> {
    BytesN::from_array(env, a)
}

fn make_vk(env: &Env) -> VerifyingKey {
    let mut ic = Vec::new(env);
    for p in fixtures::IC.iter() {
        ic.push_back(bytesn(env, p));
    }
    VerifyingKey {
        alpha: bytesn(env, &fixtures::ALPHA),
        beta: bytesn(env, &fixtures::BETA),
        gamma: bytesn(env, &fixtures::GAMMA),
        delta: bytesn(env, &fixtures::DELTA),
        ic,
    }
}

fn make_proof(env: &Env) -> Proof {
    Proof {
        a: bytesn(env, &fixtures::PROOF_A),
        b: bytesn(env, &fixtures::PROOF_B),
        c: bytesn(env, &fixtures::PROOF_C),
    }
}

#[test]
fn groth16_accepts_valid_proof() {
    let env = Env::default();
    let id = env.register(AttestarContract, ());
    let vk = make_vk(&env);
    let proof = make_proof(&env);
    let pubs = vec![
        &env,
        bytesn(&env, &fixtures::PUB[0]),
        bytesn(&env, &fixtures::PUB[1]),
    ];
    let ok = env.as_contract(&id, || groth16::verify(&env, &vk, &proof, &pubs));
    assert!(ok, "valid Groth16 proof should verify");
}

#[test]
fn groth16_rejects_tampered_public_input() {
    let env = Env::default();
    let id = env.register(AttestarContract, ());
    let vk = make_vk(&env);
    let proof = make_proof(&env);
    let mut bad_total = fixtures::PUB[1];
    bad_total[31] ^= 1;
    let pubs = vec![&env, bytesn(&env, &fixtures::PUB[0]), bytesn(&env, &bad_total)];
    let ok = env.as_contract(&id, || groth16::verify(&env, &vk, &proof, &pubs));
    assert!(!ok, "tampered public input must be rejected");
}
