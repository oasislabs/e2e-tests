pragma solidity 0.4.25;

/// CallableCounter is a linked list of counter contracts that can call each other.
contract CallableCounter {

  /// The peer that I can call.
  CallableCounter public _peer;
  /// The msg.sender value of the last contract to call me.
  address public _sender;
  /// The current count.
  uint256 public _count;
  /// True iff this is the last counter in a linked ist.
  bool public _isTail;
  /// The expected address of msg.sender when receiving a delegatecall.
  address _expectedDelegatecallSender;

  event Status(bool status);

  event Hi(address h);

  constructor(address peer, uint256 count, bool isTail, address expectedDelegatecallSender) public {
    _peer = CallableCounter(peer);
    _count = count;
    _isTail = isTail;
    _expectedDelegatecallSender = expectedDelegatecallSender;
  }

  function incrementCounter() public {
    _count = _count + 1;
    _sender = msg.sender;
  }

  /// Returns this contracts counter.
  function getCounter() public returns (uint256) {
    return _count;
  }

  function incrementPeerCounter() public {
    _peer.incrementCounter();
    _sender = msg.sender;
  }

  /// Recursively calls peer until the tail counter is incremented.
  function incrementTailCounter() public {
    if (_peer.isTail()) {
      _peer.incrementCounter();
      _sender = msg.sender;
    } else {
      _peer.incrementTailCounter();
      _sender = msg.sender;
    }
  }

  /// Returns the tail counter's count.
  function getTailCounter() public returns (uint256) {
    if (_peer.isTail()) {
      _sender = msg.sender;
      return _peer.getCounter();
    } else {
      _sender = msg.sender;
      return _peer.getTailCounter();
    }
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

  function incrementTailCounterDelegatecall() public {
    require(msg.sender == _expectedDelegatecallSender);

    _sender = msg.sender;

    bool status = address(_peer).delegatecall(bytes4(keccak256("incrementDelegatecallProxy()")));
    emit Status(status);
    require(status);
  }

  function incrementDelegatecallProxy() public {
    require(msg.sender == _expectedDelegatecallSender);

    _sender = msg.sender;
    _peer.receiveDelegatecallIncrementCounter();
  }

  /// Receives a message call through a delegatecall.
  function receiveDelegatecallIncrementCounter() public {
    // This will not update my counter. It will update the counter
    // of whoever delegatecalled into this method.
    _count = _count + 1;
    _sender = msg.sender;
  }

  function isTail() public returns (bool) {
    return _isTail;
  }
}
