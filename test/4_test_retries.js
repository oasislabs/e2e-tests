// const _Counter = artifacts.require('Counter');
// const Web3 = require('web3');

const truffleConfig = require('../truffle-config');

// const BLOCK_GAS_LIMIT = 16000000;

if (truffleConfig.shouldRun(__filename)) {
  contract('Retries', async (accounts) => {
    /*
    const web3 = new Web3(_Counter.web3.currentProvider);

    // Create three soft wallets.
    const wallets = Array.from(new Array(3), () => newWallet());

    it("retries transactions that don't fit in current block", async () => {
      // Fund the soft wallets.
      const transferAmount = 100000000000000000; // 0.1 DEV
      for (const wallet of wallets) {
        await web3.eth.sendTransaction({
          from: accounts[0],
          to: wallet.eth.defaultAccount,
          value: transferAmount
        });
      }

      // Send multiple transactions in parallel with gas == block gas limit.
      await Promise.all(wallets.map(function (wallet) {
        return sendBigTxn(wallet);
      }));
    });
    */
  });
}

/*
function newWallet () {
  const web3 = new Web3(truffleConfig.HTTPS_PROVIDER_URL);
  const account = web3.eth.accounts.create();
  web3.eth.defaultAccount = account.address;
  web3.eth.accounts.wallet.add(account);
  return web3;
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
*/
