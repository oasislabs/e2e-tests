const _Counter = artifacts.require('Counter');
const Web3 = require('web3');

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('Transfers', async (accounts) => {
    const web3 = new Web3(_Counter.web3.currentProvider);
    const account = web3.eth.accounts.create();
    const transferAmount = 100;

    it('transfers eth to an account that does not exist', async () => {
      const newAccountBeforeBalance = await web3.eth.getBalance(account.address);

      await web3.eth.sendTransaction({
        from: accounts[0],
        to: account.address,
        value: transferAmount
      });

      const newAccountAfterBalance = await web3.eth.getBalance(account.address);
      const newAccountDiff = newAccountAfterBalance - newAccountBeforeBalance;

      assert.equal(newAccountDiff, transferAmount);
      assert.equal(newAccountAfterBalance, transferAmount);
    });

    it('transfers eth to an account that already exists', async () => {
      const newAccountBeforeBalance = await web3.eth.getBalance(account.address);

      await web3.eth.sendTransaction({
        from: accounts[0],
        to: account.address,
        value: transferAmount
      });

      const newAccountAfterBalance = await web3.eth.getBalance(account.address);
      const newAccountDiff = newAccountAfterBalance - newAccountBeforeBalance;

      assert.equal(newAccountDiff, transferAmount);
      assert.equal(newAccountAfterBalance, transferAmount * 2);
    });
  });
}
