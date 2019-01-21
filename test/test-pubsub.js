const TestEvent = artifacts.require('./Event.sol');
const Web3 = require('web3');

contract('TestEvent-PubSub', (accounts) => {
  it('should subscribe to logs', async () => {
    let dataToEmit = 123;

    let instance = await TestEvent.new();
    const subscribePromise = eth_subscribePromise(instance.address);
    await instance.emitEvent(dataToEmit);
    let log = await subscribePromise;


    assert.equal(instance.address, log.address);
    assert.equal(log.data, dataToEmit);
  });
})

async function eth_subscribePromise(address) {
  const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8556'));
  return new Promise(function(resolve, reject) {
    web3.eth.subscribe(
      'logs',
      { "fromBlock":"latest", "toBlock":"latest", address },
      function(error, result) {
        // no-op
      }
    ).on("data", function(log){
      resolve(log);
    }).on("error", function(err){
      reject(err);
    });
  });
}
