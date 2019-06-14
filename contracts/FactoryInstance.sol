pragma solidity ^0.4.18;

/// Deployed via the Factory contract.
contract FactoryInstance {
  uint public a = 1;

  constructor(uint _a) public {
	a = _a;
  }

  function retrieveA() public returns (uint) {
	return a;
  }
}
