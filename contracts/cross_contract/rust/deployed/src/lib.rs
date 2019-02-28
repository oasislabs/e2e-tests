use oasis_std::prelude::*;

static A_KEY: [u8; 32] = [
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

#[contract]
trait DeployedRust {
    fn constructor(&mut self) {
        // since the solidity version starts at 1
        write(&A_KEY.into(), &(U256::from(1)).into());
    }

    #[constant]
    fn a(&mut self) -> U256 {
        U256::from_big_endian(&read(&A_KEY.into()))
    }

    fn set_a(&mut self, a: U256) {
        write(&A_KEY.into(), &(a).into());
    }
}
