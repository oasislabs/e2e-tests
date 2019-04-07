const Counter = artifacts.require('Counter');
const WasmCounter = artifacts.require('WasmCounter');
const ConfidentialCounter = artifacts.require('ConfidentialCounter');
const truffleConfig = require('../truffle-config');
const utils = require('../src/utils');
const Web3c = require('web3c');

const web3c = new Web3c(Counter.web3.currentProvider, undefined, {
  keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
});

if (truffleConfig.shouldRun(__filename)) {
  /**
   * Tests all combinations of contract types with one test suite. The actual tests are
   * exactly the same whether the contract is Rust, Solidity, confidential or not.
   * All that matters is that we construct the correct web3c contract object.
   */

  contract('Failure Cases', function (accounts) {
    const options = { from: accounts[0] };

    it('should fail to send transaction with web3c with no default account', async function () {
      const web3c = new Web3c(new (new Web3c()).providers.HttpProvider(utils.providerUrl()), undefined, {
        keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
      });
      const contract = new web3c.oasis.Contract(Counter.abi, Counter.address, options);

      try {
        await contract.methods.incrementCounter().send({
          gasPrice: '0x3b9aca00',
          gas: '0x141234'
        });
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message, 'Returned error: eth_sendTransaction is not implemented because the gateway cannot sign transactions. Make sure that the wallet is setup correctly in the client in case transaction signing is expected to happen transparently');
      }
    });

    it('should fail to deploy contract without bytecode', async function () {
      const contract = new web3c.oasis.Contract(Counter.abi, undefined, options);
      try {
        await contract.deploy().send();
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message, 'No "data" specified in neither the given options, nor the default options.');
      }
    });

    it('should fail to deploy an expired contract', async function () {
      const contract = new web3c.oasis.Contract(Counter.abi, undefined, options);

      try {
        await contract.deploy({
          data: Counter.bytecode,
          header: { expiry: 0, confidential: false }
        }).send();
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message, 'Transaction execution error with cause: Transaction execution error (Contract Expired).');
      }
    });

    it('should fail if not enough gas', async function () {
      const contract = new web3c.oasis.Contract(Counter.abi, Counter.address, options);

      try {
        await contract.methods.incrementCounter().send({
          gasPrice: '0x3b9aca00',
          gas: '0x987654321'
        });
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message, 'Transaction execution error with cause: Requested gas greater than block gas limit.');
      }
    });

    it('should fail to execute transaction with malformed headers', async function () {
      const contract = new web3c.oasis.Contract(Counter.abi, undefined, options);
      try {
        await contract.deploy({
          data: Counter.bytecode,
          header: { expiry: 0.1 }
        }).send();
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message, 'Transaction execution error with cause: Malformed header');
      }
    });

    it('should fail to execute not existing method', async () => {
      const contract = new web3c.oasis.Contract(Counter.abi, Counter.address, options);
      const invalidMethodABI = '0x8ada066f';

      const hdWalletProvider = Counter.web3.currentProvider;
      const address = Object.keys(hdWalletProvider.wallets)[0];
      const privateKey = '0x' + hdWalletProvider.wallets[address]._privKey.toString('hex');
      const tx = {
        from: Object.keys(hdWalletProvider.wallets)[0],
        gasPrice: '0x3b9aca00',
        to: contract.address,
        data: invalidMethodABI,
        gas: '0x141234'
      };

      const account = web3c.eth.accounts.privateKeyToAccount(privateKey);
      const signed = await account.signTransaction(tx);

      try {
        await web3c.eth.sendSignedTransaction(signed.rawTransaction);
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message.includes('Transaction has been reverted by the EVM'), true);
      }
    });

    it('should return failure on executing non confidential call on confidential contract', async () => {
      const web3 = utils.setupWeb3(ConfidentialCounter.currentProvider);
      const contract = new web3.eth.Contract(ConfidentialCounter.abi, ConfidentialCounter.address, options);

      try {
        await contract.methods.getCounter().send({
          gas: '0x141234',
          gasPrice: '0x3b9aca00'
        });
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message.includes('Unable to decrypt transaction data: invalid nonce or public key'), true);
      }
    });

    it('should fail on triggering require in a solidity contract', async () => {
      const contract = new web3c.oasis.Contract(Counter.abi, Counter.address, options);

      try {
        await contract.methods.verifyCounterValue(1).send();
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message.includes('Transaction execution error (Reverted).'), true);
      }
    });

    it('should fail on panic! in a rust contract', async () => {
      const contract = new web3c.oasis.Contract(WasmCounter.abi, WasmCounter.address, options);

      try {
        await contract.methods.verifyCounterValue(1).send();
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        console.log(e.message);
        assert.equal(e.message.includes('Internal error: Wasm runtime error: Trap(Trap { kind: Unreachable }))."'), true);
      }
    });

    it('should return null when calling getPublicKey on non confidential contract', async () => {
      assert.equal(null, await web3c.oasis.getPublicKey(Counter.address));
    });
  });
}
