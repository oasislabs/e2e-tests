const Web3 = require('web3');
const TestEvent = artifacts.require('./Event.sol');
const web3 = new Web3(TestEvent.web3.currentProvider);

contract('TestEvent', (accounts) => {
  it('should emit a log', async () => {
    let instance = await new web3.eth.Contract(TestEvent.abi, undefined, {
      from: accounts[0]
    }).deploy({
      data: TestEvent.bytecode
    }).send();
    let emitEventTransaction = await instance.methods.emitEvent(123).send();
    assert.equal(emitEventTransaction.events.MyEvent.returnValues._value, 123, 'Event argument is incorrect');
  });
});
