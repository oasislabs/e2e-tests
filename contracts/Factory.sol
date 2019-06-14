pragma solidity ^0.4.18;

import "./FactoryInstance.sol";

/// Deploys another contract.
contract Factory {

  FactoryInstance dc;

  event Addr(address addr);

  function deployContract(uint _a) public {
	address addr = new FactoryInstance(_a);
	emit Addr(addr);
  }

}
