const _Counter = artifacts.require('Counter');
const Web3 = require('web3');

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('New accounts', async (accounts) => {
    it('transfers eth to an account that does not exist', async () => {
      const web3 = new Web3(_Counter.web3.currentProvider);
      let account = web3.eth.accounts.create();

      const transferAmount = 100;

      const newAccountBeforeBalance = await web3.eth.getBalance(account.address);

      await web3.eth.sendTransaction({
        from: accounts[0],
        to: account.address,
        value: 100
      });

      const newAccountAfterBalance = await web3.eth.getBalance(account.address);
      const newAccountDiff = newAccountAfterBalance - newAccountBeforeBalance;

      assert.equal(newAccountDiff, transferAmount);
    });
  });
}
