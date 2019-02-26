const TestEvent = artifacts.require('./Event.sol');
const ConfidentialCounter = artifacts.require('ConfidentialCounter');
const Web3c = require('../../web3c.js');
const utils = require('../src/utils');

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('TestEvent-PubSub', (accounts) => {

	// Want to test both the callback subscription type and the "on"
	// subscription type for both confidential and non-confidential.
	const cases = [
	  {subscription: ethSubscribePromise, label: 'on', expectedCounter: 1},
	  {subscription: ethSubscribeCallbackPromise, label: 'callback', expectedCounter: 2}
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
		let web3c = new Web3c(ConfidentialCounter.web3.currentProvider);
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
  });
}

async function ethSubscribePromise (address) {
  const web3c = new Web3c(new (new Web3c()).providers.WebsocketProvider(utils.wsProviderUrl()));

  return new Promise(function (resolve, reject) {
    web3c.oasis.subscribe(
      'logs',
      { 'fromBlock': 'latest', 'toBlock': 'latest', address }
    ).on('data', function (log) {
      resolve(log);
    }).on('error', function (err) {
      reject(err);
    });
  });
}

async function ethSubscribeCallbackPromise (address) {
  const web3c = new Web3c(new (new Web3c()).providers.WebsocketProvider(utils.wsProviderUrl()));

  return new Promise(function (resolve, reject) {
    web3c.oasis.subscribe(
      'logs',
      { 'fromBlock': 'latest', 'toBlock': 'latest', address },
	  (err, result) => {
		if (err) {
		  reject(err);
		}
		resolve(result);
	  });
  });
}
