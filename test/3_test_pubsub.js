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

    let contract;

    let beforeWeb3c;
    before(async () => {
      beforeWeb3c = new Web3c(ConfidentialCounter.web3.currentProvider, undefined, {
        keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
      });
      contract = await new beforeWeb3c.oasis.Contract(ConfidentialCounter.abi, undefined, {
        from: accounts[0]
      }).deploy({
        data: ConfidentialCounter.bytecode
      }).send();
    });

    after(async () => {
      beforeWeb3c.currentProvider.disconnect();
    });

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
        const subscribePromise = c.subscription(contract.options.address);
        await contract.methods.incrementCounter().send();
        try {
          let log = await subscribePromise;
          assert.equal(contract.options.address, log.address);
          assert.equal(log.data, c.expectedCounter);
        } catch (err) {
          assert.fail(err);
        }
      });
    });

    it('should fail to subscribe to pending transactions', async () => {
      try {
        const subscribePromise = ethSubscribePromise('pendingTransactions');
        await subscribePromise;
        assert.fail('subscribe request shold not have succeeded');
      } catch (err) {
        assert.equal(err.message.indexOf('not implemented yet') > -1, true);
      }
    });

    function getSubset (properties, filter) {
      const result = {};

      if (!filter || typeof filter !== 'object') {
        return properties;
      }

      Object.keys(properties).forEach(key => {
        if (filter[key] === true) {
          result[key] = properties[key];
        }
      });

      return result;
    }

    async function sendSignedIncrementAndGet (web3c, filterIncludeParams) {
      const hdWalletProvider = ConfidentialCounter.web3.currentProvider;
      const address = Object.keys(hdWalletProvider.wallets)[0];
      const privateKey = '0x' + hdWalletProvider.wallets[address]._privKey.toString('hex');
      const tx = {
        from: Object.keys(hdWalletProvider.wallets)[0],
        gasPrice: '0x3b9aca00',
        to: contract.options.address,
        data: contract.methods.incrementAndGetCounter().encodeABI(),
        gas: '0x141234'
      };

      const account = web3c.eth.accounts.privateKeyToAccount(privateKey);
      const signed = await account.signTransaction(tx);
      const transactionHash = web3c.utils.sha3(signed.rawTransaction, { encoding: 'hex' });
      const subargs = getSubset({
        transactionHash: transactionHash,
        fromAddress: tx.from,
        address: contract.options.address
      }, filterIncludeParams);

      const promise = subscribePromise(web3c, 'completedTransaction', subargs);
      await web3c.eth.sendSignedTransaction(signed.rawTransaction);
      return promise;
    }

    it('should subscribe to completed transaction with transactionHash', async () => {
      try {
        const web3c = utils.setupWebsocketProvider(ConfidentialCounter.web3.currentProvider);
        let result = await sendSignedIncrementAndGet(web3c, { transactionHash: true, address: true });
        assert.equal('0x0000000000000000000000000000000000000000000000000000000000000003', result.returnData);
        assert.equal(result.transactionHash.length, 66);
        web3c.currentProvider.disconnect();
      } catch (err) {
        assert.fail(err);
      }
    });

    it('should subscribe to completed transaction with fromAddress', async () => {
      try {
        const web3c = utils.setupWebsocketProvider(ConfidentialCounter.web3.currentProvider);
        let result = await sendSignedIncrementAndGet(web3c, { fromAddress: true, address: true });
        assert.equal('0x0000000000000000000000000000000000000000000000000000000000000004', result.returnData);
        assert.equal(result.transactionHash.length, 66);
        web3c.currentProvider.disconnect();
      } catch (err) {
        assert.fail(err);
      }
    });
  });
}

function ethSubscribePromiseLogs (address) {
  return ethSubscribePromise('logs', { fromBlock: 'latest', toBlock: 'latest', address });
}

function ethSubscribeCallbackLogs (address) {
  return ethSubscribeCallback('logs', { fromBlock: 'latest', toBlock: 'latest', address });
}

function subscribePromise (web3c, type, filter) {
  const args = [type];

  if (filter !== undefined) {
    args.push(filter);
  }

  return new Promise((resolve, reject) => {
    web3c.oasis.subscribe.apply(web3c.oasis, args)
      .on('data', resolve)
      .on('error', reject);
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
        if (err) reject(err);
        else resolve(result);
      });
  });
}
