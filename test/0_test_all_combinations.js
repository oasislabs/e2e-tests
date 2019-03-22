const Counter = artifacts.require('Counter');
const ConfidentialCounter = artifacts.require('ConfidentialCounter');
const ConfidentialStartCounter = artifacts.require('ConfidentialStartCounter');
const WasmCounter = artifacts.require('WasmCounter');
const ConfidentialWasmCounter = artifacts.require('ConfidentialWasmCounter');
const Web3c = require('web3c');
const truffleConfig = require('../truffle-config');
const utils = require('../src/utils');
// Use the provider set in our truffle-config.js.

const web3cHttp = new Web3c(Counter.web3.currentProvider, undefined, {
  keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
});

const web3cWebsocket = setupWebsocketProvider();

const web3c = web3cHttp;

const web3Instances = [{
  provider: web3cHttp,
  name: 'http'
}, {
  provider: web3cWebsocket,
  name: 'ws'
}];

if (truffleConfig.shouldRun(__filename)) {
  /**
   * Tests all combinations of contract types with one test suite. The actual tests are
   * exactly the same whether the contract is Rust, Solidity, confidential or not.
   * All that matters is that we construct the correct web3c contract object.
   */
  contract('Counter Contracts', function (accounts) {
    const options = { from: accounts[0] };

    it('should deploy through truffle with expiry and an expiry of 24 hours', async function () {
      const contract = new web3c.oasis.Contract(ConfidentialStartCounter.abi, ConfidentialStartCounter.address, options);
      const counter1 = await contract.methods._counter1().call();
      const counter2 = await contract.methods._counter2().call();
      const expiry = await contract.expiry();
      assert.equal(counter1, 1);
      assert.equal(counter2, 2);
      assert.equal(expiry, truffleConfig.TEST_TIMESTAMP + 24 * 60 * 60);
    });

    let expectedCounterValue = -1;
    web3Instances.forEach(inst => {
      const web3c = inst.provider;
      const providerName = inst.name;
      expectedCounterValue++;

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
        const counter = expectedCounterValue;
        const deployedContract = testCase[0];
        const counterContract = testCase[1];
        const bytecode = testCase[2];
        const description = testCase[3];
        const confidential = testCase[4];

        it('should have a starting count of ' + counter + ' for a ' + description + ' with [provider=' + providerName + ']', async function () {
          const count = await deployedContract.methods.getCounter().call();
          assert.equal(count, counter);
        });

        it('should increment the count to ' + (counter + 1) + ' for a ' + description + ' with [provider=' + providerName + ']', async function () {
          const estimatedGas = await deployedContract.methods.incrementCounter().estimateGas();
          await deployedContract.methods.incrementCounter().send({
            gasPrice: '0x3b9aca00',
            gas: estimatedGas
          });
          const count = await deployedContract.methods.getCounter().call();
          assert.equal(count, counter + 1);
        });

        it('should estimate gas for deploy transactions the same as gas used for a ' + description + ' with [provider=' + providerName + ']', async () => {
          const deployMethod = counterContract.deploy({ data: bytecode, header: { confidential } });
          const estimatedGas = await deployMethod.estimateGas();
          const receipt = await deployContract(deployMethod, estimatedGas, accounts[0]);
          assert.equal(estimatedGas, receipt.gasUsed);
        });

        it('should estimate gas for call transactions the same as gas used for a ' + description + ' with [provider=' + providerName + ']', async () => {
          const deployMethod = counterContract.deploy({ data: bytecode, header: { confidential } });
          const deployEstimatedGas = await deployMethod.estimateGas();
          const contract = await deployMethod.send({ gas: deployEstimatedGas });
          const incrementEstimatedGas = await contract.methods.incrementCounter().estimateGas();
          const receipt = await contract.methods.incrementCounter().send({
            gasPrice: '0x3b9aca00',
            gas: incrementEstimatedGas
          });
          assert.equal(incrementEstimatedGas, receipt.gasUsed);
        });

        if (web3c === web3cWebsocket) {
          // invoke is only implemented for websockets
          it('should increment the count to ' + (counter + 2) + ' and get value for a ' + ' with [provider=' + providerName + ']', async () => {
            const deployMethod = counterContract.deploy({ data: bytecode, header: { confidential } });
            const deployEstimatedGas = await deployMethod.estimateGas();
            const contract = await deployMethod.send({ gas: deployEstimatedGas });
            const incrementEstimatedGas = await contract.methods.incrementCounter().estimateGas();
            const count = await contract.methods.incrementAndGetCounter().invoke({
              gasPrice: '0x3b9aca00',
              gas: incrementEstimatedGas
            });
            assert.equal(count, counter + 2);
          });
        }
      });
    });
  });
}

function setupWebsocketProvider () {
  const web3cWebsocket = new Web3c(new (new Web3c()).providers.WebsocketProvider(utils.wsProviderUrl()), undefined, {
    keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
  });

  let hdWalletProvider = ConfidentialCounter.web3.currentProvider;
  let addr = Object.keys(hdWalletProvider.wallets)[0];
  let privKey = '0x' + hdWalletProvider.wallets[addr]._privKey.toString('hex');
  let acct = web3cWebsocket.eth.accounts.privateKeyToAccount(privKey);

  web3cWebsocket.eth.defaultAccount = acct.address;
  web3cWebsocket.eth.accounts.wallet.add(acct);

  web3cWebsocket.oasis.defaultAccount = acct.address;
  web3cWebsocket.oasis.accounts.wallet.add(acct);

  return web3cWebsocket;
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
