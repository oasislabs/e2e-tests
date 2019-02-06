static A_KEY: [u8; 32] = [
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

#[owasm_abi_derive::contract]
trait DeployedRust {
    fn constructor(&mut self) {
        // since the solidity version starts at 1
        owasm_ethereum::write(&A_KEY.into(), &(U256::from(1)).into());
    }

    #[constant]
    fn a(&mut self) -> U256 {
        U256::from_big_endian(&owasm_ethereum::read(&A_KEY.into()))
    }

    fn set_a(&mut self, a: U256) {
        owasm_ethereum::write(&A_KEY.into(), &(a).into());
    }
}
