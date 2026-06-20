#![no_std]

mod groth16;
pub use groth16::{Proof, VerifyingKey};

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Bytes,
    BytesN, Env, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    VerifierNotSet = 3,
    InvalidProof = 4,
    EpochExists = 5,
}

#[contracttype]
pub enum DataKey {
    Admin,
    ReserveToken,
    ReserveHolder,
    Attestor,
    Vk,
    LatestEpoch,
    Attestation(u64),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Attestation {
    pub epoch: u64,
    pub root: BytesN<32>,
    pub total_liabilities: u128,
    pub onchain_reserves: i128,
    pub fiat_reserves: u128,
    pub solvent: bool,
    pub timestamp: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AttestationPosted {
    #[topic]
    pub epoch: u64,
    pub solvent: bool,
    pub total_liabilities: u128,
    pub onchain_reserves: i128,
}

#[contract]
pub struct AttestarContract;

#[contractimpl]
impl AttestarContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        reserve_token: Address,
        reserve_holder: Address,
        attestor: BytesN<32>,
    ) -> Result<(), Error> {
        let store = env.storage().instance();
        if store.has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        store.set(&DataKey::Admin, &admin);
        store.set(&DataKey::ReserveToken, &reserve_token);
        store.set(&DataKey::ReserveHolder, &reserve_holder);
        store.set(&DataKey::Attestor, &attestor);
        Ok(())
    }

    pub fn set_verifier(env: Env, vk: VerifyingKey) -> Result<(), Error> {
        let admin = Self::admin(&env)?;
        admin.require_auth();
        env.storage().instance().set(&DataKey::Vk, &vk);
        Ok(())
    }

    pub fn submit_attestation(
        env: Env,
        epoch: u64,
        proof: Proof,
        root: BytesN<32>,
        total_liabilities: u128,
        fiat_reserves: u128,
        fiat_sig: BytesN<64>,
    ) -> Result<Attestation, Error> {
        let admin = Self::admin(&env)?;
        admin.require_auth();

        if env.storage().persistent().has(&DataKey::Attestation(epoch)) {
            return Err(Error::EpochExists);
        }

        let vk: VerifyingKey = env
            .storage()
            .instance()
            .get(&DataKey::Vk)
            .ok_or(Error::VerifierNotSet)?;

        let public_inputs = Self::public_inputs(&env, &root, total_liabilities);
        if !groth16::verify(&env, &vk, &proof, &public_inputs) {
            return Err(Error::InvalidProof);
        }

        Self::verify_fiat(&env, epoch, fiat_reserves, &fiat_sig);

        let att = Self::record(&env, epoch, root, total_liabilities, fiat_reserves);
        Ok(att)
    }

    pub fn get_attestation(env: Env, epoch: u64) -> Option<Attestation> {
        env.storage().persistent().get(&DataKey::Attestation(epoch))
    }

    pub fn latest(env: Env) -> Option<Attestation> {
        let epoch: u64 = env.storage().instance().get(&DataKey::LatestEpoch)?;
        env.storage().persistent().get(&DataKey::Attestation(epoch))
    }

    pub fn is_solvent(env: Env, epoch: u64) -> bool {
        Self::get_attestation(env, epoch)
            .map(|a| a.solvent)
            .unwrap_or(false)
    }

    pub fn verify_proof(
        env: Env,
        vk: VerifyingKey,
        proof: Proof,
        public_inputs: Vec<BytesN<32>>,
    ) -> bool {
        groth16::verify(&env, &vk, &proof, &public_inputs)
    }
}

impl AttestarContract {
    fn admin(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    fn public_inputs(env: &Env, root: &BytesN<32>, total: u128) -> Vec<BytesN<32>> {
        let mut total_be = [0u8; 32];
        total_be[16..].copy_from_slice(&total.to_be_bytes());
        let mut inputs = Vec::new(env);
        inputs.push_back(root.clone());
        inputs.push_back(BytesN::from_array(env, &total_be));
        inputs
    }

    fn verify_fiat(env: &Env, epoch: u64, fiat_reserves: u128, sig: &BytesN<64>) {
        let attestor: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::Attestor)
            .expect("attestor not set");
        let mut msg = Bytes::new(env);
        msg.extend_from_slice(&epoch.to_be_bytes());
        msg.extend_from_slice(&fiat_reserves.to_be_bytes());
        env.crypto().ed25519_verify(&attestor, &msg, sig);
    }

    fn record(
        env: &Env,
        epoch: u64,
        root: BytesN<32>,
        total_liabilities: u128,
        fiat_reserves: u128,
    ) -> Attestation {
        let reserve_token: Address = env.storage().instance().get(&DataKey::ReserveToken).unwrap();
        let reserve_holder: Address =
            env.storage().instance().get(&DataKey::ReserveHolder).unwrap();
        let onchain_reserves = token::TokenClient::new(env, &reserve_token).balance(&reserve_holder);

        let total_reserves = (onchain_reserves as i128).saturating_add(fiat_reserves as i128);
        let solvent = total_reserves >= total_liabilities as i128;

        let att = Attestation {
            epoch,
            root,
            total_liabilities,
            onchain_reserves,
            fiat_reserves,
            solvent,
            timestamp: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Attestation(epoch), &att);
        env.storage().instance().set(&DataKey::LatestEpoch, &epoch);

        AttestationPosted {
            epoch,
            solvent: att.solvent,
            total_liabilities: att.total_liabilities,
            onchain_reserves: att.onchain_reserves,
        }
        .publish(env);
        att
    }
}

#[cfg(test)]
mod fixtures;
#[cfg(test)]
mod test;
