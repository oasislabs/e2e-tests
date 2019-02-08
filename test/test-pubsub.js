const TestEvent = artifacts.require('./Event.sol');
const Web3 = require('web3');
const web3 = new Web3(TestEvent.web3.currentProvider);
const utils = require('./utils');

contract('TestEvent-PubSub', (accounts) => {
  it('should subscribe to logs', async () => {
    let dataToEmit = 123;

    let instance = await new web3.eth.Contract(TestEvent.abi, undefined, {
      from: accounts[0]
    }).deploy({
      data: TestEvent.bytecode
    }).send();
    const subscribePromise = ethSubscribePromise(instance.options.address);
    await instance.methods.emitEvent(dataToEmit).send();
    try {
      let log = await subscribePromise;
      assert.equal(instance.options.address, log.address);
      assert.equal(log.data, dataToEmit);
    } catch (err) {
      assert.fail(err);
    }
  });
});

async function ethSubscribePromise (address) {
  const web3 = new Web3(new Web3.providers.WebsocketProvider(utils.wsProviderUrl(TestEvent.web3)));
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
