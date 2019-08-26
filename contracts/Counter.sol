pragma solidity ^0.4.0;

contract Counter {
  event Incremented(uint newCounter);

  uint256 _counter;

  function verify_counter_value(uint256 value) public {
    require(value == _counter, "counter does not equal to expected value");
  }

  function get_counter() public view returns (uint256) {
    return _counter;
  }

  function increment_counter() public {
    _counter += 1;
    emit Incremented(_counter);
  }

  function set_counter(uint256 counter) public {
	_counter = counter;
  }

  function set_counter2(uint256 counter, uint256 counter2) public {
	_counter = counter2;
  }

  function increment_and_get_counter() public view returns (uint256) {
    _counter += 1;
    return _counter;
  }

  function increment_counter_many_times(uint256 count) public {
    for (uint256 i = 0; i < count; i++) {
      _counter += 1;
      emit Incremented(_counter);
    }
  }
}
