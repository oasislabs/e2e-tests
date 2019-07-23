const TestEvent = artifacts.require('./Event.sol');
const Web3 = require('web3');
const utils = require('../src/utils');

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('TestEvent-PubSub', (accounts) => {
    it(`it should subscribe to logs`, async () => {
      let dataToEmit = 123;

      let instance = await TestEvent.new();
      const web3 = new Web3(new (new Web3()).providers.WebsocketProvider(utils.wsProviderUrl()));
      const subscribePromise = ethSubscribePromiseLogs(web3, instance.address);
      await instance.emitEvent(dataToEmit);
      try {
        let log = await subscribePromise;
        assert.equal(instance.address, log.address);
        assert.equal(log.data, dataToEmit);
        web3.currentProvider.disconnect();
      } catch (err) {
        web3.currentProvider.disconnect();
        assert.fail(err);
      }
    });
  });
}

function ethSubscribePromiseLogs (web3, address) {
  return ethSubscribePromise(web3, 'logs', { fromBlock: 'latest', toBlock: 'latest', address });
}

function ethSubscribePromise (web3, type, filter) {
  const args = [type];

  if (filter !== undefined) {
    args.push(filter);
  }

  return new Promise((resolve, reject) => {
    web3.eth.subscribe.apply(web3.eth, args)
      .on('data', resolve)
      .on('error', reject);
  });
}
