const BasicTVM = artifacts.require('BasicTVM');

const Web3 = require('web3');
const web3 = new Web3(BasicTVM.web3.currentProvider);

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('BasicTVM', (accounts) => {
    it('should add two vectors', async () => {
      const contract = new web3.eth.Contract(BasicTVM.abi);
      let instance = await contract.deploy({ data: BasicTVM.bytecode }).send({
        from: accounts[0],
        gas: '0xf00000' // XXX: works around estimateGas producing 2^51
      });
      const bytes = await instance.methods.test().call();
      assert.equal(bytes, '1');
    });
  });
}