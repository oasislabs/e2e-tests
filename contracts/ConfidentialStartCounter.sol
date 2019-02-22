pragma solidity ^0.4.0;

contract ConfidentialStartCounter {

  uint256 public _counter1;
  uint256 public _counter2;

  constructor(uint256 counter1, uint256 counter2) public {
    _counter1 = counter1;
    _counter2 = counter2;
  }
}
