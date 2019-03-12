const TestEvent = artifacts.require('./Event.sol');
const ConfidentialCounter = artifacts.require('ConfidentialCounter');
const Web3c = require('web3c');
const utils = require('../src/utils');

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('TestEvent-PubSub', (accounts) => {
    // Want to test both the callback subscription type and the "on"
    // subscription type for both confidential and non-confidential.
    const cases = [
      { subscription: ethSubscribePromiseLogs, label: 'on', expectedCounter: 1 },
      { subscription: ethSubscribeCallbackLogs, label: 'callback', expectedCounter: 2 }
    ];

    cases.forEach((c) => {
      it(`${c.label} should subscribe to logs`, async () => {
        let dataToEmit = 123;

        let instance = await TestEvent.new();
        const subscribePromise = c.subscription(instance.address);
        await instance.emitEvent(dataToEmit);
        try {
          let log = await subscribePromise;
          assert.equal(instance.address, log.address);
          assert.equal(log.data, dataToEmit);
        } catch (err) {
          assert.fail(err);
        }
      });

      it(`${c.label}: should subscribe to logs of a confidential contract`, async () => {
        let web3c = new Web3c(ConfidentialCounter.web3.currentProvider, undefined, {
          keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
        });
        let contract = new web3c.oasis.Contract(ConfidentialCounter.abi, ConfidentialCounter.address, {
          from: accounts[0]
        });
        const subscribePromise = c.subscription(ConfidentialCounter.address);
        await contract.methods.incrementCounter().send();
        try {
          let log = await subscribePromise;
          assert.equal(ConfidentialCounter.address, log.address);
          assert.equal(log.data, c.expectedCounter);
        } catch (err) {
          assert.fail(err);
        }
      });
    });

    it('should fail to subscribe to pending transactions', async () => {
      let web3c = new Web3c(ConfidentialCounter.web3.currentProvider, undefined, {
        keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
      });
      let contract = new web3c.oasis.Contract(ConfidentialCounter.abi, ConfidentialCounter.address, {
        from: accounts[0]
      });
      try {
        const subscribePromise = ethSubscribePromisePendingTransactions(ConfidentialCounter.address);
        await subscribePromise;
        assert.fail('subscribe request shold not have succeeded');

      } catch (err) {
        assert.equal(err.message.indexOf('not implemented yet') > -1, true);
      }
    });
  });
}

function ethSubscribePromisePendingTransactions (address) {
  return ethSubscribePromise('pendingTransactions');
}

function ethSubscribePromiseLogs (address) {
  return ethSubscribePromise('logs', { 'fromBlock': 'latest', 'toBlock': 'latest', address });
}

function ethSubscribeCallbackLogs (address) {
  return ethSubscribeCallback('logs', { 'fromBlock': 'latest', 'toBlock': 'latest', address });
}

function subscribePromise(web3c, type, filter) {
  const args = [type];

  if (filter !== undefined) {
    args.push(filter);
  }

  return new Promise(function (resolve, reject) {
    web3c.oasis.subscribe.apply(web3c.oasis, args)
      .on('data', function (log) {
        resolve(log);
      }).on('error', function (err) {
        reject(err);
      });
  });
}

function ethSubscribePromise (type, filter) {
  const web3c = new Web3c(new (new Web3c()).providers.WebsocketProvider(utils.wsProviderUrl()), undefined, {
    keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
  });

  return subscribePromise(web3c, type, filter);
}

function ethSubscribeCallback (type, filter) {
  const web3c = new Web3c(new (new Web3c()).providers.WebsocketProvider(utils.wsProviderUrl()), undefined, {
    keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
  });

  return new Promise(function (resolve, reject) {
    web3c.oasis.subscribe(
      type, filter,
      (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
  });
}
