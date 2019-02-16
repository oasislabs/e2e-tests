const Counter = artifacts.require('Counter');
const Web3c = require('web3c');
const _assert = require('assert');
const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('Deploy Header', async (accounts) => {
    const web3c = new Web3c(Counter.web3.currentProvider);
    let contracts = [
      new web3c.eth.Contract(Counter.abi, undefined, {
        from: accounts[0]
      }),
      new web3c.confidential.Contract(Counter.abi, undefined, {
        from: accounts[0]
      })
    ];

    contracts.forEach((contract) => {
      it('creates a confidential contract that expires tomorrow with success', async () => {
        // Given
        let counterContract = contract;

        // When
        let expectedExpiry = Math.floor(Date.now() / 1000 + 60 * 60 * 24);
        let instance = await counterContract.deploy({
          data: Counter.bytecode,
          header: {
            expiry: expectedExpiry
          }
        }).send();

        // Then
        let resultantExpiry = await instance.expiry();
        assert.equal(expectedExpiry, resultantExpiry);

        // Bonus: Sanity check other api.
        resultantExpiry = await web3c.oasis.expiry(instance.options.address);
        assert.equal(expectedExpiry, resultantExpiry);
      });

      it('creates a confidential contract that expires yesterday with failure', async () => {
        _assert.rejects(
          async function () {
            // Given
            let counterContract = contract;

            let expectedExpiry = Math.floor(Date.now() / 1000 - 60 * 60 * 24);
            // When
            await counterContract.deploy({
              data: Counter.bytecode,
              header: {
                expiry: expectedExpiry
              }
            }).send();

            // Then reject
          }
        );
      });
    });
  });
}
