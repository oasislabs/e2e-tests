const CallableCounter = artifacts.require('CallableCounter');
const Web3c = require('web3c');
const truffleConfig = require('../truffle-config');
// Use the provider set in our truffle-config.js.
const web3c = new Web3c(CallableCounter.web3.currentProvider, undefined, {
  keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
});

if (truffleConfig.shouldRun(__filename)) {
  contract('Confidential Cross Contract Calls', function (accounts) {
    const options = { from: accounts[0] };

	let callableContract  = new web3c.oasis.Contract(CallableCounter.abi, undefined, options);

	let a = undefined;
	let b = undefined;

	it ('sets up non-confidential contracts', async () => {
	  b = await callableContract.deploy({
		data: CallableCounter.bytecode,
		arguments: [accounts[0], 1], // This arg doesnt matter.
		header: {
		  confidential: false
		}
	  }).send();
	  a = await callableContract.deploy({
		data: CallableCounter.bytecode,
		arguments: [b.options.address, 0],
		header: {
		  confidential: false
		}
	  }).send();
	});

	it('non-confidential calls non-confidential', async () => {
	  // Given contracts A and B.

	  // When.
	  let aPeerCount = await a.methods.getPeerCounter().call();

	  // Then.
	  assert.equal(aPeerCount, 1);
	});

	it('non-confidential sets non-confidential storage via call', async () => {
	  // Given, contracts A and B.

	  // When.
	  await a.methods.incrementPeerCounter().send();

	  // Then.
	  let aCount = await a.methods.getCounter().call();
	  let bCount = await b.methods.getCounter().call();

	  let aSender = await a.methods._sender().call();
	  let bSender = await b.methods._sender().call();

	  // Unchanged.
	  assert.equal(aCount, 0);
	  // Incremented.
	  assert.equal(bCount, 2);
	  // Sender is originator of transaction.
	  assert.equal(aSender, accounts[0]);
	  // Sender is contract A because it invoked a call.
	  assert.equal(bSender, a.options.address);
	});

	it('non-confidential sets non-confidential storage via delegatecall', async () => {
	  // Given, contracts A and B.

	  // When.
	  let r = await a.methods.delegatecallIncrementCounter().send();

	  // Then.
	  let aCount = await a.methods.getCounter().call();
	  let bCount = await b.methods.getCounter().call();

	  let aSender = await a.methods._sender().call();
	  let bSender = await b.methods._sender().call();

	  // Incremented.
	  assert.equal(aCount, 1);
	  // Unchanged.
	  assert.equal(bCount, 2);
	  // Sender is originator of transaction.
	  assert.equal(aSender, accounts[0]);
	  // Sender is contract A because it invoked a call.
	  assert.equal(bSender, a.options.address);
	});

	it('non-confidential sets non-confidential storage via callcode', async () => {
	  // todo
	});

	it ('sets up confidential contracts', async () => {
	  b = await callableContract.deploy({
		data: CallableCounter.bytecode,
		arguments: [accounts[0], 1], // This arg doesnt matter.
		header: {
		  confidential: true
		}
	  }).send();
	  a = await callableContract.deploy({
		data: CallableCounter.bytecode,
		arguments: [b.options.address, 0],
		header: {
		  confidential: true
		}
	  }).send();
	});


	it('confidential calls confidential', async () => {
	  // Given contracts A and B.

	  // When.
	  let aPeerCount = await a.methods.getPeerCounter().call();

	  // Then.
	  assert.equal(aPeerCount, 1);
    });

	it('confidential calls confidential and sets storage', async () => {

    });

    it('confidential calls non-confidential', async () => {

    });

	it('confidential calls non-confidential and sets storage', async () => {

    });

	it('non-confidential confidential', async () => {

    });

	it('non-confidential confidential and sets storaage', async () => {

    });
  });
}
