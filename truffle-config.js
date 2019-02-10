const HDWalletProvider = require('truffle-hdwallet-provider');
const path = require('path');
/**
 * Mnemonic associated with the wallet with which the tests are run.
 */
const MNEMONIC = process.env.MNEMONIC;
/**
 * Constants that should be defined as environment variables if one wants to
 * run the tests against a custom gateway.
 */
const HTTPS_PROVIDER_URL = process.env.HTTPS_PROVIDER_URL;
const WS_PROVIDER_URL = process.env.WS_PROVIDER_URL;
/**
 * True iff we're using the Devnet.
 */
const DEVNET = process.argv.indexOf('devnet') > -1;
/**
 * Devnet constants used if one wants to run the tests against the public Devnet.
 */
const DEVNET_HTTPS_PROVIDER_URL = 'https://web3.oasiscloud.io';
const DEVNET_WS_PROVIDER_URL = 'wss://web3.oasiscloud.io/ws';
/**
 * The amount of parallelism with which to run the tests. When the tests are run in
 * parallel, we assign each test file a number and divide up the tests into the "bucket"
 * corresponding with its number. For example, TEST_FILES_COUNT of 10 and PARALLELISM
 * of 2 would correspond into 2 buckets. When PARALLELISM_BUCKET==0, all tests with a
 * number [0, 4] would be executed and all tests with a number [5, 9] would be skipped.
 */
const PARALLELISM = process.env.E2E_PARALLELISM || 1;
/**
 * The current parallel bucket number being executed.
 */
const PARALLELISM_BUCKET = process.env.E2E_PARALLELISM_BUCKET || 0;
/**
 * Total number of test files. Increment this number when a new test file is added.
 */
const TEST_FILES_COUNT = 9;
/**
 * @returns true iff the test with fillename should be run under the given
 *          parallelism parameters. Assumes all filenames are of the form
 *          [NUMBER]_[TESTNAME].
 */
function shouldRun (filename) {
  let testNumber = parseInt(path.basename(filename).split('_')[0]);
  let testsToRun = makeBuckets()[PARALLELISM_BUCKET];
  return testsToRun.includes(testNumber);
}
/**
 * Returns the numerical buckets expressing the parallel groups the test should run with.
 * E.g., if PARALLELISM is 5 and TEST_FILES_COUNT is 10, returns
 * [[0,1], [2,3], [4,5], [6,7], [8, 9]].
 */
function makeBuckets () {
  // Create an array [0, 1,..., TEST_FILES_COUNT-1].
  let tests = []; for (let k = 0; k < TEST_FILES_COUNT; k += 1) { tests.push(k); };
  // No parallelism.
  if (PARALLELISM < 2) {
    return [tests];
  }
  // Buckets to return.
  let buckets = [];
  // Current test number to put into a bucket.
  let currentTest = 0;
  // Size of the next bucket to create.
  let bucketSize;

  // If the buckets are the same size.
  if (tests.length % PARALLELISM === 0) {
    bucketSize = tests.length / PARALLELISM;
    while (currentTest < tests.length) {
      buckets.push(tests.slice(currentTest, currentTest += bucketSize));
    }
  } else {
    // Buckets are of uneven size, so try our best to make them even length.
    let bucketsLeft = PARALLELISM;
    while (currentTest < tests.length) {
      bucketSize = Math.ceil((tests.length - currentTest) / bucketsLeft);
      buckets.push(tests.slice(currentTest, currentTest += bucketSize));
      bucketsLeft -= 1;
    }
  }
  return buckets;
}

module.exports = {
  networks: {
    development: {
      provider: function () {
        return new HDWalletProvider(MNEMONIC, HTTPS_PROVIDER_URL);
      },
      network_id: '*'
    },
    devnet: {
      provider: function () {
        return new HDWalletProvider(MNEMONIC, DEVNET_HTTPS_PROVIDER_URL);
      },
      network_id: '*'
    }
  },
  compilers: {
    external: {
      command: './node_modules/.bin/oasis-compile',
      targets: [{
        path: './.oasis-build/*.json'
      }]
    }
  },
  mocha: {
    enableTimeouts: false
  },
  DEVNET,
  DEVNET_HTTPS_PROVIDER_URL,
  DEVNET_WS_PROVIDER_URL,
  HTTPS_PROVIDER_URL,
  WS_PROVIDER_URL,
  shouldRun
};
