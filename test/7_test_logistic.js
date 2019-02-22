const Logistic = artifacts.require('Logistic');

const Web3c = require('web3');
const web3c = new Web3c(Logistic.web3.currentProvider);

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('Logistic', (accounts) => {
    it('should perform logistic regression', async () => {
      const contract = new web3c.eth.Contract(Logistic.abi);
      let instance = await contract.deploy({ data: Logistic.bytecode }).send({
        from: accounts[0]
      });
      const bytes = await instance.methods.regression().call();
      assert.equal(bytes, '0x4d61746368696e6720636c617373657320697320313030');
    });
  });
}
