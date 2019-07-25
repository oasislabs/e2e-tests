const Counter = artifacts.require('Counter');
const truffleConfig = require('../truffle-config');
const _assert = require('assert');
const utils = require('../src/utils');
const oasis = require('@oasislabs/client');
const web3 = utils.setupWebsocketProvider(Counter.web3.currentProvider);
// Use for the expiry api.
const web3c = utils.setupWebsocketProvider(Counter.web3.currentProvider, true);

let mantleCounterBytecode = require('fs').readFileSync(
  '/workdir/tests/e2e-tests/mantle/mantle-counter/target/service/mantle-counter.wasm'
);

if (truffleConfig.shouldRun(__filename)) {
  contract('Deploy Header', async (accounts) => {
    let labels = ['non-confidential', 'confidential'];

    oasis.setGateway(
      new oasis.gateways.Web3Gateway(
        utils.wsProviderUrl(),
        oasis.Wallet.fromMnemonic(truffleConfig.MNEMONIC)
      )
    );

    labels.forEach((label) => {
      let instance;
      let confidential = label === 'confidential';
      let options = { gasLimit: '0xe79732' };

      it(`${label}: creates a contract that expires tomorrow with success`, async () => {
        let expectedExpiry = Math.floor(Date.now() / 1000 + 60 * 60 * 24);

        instance = await oasis.deploy({
          arguments: [],
          bytecode: mantleCounterBytecode,
          header: {
            expiry: expectedExpiry,
            confidential
          },
          options
        });
        let resultantExpiry = await web3c.oasis.expiry(oasis.utils.bytes.toHex(instance._inner.address));
        assert.equal(expectedExpiry, resultantExpiry);
      });

      it(`${label}: can execute transactions and calls on a contract with expiry`, async () => {
        let count = await instance.getCounter(options);
        assert.equal(count, 0);

        await instance.incrementCounter(options);

        count = await instance.getCounter(options);
        assert.equal(count, 1);
      });

      it(`${label}: creates a contract that expires yesterday with failure`, async () => {
        await _assert.rejects(
          async function () {
            let expectedExpiry = Math.floor(Date.now() / 1000 - 60 * 60 * 24);

            await oasis.deploy({
              data: mantleCounterBytecode,
              header: {
                expiry: expectedExpiry,
                confidential
              },
              options
            });
          }
        );
      });

      it(`${label}: calls a contract that has expired with failure`, async () => {
        // Given.
        instance = await oasis.deploy({
          arguments: [],
          bytecode: mantleCounterBytecode,
          header: {
            expiry: Math.floor(Date.now() / 1000 + 20),
            confidential
          },
          options
        });
        // When.
        await utils.sleep(60 * 1000);
        // Send dummy transaction to make the tendermint clock tick.
        await web3.eth.sendTransaction({
          from: accounts[0],
          to: web3.eth.accounts.create().address,
          value: 100,
          gas: 2100
        });
        // Then.
        _assert.rejects(async function () {
          await instance.incrementCounter(options);
        });
      });
    });
  });
}
