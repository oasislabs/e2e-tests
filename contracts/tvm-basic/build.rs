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
    let obj_path_str = obj_path.to_str().unwrap();
    assert!(
        obj_path.exists(),
        "Could not build tvm lib: {}",
        String::from_utf8(output.stderr).unwrap()
    );

    let output = Command::new("ld.lld-7")
        .args(&[
            "-flavor",
            "wasm",
            "-o",
            &format!("{}.o.o", obj_path_str),
            "--no-entry",
            "--allow-undefined",
            "--export=__wasm_call_ctors",
            obj_path_str,
        ])
        .output()
        .expect("Failed to export symbols");

    let lib_path = std::path::PathBuf::from(format!("{}/libtest.a", out_dir));
    let output = Command::new("llvm-ar-7")
        .args(&["r", lib_path.to_str().unwrap(), obj_path_str])
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
