const Counter = artifacts.require('Counter');
const Web3c = require('web3c');
const assert = require('assert');
const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('Deploy Header', async (accounts) => {

    const web3c = new Web3c(Counter.web3.currentProvider);

    it('creates a confidential contract that expires tomorrow with success', async () => {
      // Given
      let counterContract = new web3c.confidential.Contract(Counter.abi, undefined, {
        from: accounts[0]
      });

      // When
      let expectedExpiry = Math.floor(Date.now()/1000 + 60*60*24);
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
      resultantExpiry = await counterContract.expiry(instance.options.address);
      assert.equal(expectedExpiry, resultantExpiry);
    });

    it('creates a confidential contract that expires yesterday with failure', async () => {
      assert.rejects(
        async function () {
          // Given
          let counterContract = new web3c.confidential.Contract(Counter.abi, undefined, {
            from: accounts[0]
          });

          // When
          await counterContract.deploy({
            data: Counter.bytecode,
            header: {
              expiry: Date.now() - 60*60*24
            }
          }).send();

          // Then reject
        }
      );
    });
  });
}
