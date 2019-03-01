pragma solidity 0.4.25;

contract CallableCounter {

  /// The peer that I can call.
  CallableCounter public _peer;
  /// The msg.sender value of the last contract to call me.
  address public _sender;
  /// The current count.
  uint256 public _count;

  event Status(bool status);

  constructor(address peer, uint256 count) public {
	_peer = CallableCounter(peer);
	_count = count;
  }

  function incrementCounter() public {
	_count = _count + 1;
	_sender = msg.sender;
  }

  function getCounter() public returns (uint256) {
	return _count;
  }

  function incrementPeerCounter() public {
	_peer.incrementCounter();
	_sender = msg.sender;
  }

  function getPeerCounter() public returns (uint256) {
	return _peer.getCounter();
  }

  /// Makes a delegatecall to the peer, so that the peer invokes *my*
  /// counter's storage. Preserves msg.sender.
  function delegatecallIncrementCounter() public {
    bool status = address(_peer).delegatecall(bytes4(keccak256("receiveDelegatecallIncrementCounter()")));
	// WTF why is this needed (also need with ganache).
	emit Status(status);
	require(status);
  }

  /// Receives a message call through a delegatecall.
  function receiveDelegatecallIncrementCounter() public {
	// This will not update my counter. It will update the counter
	// of whoever delegatecalled into this method.
	_count = _count + 1;
	_sender = msg.sender;
  }

  /// Makes a callcode to the peer, so that the peer invokes *my*
  /// counter's storage. Does not preserve msg.sender.
  function callcodeIncrementCounter() public {
	// todo
  }

  /// Receives a message call through a callcode.
  function receivecallcodeGetCounter() public {
	// todo
  }
}
