const TestEvent = artifacts.require('./Event.sol');
const Web3 = require('web3');
const utils = require('./utils');

const truffleConfig = require('../truffle-config');

const TEST_NUMBER = 3;

if (truffleConfig.shouldRun(TEST_NUMBER)) {
  contract('TestEvent-PubSub', (accounts) => {
    it('should subscribe to logs', async () => {
      let dataToEmit = 123;

      let instance = await TestEvent.new();
      const subscribePromise = ethSubscribePromise(instance.address);
      await instance.emitEvent(dataToEmit);
      try {
        let log = await subscribePromise;
        assert.equal(instance.address, log.address);
        assert.equal(log.data, dataToEmit);
      } catch (err) {
        assert.fail(err);
      }
    });
  });
}

async function ethSubscribePromise (address) {
  const web3 = new Web3(new Web3.providers.WebsocketProvider(utils.wsProviderUrl()));
  return new Promise(function (resolve, reject) {
    web3.eth.subscribe(
      'logs',
      { 'fromBlock': 'latest', 'toBlock': 'latest', address },
      function (error, result) {
        if (error) {
          reject(error);
        }
      }
    ).on('data', function (log) {
      resolve(log);
    }).on('error', function (err) {
      reject(err);
    });
  });
}
