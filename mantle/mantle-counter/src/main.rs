use oasis_std::{Context, Service, Event};
use serde::{Serialize, Deserialize};

// Use camelCase to match solidity for test cases :(.
#[derive(Serialize, Deserialize, Event)]
pub struct Incremented {
    #[indexed]
    pub newCounter: u64,
}

#[derive(Service)]
pub struct MantleCounter {
    count: u64,
}

impl MantleCounter {
    pub fn new(_ctx: &Context) -> Result<Self, String> {
        Ok(Self { count: 0 })
    }

    pub fn getCounter(&mut self, _ctx: &Context) -> Result<u64, String> {
        Ok(self.count)
    }

    pub fn setCounter(&mut self, _ctx: &Context, c: u64) -> Result<(), String> {
        self.count = c;
        Ok(())
    }

    pub fn setCounter2(&mut self, _ctx: &Context, _c: u64, c2: u64) -> Result<(), String> {
        self.count = c2;
        Ok(())
    }

    pub fn incrementCounter(&mut self, _ctx: &Context) -> Result<(), String> {
        self.count += 1;
        Event::emit(&Incremented {
            newCounter: self.count,
        });
        Ok(())
    }
}

fn main() {
    oasis_std::service!(MantleCounter);
}
