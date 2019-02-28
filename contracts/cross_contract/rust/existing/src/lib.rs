use deployed_abi::*;
use oasis_std::prelude::*;

static ADDRESS_KEY: [u8; 32] = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
];

#[contract]
trait ExistingRust {
    /// deployed_address is the address this contract references.
    /// Saves it in storage so that we can call it in methods.
    fn constructor(&mut self, deployed_address: Address) {
        let value = H256::from(deployed_address);
        write(&ADDRESS_KEY.into(), &value.into());
    }

    #[constant]
    fn get_a(&mut self) -> U256 {
        deployed_rust_client().a()
    }

    fn set_a(&mut self, a: U256) {
        deployed_rust_client().set_a(a);
    }
}

/// Returns a client through which we make calls to another contract.
fn deployed_rust_client() -> DeployedRustClient {
    DeployedRustClient::new(get_deployed_address())
}

fn get_deployed_address() -> Address {
    let value: [u8; 32] = read(&ADDRESS_KEY.into());
    // slice starting from 12 since we store the 20 byte Address into the 32 byte storage
    Address::from(&value[12..])
}
