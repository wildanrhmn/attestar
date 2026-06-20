#![no_std]

// Minimal demo stablecoin for Attestar's testnet demo. It exposes just enough of the
// token interface for the Attestar contract to read reserves (`balance`) and for the
// demo to move them around (`mint`, `transfer`, `burn`). It is NOT a full SEP-41 token
// and is for demonstration only.

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
enum DataKey {
    Balance(Address),
}

fn read(env: &Env, who: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(who.clone()))
        .unwrap_or(0)
}

fn write(env: &Env, who: &Address, amount: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::Balance(who.clone()), &amount);
}

#[contract]
pub struct MockToken;

#[contractimpl]
impl MockToken {
    pub fn mint(env: Env, to: Address, amount: i128) {
        write(&env, &to, read(&env, &to) + amount);
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        read(&env, &id)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let fb = read(&env, &from);
        if fb < amount {
            panic!("insufficient balance");
        }
        write(&env, &from, fb - amount);
        write(&env, &to, read(&env, &to) + amount);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let fb = read(&env, &from);
        if fb < amount {
            panic!("insufficient balance");
        }
        write(&env, &from, fb - amount);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn mint_transfer_burn() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(MockToken, ());
        let client = MockTokenClient::new(&env, &id);
        let a = Address::generate(&env);
        let b = Address::generate(&env);

        client.mint(&a, &1000);
        assert_eq!(client.balance(&a), 1000);

        client.transfer(&a, &b, &400);
        assert_eq!(client.balance(&a), 600);
        assert_eq!(client.balance(&b), 400);

        client.burn(&a, &100);
        assert_eq!(client.balance(&a), 500);
    }
}
