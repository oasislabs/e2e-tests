# Oasis runtime end-to-end tests

[![Build status](https://badge.buildkite.com/58730a2be16848255387f3c8fe708465d09e699794fff0fae4.svg)](https://buildkite.com/oasislabs/e2e-tests)

A set of [Truffle](https://github.com/trufflesuite/truffle)-based acceptance tests covering changes to the Ethereum runtime on the Oasis platform.

## Installing


First, follow the [instructions](https://docs.oasis.dev/quickstart.html#set-up-the-oasis-sdk) for setting up the Oasis SDK.

Download the tests and install their dependencies:

```
git clone https://github.com/oasislabs/e2e-tests.git
cd e2e-tests
npm install
npm install -g lerna
npm install -g yarn
```

## Compiling

```
npm run compile:truffle
npm run compile:oasis
```

## Running tests against Devnet

To run tests against the Devnet, run

`MNEMONIC="<MNEMONIC>" npm run test:devnet [TEST_FILE_PATH]`

assigning the mnemonic associated with your Devnet wallet to the `MNEMONIC` environment variable. Optionally, one can include the path to a specific test file, e.g., `[TEST_FILE_PATH]` could be `test/0_test_builtins.js`. (Note that if you're running against the Devnet, you'll likely be rate limited since Truffle actively issues requests to the provider it's communicating with.)

## Running tests against a local network

To run tests against a local Oasis *testing* network, e.g., in C.I., first export the environment variables associated with your network. For example,

```
export HTTPS_PROVIDER_URL="http://localhost:8545"
export WS_PROVIDER_URL="ws://localhost:8555"
```

Then, similar to before, run the command

`MNEMONIC="<MNEMONIC>" npm run test:development [TEST_FILE_PATH]`,

this time specifiying your `MNEMONIC`, `development` and optionally the test file to run.

As with any Truffle project, one can add custom networks by modifying `truffle-config.js`. Note that we use a custom version of truffle so that we can work with Rust and Solidity in the same workspace. It will be downloaded when running `npm install` and located in your local `node_modules/`.
