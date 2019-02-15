const Counter = artifacts.require("Counter");
const ConfidentialCounter = artifacts.require("ConfidentialCounter");
const WasmCounter = artifacts.require("WasmCounter");
const ConfidentialWasmCounter = artifacts.require("ConfidentialWasmCounter");

module.exports = function(deployer) {
  // deploy solidity contracts
  deployer.deploy(Counter);
  deployer.deploy(ConfidentialCounter);
  // deploy wasm contracts
  deployer.deploy(WasmCounter);
  deployer.deploy(ConfidentialWasmCounter);
}
