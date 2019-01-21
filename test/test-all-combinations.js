const Counter = artifacts.require('Counter');
const ConfidentialCounter = artifacts.require('ConfidentialCounter');
const WasmCounter = artifacts.require('WasmCounter');
const ConfidentialWasmCounter = artifacts.require('ConfidentialWasmCounter');

const Web3c = require('web3c');
// use the provider set in our truffle-config.js
const web3c = new Web3c(Counter.web3.currentProvider);

/**
 * Tests all combinations of contract types with one test suite. The actual tests are
 * exactly the same whether the contract is Rust, Solidity, confidential or not.
 * All that matters is that we construct the correct web3c contract object.
 */
contract('Counter Contracts', function (accounts) {
  const options = { from: accounts[0] };
  const contracts = [
    new web3c.eth.Contract(Counter.abi, Counter.address, options),
    new web3c.confidential.Contract(ConfidentialCounter.abi, ConfidentialCounter.address, options),
    new web3c.eth.Contract(WasmCounter.abi, WasmCounter.address, options),
    new web3c.confidential.Contract(ConfidentialWasmCounter.abi, ConfidentialWasmCounter.address, options)
  ];

  contracts.forEach((contract) => {
    it('should have a starting count of 0', async function () {
      const count = await contract.methods.getCounter().call();
      assert.equal(count, 0);
    });

    it('should increment the count to 1', async function () {
      await contract.methods.incrementCounter().send();
      const count = await contract.methods.count().call();
      assert.equal(count, 1);
    });
  });
});
