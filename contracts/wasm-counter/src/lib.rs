use oasis_std::prelude::*;

static COUNTER_KEY: [u8; 32] = [
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

#[contract]
trait WasmCounter {
    fn constructor(&mut self) {
        write(&COUNTER_KEY.into(), &U256::zero().into());
    }

    #[constant]
    fn getCounter(&mut self) -> U256 {
        U256::from_big_endian(&read(&COUNTER_KEY.into()))
    }

    fn incrementCounter(&mut self) {
        write(&COUNTER_KEY.into(), &(self.getCounter() + 1).into());
    }

    fn incrementAndGetCounter(&mut self) -> U256 {
        write(&COUNTER_KEY.into(), &(self.getCounter() + 1).into());
        U256::from_big_endian(&read(&COUNTER_KEY.into()))
    }
}
