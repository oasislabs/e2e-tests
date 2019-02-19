const Counter = artifacts.require('Counter');
const ConfidentialCounter = artifacts.require('ConfidentialCounter');
const WasmCounter = artifacts.require('WasmCounter');
const ConfidentialWasmCounter = artifacts.require('ConfidentialWasmCounter');
const Web3c = require('web3c');
// use the provider set in our truffle-config.js
const web3c = new Web3c(Counter.web3.currentProvider);

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  /**
   * Tests all combinations of contract types with one test suite. The actual tests are
   * exactly the same whether the contract is Rust, Solidity, confidential or not.
   * All that matters is that we construct the correct web3c contract object.
   */
  contract('Counter Contracts', function (accounts) {
    const options = { from: accounts[0] };
    const contracts = [
      [
        new web3c.oasis.Contract(Counter.abi, Counter.address, options),
        new web3c.oasis.Contract(Counter.abi, undefined, options),
        Counter.bytecode,
        'Solidity contract',
        false // Not confidential.
      ],
      [
        new web3c.oasis.Contract(ConfidentialCounter.abi, ConfidentialCounter.address, options),
        new web3c.oasis.Contract(ConfidentialCounter.abi, undefined, options),
        ConfidentialCounter.bytecode,
        'confidential Solidity contract',
        true // Confidential.
      ],
      [
        new web3c.oasis.Contract(WasmCounter.abi, WasmCounter.address, options),
        new web3c.oasis.Contract(WasmCounter.abi, undefined, options),
        WasmCounter.bytecode,
        'Rust contract',
        false
      ],
      [
        new web3c.oasis.Contract(ConfidentialWasmCounter.abi, ConfidentialWasmCounter.address, options),
        new web3c.oasis.Contract(ConfidentialWasmCounter.abi, undefined, options),
        ConfidentialWasmCounter.bytecode,
        'confidential Rust contract',
        true
      ]
    ];

    contracts.forEach((testCase) => {
      const deployedContract = testCase[0];
      const counterContract = testCase[1];
      const bytecode = testCase[2];
      const description = testCase[3];
      const confidential = testCase[4];

      it('should have a starting count of 0 for a ' + description, async function () {
        const count = await deployedContract.methods.getCounter().call();
        assert.equal(count, 0);
      });

      it('should increment the count to 1 for a ' + description, async function () {
        await deployedContract.methods.incrementCounter().send();
        const count = await deployedContract.methods.getCounter().call();
        assert.equal(count, 1);
      });

      it('should estimate gas for deploy transactions the same as gas used for a ' + description, async () => {
        const deployMethod = counterContract.deploy({ data: bytecode, header: { confidential } });
        const estimatedGas = await deployMethod.estimateGas();
        const receipt = await deployContract(deployMethod, estimatedGas, accounts[0]);
        assert.equal(estimatedGas, receipt.gasUsed);
        assert.equal(estimatedGas, receipt.cumulativeGasUsed);
      });

      it('should estimate gas for call transactions the same as gas used for a ' + description, async () => {
        const deployMethod = counterContract.deploy({ data: bytecode, header: { confidential } });
        const contract = await deployMethod.send();
        let estimatedGas = await contract.methods.incrementCounter().estimateGas();
        let receipt = await contract.methods.incrementCounter().send({
          gasPrice: '0x3b9aca00',
          gas: estimatedGas
        });
        assert.equal(estimatedGas, receipt.gasUsed);
        assert.equal(estimatedGas, receipt.cumulativeGasUsed);
      });
    });
  });
}

function deployContract (deployMethod, estimatedGas, from) {
  return new Promise(function (resolve, reject) {
    deployMethod.send({
      gasPrice: '0x3b9aca00',
      gas: estimatedGas
    }).on('error', reject)
      .on('receipt', resolve);
  });
}
