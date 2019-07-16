pragma solidity ^0.4.0;

contract Counter {
  event Incremented(uint newCounter);

  uint256 _counter;

  function verifyCounterValue(uint256 value) public {
    require(value == _counter, "counter does not equal to expected value");
  }

  function getCounter() public view returns (uint256) {
    return _counter;
  }

  function incrementCounter() public {
    _counter += 1;
    emit Incremented(_counter);
  }

  function setCounter(uint256 counter) public {
	_counter = counter;
  }

  function setCounter2(uint256 counter, uint256 counter2) public {
	_counter = counter2;
  }

  function incrementAndGetCounter() public view returns (uint256) {
    _counter += 1;
    return _counter;
  }

  function incrementCounterManyTimes(uint256 count) public {
    for (uint256 i = 0; i < count; i++) {
      _counter += 1;
      emit Incremented(_counter);
    }
  }
}
