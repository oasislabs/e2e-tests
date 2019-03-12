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

    let callableContract = new web3c.oasis.Contract(CallableCounter.abi, undefined, options);

	let bilateralTestCases = [
	  {
		a: {
		  label: 'non-confidential',
		  confidential: false
		},
		b: {
		  label: 'non-confidential',
		  confidential: false
		},
	  },
	  {
		a: {
		  label: 'confidential',
		  confidential: true
		},
		b: {
		  label: 'confidential',
		  confidential: true
		},
	  },
	  {
		a: {
		  label: 'non-confidential',
		  confidential: true
		},
		b: {
		  label: 'confidential',
		  confidential: true
		},
	  },
	  {
		a: {
		  label: 'confidential',
		  confidential: true
		},
		b: {
		  label: 'non-confidential',
		  confidential: true
		},
	  }
	]

    let a;
    let b;

	bilateralTestCases.forEach((testCase) => {
	  it(`bilateral: deploys a ${testCase.a.label} and a ${testCase.b.label} contract` , async () => {
		b = await callableContract.deploy({
          data: CallableCounter.bytecode,
          arguments: [accounts[0], 1, true],
          header: {
			confidential: testCase.b_confidential
          }
		}).send();
		a = await callableContract.deploy({
          data: CallableCounter.bytecode,
          arguments: [b.options.address, 0, false],
          header: {
			confidential: testCase.a_confidential
          }
		}).send();
      });

      it(`bilateral: ${testCase.a.label} calls ${testCase.b.label}`, async () => {
		// Given contracts A and B.

		// When.
		let aCount = await a.methods.getCounter().call();
		let aPeerCount = await a.methods.getPeerCounter().call();

		// Then.
		assert.equal(aCount, 0);
		assert.equal(aPeerCount, 1);
      });

      it(`bilateral: ${testCase.a.label} sets ${testCase.b.label} storage via call`, async () => {
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

      it(`bilateral: ${testCase.a.label} sets ${testCase.b.label} storage via delegatecall`, async () => {
		// Given, contracts A and B.

		// When.
		await a.methods.delegatecallIncrementCounter().send();

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
	});

	let c = undefined;

	let threePartyCases = [
	  {
		a: {
		  label: 'non-confidential',
		  confidential: false
		},
		b: {
		  label: 'non-confidential',
		  confidential: false
		},
		c: {
		  label: 'non-confidential',
		  confidential: false
		},
	  },
	  {
		a: {
		  label: 'confidential',
		  confidential: true
		},
		b: {
		  label: 'confidential',
		  confidential: true
		},
		c: {
		  label: 'confidential',
		  confidential: true
		},
	  },
	  {
		a: {
		  label: 'confidential',
		  confidential: true
		},
		b: {
		  label: 'non-confidential',
		  confidential: true
		},
		c: {
		  label: 'confidential',
		  confidential: true
		},
	  }

	];


	threePartyCases.forEach((testCase) => {

	  it(`3-party: deploys a ${testCase.a.label}, ${testCase.b.label} and a ${testCase.c.label} contract`, async () => {
		c = await callableContract.deploy({
		  data: CallableCounter.bytecode,
          arguments: [accounts[0], 2, true],
          header: {
			confidential: testCase.b_confidential
          }
		}).send();
		b = await callableContract.deploy({
          data: CallableCounter.bytecode,
          arguments: [c.options.address, 1, false],
          header: {
			confidential: testCase.b_confidential
          }
		}).send();
		a = await callableContract.deploy({
          data: CallableCounter.bytecode,
          arguments: [b.options.address, 0, false],
          header: {
			confidential: testCase.a_confidential
          }
		}).send();
	  });

	  it(`3-party: ${testCase.a.label} calls ${testCase.c.label} through ${testCase.b.label}`, async () => {
		// Given contracts A, B, C.

		// When.
		let cCount = await a.methods.getTailCounter().call();

		// Then.
		assert.equal(cCount, 2);
		let aSender = await a.methods._sender().call();
		let bSender = await b.methods._sender().call();
		let cSender = await c.methods._sender().call();
		// Not set so just 0.
		assert.equal(aSender, 0);
		assert.equal(bSender, 0);
		assert.equal(cSender, 0);
      });

	  it(`3-party: ${testCase.a.label} sets storage of ${testCase.c.label} through ${testCase.b.label}`, async () => {
		// Given contracts A, B, C.

		// When.
		await a.methods.incrementTailCounter().send();
		let cCount = await c.methods.getCounter().call();

		// Then.
		assert.equal(cCount, 3);
		let aSender = await a.methods._sender().call();
		let bSender = await b.methods._sender().call();
		let cSender = await c.methods._sender().call();
		// Set via call so should be the contract that called it.
		assert.equal(aSender, accounts[0]);
		assert.equal(bSender, a.options.address);
		assert.equal(cSender, b.options.address);
      });

	  it(`3-party: ${testCase.a.label} sets storage of ${testCase.c.label} through ${testCase.b.label} via delegatecall`, async () => {
		// Given contracts A, B, C.

		// When.
		await a.methods.incrementTailCounterDelegatecall().send({
		  gas: '0xf42400'
		});
		let aCount = await a.methods.getCounter().call();
		let bCount = await b.methods.getCounter().call();
		let cCount = await c.methods.getCounter().call();

		// Then.
		assert.equal(aCount, 0);
		assert.equal(bCount, 2);
		assert.equal(cCount, 3);
		let aSender = await a.methods._sender().call();
		let bSender = await b.methods._sender().call();
		let cSender = await c.methods._sender().call();
		// Set via delegatecall so should be the originator of the transaction (delegatecall
		// preserves msg.sender).
		assert.equal(aSender, accounts[0]);
		assert.equal(bSender, a.options.address);
		assert.equal(cSender, b.options.address);
      });
	});

  });
}
