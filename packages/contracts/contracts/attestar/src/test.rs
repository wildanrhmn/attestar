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
use soroban_sdk::{vec, Vec};

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
