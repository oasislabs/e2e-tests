pragma solidity >=0.4.21 <0.6.0;

contract Event {
    event MyEvent(uint _value);

    function emitEvent(uint _value) public {
        emit MyEvent(_value);
    }
}
