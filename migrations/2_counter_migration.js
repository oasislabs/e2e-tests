const Counter = artifacts.require("Counter");
const truffleConfig = require('../truffle-config');

module.exports = function(deployer) {
  deployer.deploy(Counter);
}
