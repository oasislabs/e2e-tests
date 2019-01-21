const Web3 = require('web3');
const utils = require('./utils');

describe('New accounts', async () => {
  const provider = utils.provider();

  it('transfers eth to an account that does not exist', async () => {
    let web3 = new Web3(provider.provider);
    let account = web3.eth.accounts.create();

    const transferAmount = 100;

    const newAccountBeforeBalance = await web3.eth.getBalance(account.address);

    await web3.eth.sendTransaction({
      from: provider.address,
      to: account.address,
      value: 100
    });

    const newAccountAfterBalance = await web3.eth.getBalance(account.address);
    const newAccountDiff = newAccountAfterBalance - newAccountBeforeBalance;

    assert.equal(newAccountDiff, transferAmount);
  });
});
