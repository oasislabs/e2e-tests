const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = 'patient oppose cotton portion chair gentle jelly dice supply salmon blast priority';

module.exports = {
  networks: {
    development: {
      provider: function () {
        return new HDWalletProvider(mnemonic, 'http://localhost:8545/');
      },
      network_id: '*'
    },
    development2: {
      provider: function () {
        return new HDWalletProvider(mnemonic, 'http://localhost:8546/');
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
  }
};
