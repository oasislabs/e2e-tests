const Counter = artifacts.require('Counter');
const truffleConfig = require('../truffle-config');
const utils = require('../src/utils');
const oasis = require('@oasislabs/client');
const Web3 = require('web3');

const web3 = new Web3(Counter.web3.currentProvider);

oasis.setGateway(
  new oasis.gateways.Web3Gateway(
    utils.wsProviderUrl(),
    new oasis.Wallet(truffleConfig.OASIS_CLIENT_SK)
  )
);

if (truffleConfig.shouldRun(__filename)) {
  contract('Failure Cases', function (accounts) {
    const options = { from: accounts[0] };

    let contract;

    it('sets up the contract for the tests', async () => {
      contract = await (new web3.eth.Contract(
        Counter.abi,
        undefined,
        options
      )).deploy({
        data: Counter.bytecode
      }).send();
    });

    it('should fail to send transaction with web3 with no default account', async function () {
      const web3 = new Web3(new (new Web3()).providers.HttpProvider(utils.providerUrl()));
      const c = new web3.eth.Contract(Counter.abi, contract.options.address, options);

      try {
        await c.methods.incrementCounter().send({
          gasPrice: '0x3b9aca00',
          gas: '0x141234'
        });
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message, 'Returned error: eth_sendTransaction is not implemented because the gateway cannot sign transactions. Make sure that the wallet is setup correctly in the client in case transaction signing is expected to happen transparently');
      }
    });

    it('should fail to deploy an expired contract', async function () {
      try {
        await oasis.deploy({
          bytecode: oasis.workspace.MantleCounter.bytecode,
          header: { expiry: 0, confidential: false }
        });
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message.includes('Transaction execution error with cause: transaction failed: requested gas greater than block gas limit'), true);
      }
    });

    it('should fail if not enough gas', async function () {
      try {
        await contract.methods.incrementCounter().send({
          gasPrice: '0x3b9aca00',
          gas: '0x987654321'
        });
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message, 'Transaction execution error with cause: transaction failed: requested gas greater than block gas limit');
      }
    });

    it('should fail to execute transaction with malformed headers', async function () {
      try {
        await oasis.deploy({
          bytecode: oasis.workspace.MantleCounter.bytecode,
          header: { expiry: 0.1 }
        });
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message, 'Transaction execution error with cause: Transaction execution error (Malformed transaction: Malformed header).');
      }
    });

    it('should fail to execute not existing method', async () => {
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

      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const signed = await account.signTransaction(tx);

      try {
        await web3.eth.sendSignedTransaction(signed.rawTransaction);
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message.includes('Transaction has been reverted by the EVM'), true);
      }
    });

    it('should fail on triggering require in a solidity contract', async () => {
      const c = new web3.eth.Contract(Counter.abi, contract.options.address, options);
      try {
        await c.methods.verifyCounterValue(1).send();
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message.includes('Transaction has been reverted by the EVM:'), true);
      }
    });

    it('should fail on panic! in a rust contract', async () => {
      const contract = await oasis.deploy({
        bytecode: oasis.workspace.MantleCounter.bytecode,
        header: { confidential: false }
      });
      try {
        await contract.panic();
        assert.fail(new Error('error should have been thrown'));
      } catch (e) {
        assert.equal(e.message.includes('\'this should panic\''), true);
      }
    });
  });
}
