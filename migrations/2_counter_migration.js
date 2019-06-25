const Counter = artifacts.require("Counter");
const ConfidentialCounter = artifacts.require("ConfidentialCounter");
const ConfidentialStartCounter = artifacts.require("ConfidentialStartCounter");
const truffleConfig = require('../truffle-config');

module.exports = function(deployer) {
  // Deploy solidity contracts.
  deployer.deploy(Counter);
  deployer.deploy(ConfidentialCounter, {
    oasis: {
      confidential: true
    }
  });
  // Want to test deploying with constructor args.
  deployer.deploy(ConfidentialStartCounter, 1, 2, {
    oasis: {
      confidential: true,
      expiry: truffleConfig.TEST_TIMESTAMP + 24*60*60
    }
  });
}
