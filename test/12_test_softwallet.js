const CallableCounter = artifacts.require('CallableCounter');
const Web3c = require('web3c');
const truffleConfig = require('../truffle-config');
const utils = require('../src/utils');

const web3c = new Web3c(utils.providerUrl(), undefined, {
  keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
});

let hdWalletProvider = CallableCounter.web3.currentProvider;
let addr = Object.keys(hdWalletProvider.wallets)[0];
let privKey = '0x' + hdWalletProvider.wallets[addr]._privKey.toString('hex');
let acct = web3c.eth.accounts.privateKeyToAccount(privKey);

web3c.eth.defaultAccount = acct.address;
web3c.eth.accounts.wallet.add(acct);

web3c.oasis.defaultAccount = acct.address;
web3c.oasis.accounts.wallet.add(acct);

if (truffleConfig.shouldRun(__filename)) {
  contract('Soft wallets', function (accounts) {
    let testCases = [
      {
        contract: new web3c.eth.Contract(CallableCounter.abi, undefined, {
          from: accounts[0],
          gas: '0xf42400'
        }),
        label: 'eth',
        confidential: false
      },
      {
        contract: new web3c.oasis.Contract(CallableCounter.abi, undefined, {
          from: accounts[0],
          gas: '0xf42400'
        }),
        label: 'oasis',
        confidential: false
      },
      {
        contract: new web3c.oasis.Contract(CallableCounter.abi, undefined, {
          from: accounts[0],
          gas: '0xf42400'
        }),
        label: 'oasis',
        confidential: true
      }
    ];

    testCases.forEach((testCase) => {
      it(`sends transactions via soft wallet in the ${testCase.label} namespace`, async () => {
        let contract = await testCase.contract.deploy({
          data: CallableCounter.bytecode,
          arguments: [accounts[0], 0, false, accounts[0]],
          header: {
            confidential: testCase.confidential
          }
        }).send();

        let counter = await contract.methods.getCounter().call();
        assert.equal(counter, 0);

        await contract.methods.incrementCounter().send();

        counter = await contract.methods.getCounter().call();
        assert.equal(counter, 1);
      });
    });
  });
}
