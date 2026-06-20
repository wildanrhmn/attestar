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

// PENDING: end-to-end submit_attestation tests need the Groth16 verifier wired
// (Day 4) and a Stellar Asset Contract reserve token for the balance read (Day 5).
// At that point assert: valid proof + solvent reserves -> solvent = true; drained
// reserves -> solvent = false; tampered total -> InvalidProof.
