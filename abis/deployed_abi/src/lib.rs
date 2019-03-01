/// This file was generated with owasm-gen.
/// See runtime-ethereum/contracts/cross_contract/rust/deployed for the
/// associated contract.

use oasis_std::{derive::eth_abi, prelude::*};

#[eth_abi(DeployedRustEndpoint, DeployedRustClient)]
pub trait DeployedRust {
    fn constructor(&mut self);
    #[constant]
    fn a(&mut self) -> U256;
    fn set_a(&mut self, a: U256);
}
