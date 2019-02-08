const Deployed = artifacts.require('./cross_contract/solidity/Deployed.sol');
const Existing = artifacts.require('./cross_contract/solidity/Existing.sol');
const DeployedRust = artifacts.require('DeployedRust');
const ExistingRust = artifacts.require('ExistingRust');
const Web3 = require('web3');
const web3 = new Web3(Deployed.web3.currentProvider);

contract('CrossContractCall', (accounts) => {
  let testCases = [
    [Deployed, Existing, 'should update value in other solidity contract'],
    [DeployedRust, ExistingRust, 'should update value in other rust contract']
  ];

  testCases.forEach((test) => {
    it(test[2], async () => {
      let deployedArtifact = test[0];
      let existingArtifact = test[1];

      let deployed = await new web3.eth.Contract(deployedArtifact.abi, undefined, {
        from: accounts[0]
      }).deploy({
        data: deployedArtifact.bytecode
      }).send();
      let prevA = await deployed.methods.a().call();
      assert.equal(prevA, 1, 'Previous value is incorrect');

      let existing = await new web3.eth.Contract(existingArtifact.abi, undefined, {
        from: accounts[0]
      }).deploy({
        data: existingArtifact.bytecode,
        arguments: [deployed.options.address]
      }).send();

      prevA = await existing.methods.get_a().call();
      assert.equal(prevA, 1, 'Previous value is incorrect');

      await existing.methods.set_a(2).send();
      let newA = await deployed.methods.a().call();
      assert.equal(newA, 2, 'Contract value was not updated');
    });
  });
});
