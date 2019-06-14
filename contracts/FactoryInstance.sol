pragma solidity ^0.4.18;

/// Deployed via the Factory contract.
contract FactoryInstance {
  uint public a = 1;
  uint public b = 2;
  uint[] public c;

  constructor(uint _a, uint _b, uint[] _c) public {
	a = _a;
	b = _b;
	c = _c;
  }

  function retrieveA() public returns (uint) {
	return a;
  }

  function retrieveB() public returns (uint) {
	return b;
  }

  function retrieveC() public returns (uint[]) {
	return c;
  }
}
