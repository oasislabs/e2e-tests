const Counter = artifacts.require('Counter');
const Web3c = require('web3c');
const web3c = new Web3c(Counter.web3.currentProvider);
const _assert = require('assert');
const truffleConfig = require('../truffle-config');
const utils = require('../src/utils');

if (truffleConfig.shouldRun(__filename)) {
  contract('Deploy Header', async (accounts) => {
    let contract = new web3c.oasis.Contract(Counter.abi, undefined, {
      from: accounts[0]
    });
    let labels = ['confidential', 'eth'];
    labels.forEach((label) => {
      let instance;
      let confidential = label === 'confidential';

      it(`${label}: creates a confidential contract that expires tomorrow with success`, async () => {
        // Given.
        let counterContract = contract;

        // When.
        let expectedExpiry = Math.floor(Date.now() / 1000 + 60 * 60 * 24);
        instance = await counterContract.deploy({
          data: Counter.bytecode,
          header: {
            expiry: expectedExpiry,
            confidential
          }
        }).send();

        // Then.
        let resultantExpiry = await instance.expiry();
        assert.equal(expectedExpiry, resultantExpiry);

        // Bonus: Sanity check other api.
        resultantExpiry = await web3c.oasis.expiry(instance.options.address);
        assert.equal(expectedExpiry, resultantExpiry);
      });

      it(`${label}: can execute transactions and calls on a contract with expiry`, async () => {
        let count = await instance.methods.getCounter().call();
        assert.equal(count, 0);
        await instance.methods.incrementCounter().send();
        count = await instance.methods.getCounter().call();
        assert.equal(count, 1);
      });

      it(`${label}: creates a contract that expires yesterday with failure`, async () => {
        _assert.rejects(
          async function () {
            // Given.
            let counterContract = contract;

            // When.
            let expectedExpiry = Math.floor(Date.now() / 1000 - 60 * 60 * 24);
            await counterContract.deploy({
              data: Counter.bytecode,
              header: {
                expiry: expectedExpiry,
                confidential
              }
            }).send();

            // Then reject.
          }
        );
      });

      it(`${label}: calls a contract that has expired with failure`, async () => {
        // Given.
        instance = await contract.deploy({
          data: Counter.bytecode,
          header: {
            expiry: Math.floor(Date.now() / 1000 + 5),
            confidential
          }
        }).send();
        // When.
        await utils.sleep(30 * 1000);
        // Send dummy transaction to make the tendermint clock tick.
        await web3c.eth.sendTransaction({
          from: accounts[0],
          to: web3c.eth.accounts.create().address,
          value: 100
        });
        // Then.
        _assert.rejects(async function () {
          await instance.methods.incrementCounter().send();
        });
      });
    });
  });
}
