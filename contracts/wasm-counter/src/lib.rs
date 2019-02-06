static COUNTER_KEY: [u8; 32] = [
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

#[owasm_abi_derive::contract]
trait WasmCounter {
    fn constructor(&mut self) {
        owasm_ethereum::write(&COUNTER_KEY.into(), &U256::zero().into());
    }

    #[constant]
    fn getCounter(&mut self) -> U256 {
        U256::from_big_endian(&owasm_ethereum::read(&COUNTER_KEY.into()))
    }

    fn incrementCounter(&mut self) {
        owasm_ethereum::write(&COUNTER_KEY.into(), &(self.getCounter() + 1).into());
    }
}
