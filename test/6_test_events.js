const TestEvent = artifacts.require('./Event.sol');

const truffleConfig = require('../truffle-config');

const TEST_NUMBER = 6;

if (truffleConfig.shouldRun(TEST_NUMBER)) {
  contract('TestEvent', (accounts) => {
    it('should emit a log', async () => {
      let instance = await TestEvent.new();
      let emitEventTransaction = await instance.emitEvent(123);
      let event = emitEventTransaction.logs.find(
        e => e.event === 'MyEvent'
      );
      assert.equal(event.args._value.toNumber(), 123, 'Event argument is incorrect');
    });
  });
}
