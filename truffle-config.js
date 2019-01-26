const HDWalletProvider = require('truffle-hdwallet-provider');

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
const DEVNET = process.env.DEVNET;
/**
 * Devnet constants used if one wants to run the tests against the public Devnet.
 */
const DEVNET_HTTPS_PROVIDER_URL = 'https://web3.oasiscloud.io';
const DEVNET_WS_PROVIDER_URL = 'wss://web3.oasiscloud.io/ws';

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
  WS_PROVIDER_URL
};
