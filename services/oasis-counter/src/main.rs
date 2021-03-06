use oasis_std::{Context, Service, Event};
use serde::{Serialize, Deserialize};

// Use camelCase to match solidity for test cases :(.
#[derive(Serialize, Deserialize, Event)]
pub struct Incremented {
    #[indexed]
    pub newCounter: u64,
}

#[derive(Service)]
pub struct OasisCounter {
    count: u64,
}

impl OasisCounter {
    pub fn new(_ctx: &Context) -> Result<Self, String> {
        Ok(Self { count: 0 })
    }

    pub fn get_counter(&mut self, _ctx: &Context) -> Result<u64, String> {
        Ok(self.count)
    }

    pub fn set_counter(&mut self, _ctx: &Context, c: u64) -> Result<(), String> {
        self.count = c;
        Ok(())
    }

    pub fn set_counter2(&mut self, _ctx: &Context, _c: u64, c2: u64) -> Result<(), String> {
        self.count = c2;
        Ok(())
    }

    pub fn increment_counter(&mut self, _ctx: &Context) -> Result<(), String> {
        self.count += 1;
        Event::emit(&Incremented {
            newCounter: self.count,
        });
        Ok(())
    }

    pub fn panic(&mut self, _ctx: &Context) -> Result<(), String> {
        panic!("this should panic");
    }
}

fn main() {
    oasis_std::service!(OasisCounter);
}
