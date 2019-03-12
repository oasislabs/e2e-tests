const _Counter = artifacts.require('Counter');
const Web3c = require('web3c');

const truffleConfig = require('../truffle-config');

const BLOCK_GAS_LIMIT = 16000000;

if (truffleConfig.shouldRun(__filename)) {
  contract('Retries', async (accounts) => {
    const web3c = new Web3c(_Counter.web3.currentProvider);

    // create three soft wallets
    const wallets = Array.from(new Array(3), () => newWallet());

    it("retries transactions that don't fit in current block", async () => {
      // fund the soft wallets
      const transferAmount = 100000000000000000; // 0.1 DEV
      for (const wallet of wallets) {
        await web3c.eth.sendTransaction({
          from: accounts[0],
          to: wallet.eth.defaultAccount,
          value: transferAmount
        });
      }

      // send multiple transactions in parallel with gas == block gas limit
      return await Promise.all(wallets.map(function (wallet) {
        return sendBigTxn(wallet)
      }));
    });
  });
}

function newWallet () {
  const web3c = new Web3c(truffleConfig.HTTPS_PROVIDER_URL);
  const account = web3c.eth.accounts.create();
  web3c.eth.defaultAccount = account.address;
  web3c.eth.accounts.wallet.add(account);
  return web3c;
}

function sendBigTxn (wallet) {
  return new Promise(function (resolve, reject) {
    wallet.eth.sendTransaction({
      to: wallet.eth.accounts.create().address,
      value: 0,
      gas: BLOCK_GAS_LIMIT
    }).on('error', reject)
      .on('receipt', resolve);
  });
}
