use std::{env, process::Command};

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();

    let output = Command::new(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/src/build_test_lib.py"
    ))
    .arg(&out_dir)
    .output()
    .expect("Failed to build TVM lib");

    let obj_path = std::path::PathBuf::from(format!("{}/test.o", out_dir));
    assert!(
        obj_path.exists(),
        "Could not build tvm lib: {}",
        String::from_utf8(output.stderr).unwrap()
    );

    let lib_path = std::path::PathBuf::from(format!("{}/libtest.a", out_dir));
    let output = Command::new("llvm-ar-7")
        .args(&["r", lib_path.to_str().unwrap(), obj_path.to_str().unwrap()])
        .output()
        .expect("Failed to create library archive");
    assert!(
        lib_path.exists(),
        "Could not archive tvm lib: {}",
        String::from_utf8(output.stderr).unwrap()
    );

    println!("cargo:rustc-link-lib=static=test");
    println!("cargo:rustc-link-search=native={}", out_dir);
}
