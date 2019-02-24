#![feature(try_from)]

#[macro_use]
extern crate tvm_runtime as tvm;

use std::convert::TryInto;

use ndarray::Array;
use tvm::{DLTensor, Module, SystemLibModule};

extern "C" {
    fn __tvm_module_startup();
}

#[owasm_abi_derive::contract]
trait BasicTVM {
    fn constructor(&mut self) {}

    fn test(&mut self) -> U256 {
        unsafe {
            __tvm_module_startup();
        }
        let syslib = SystemLibModule::default();
        let add = syslib.get_function("default_function").unwrap();
        let mut a = Array::from_vec(vec![1f32, 1., 2., 3.]);
        let mut b = Array::from_vec(vec![5f32, 8., 13., 21.]);
        let mut c = Array::from_vec(vec![0f32, 0., 0., 0.]);
        let mut a_dl: DLTensor = (&mut a).into();
        let mut b_dl: DLTensor = (&mut b).into();
        let mut c_dl: DLTensor = (&mut c).into();

        let c_expected = Array::from_vec(vec![6f32, 9., 15., 24.]);

        let _result: i32 = call_packed!(add, &mut a_dl, &mut b_dl, &mut c_dl)
            .try_into()
            .unwrap();

        if c.all_close(&c_expected, 1e-8f32) {
            U256::one()
        } else {
            U256::zero()
        }
    }
}
