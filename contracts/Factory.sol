pragma solidity ^0.4.18;

import "./FactoryInstance.sol";

/// Deploys another contract.
contract Factory {

  FactoryInstance dc;

  event Addr(address addr);

  function deployContract(uint _a, uint _b, uint[] _c) public {
	address addr = new FactoryInstance(_a, _b, _c);
	emit Addr(addr);
  }

}
