const CallableCounter = artifacts.require('CallableCounter');
const Web3c = require('web3c');
const truffleConfig = require('../truffle-config');
const utils = require('../src/utils');

if (truffleConfig.shouldRun(__filename)) {
  const web3c = utils.web3cSoftWallet();

  contract('Confidential Cross Contract Calls', function (accounts) {
    const options = {
      from: accounts[0],
      gas: '0x100000'
    };

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
          confidential: false
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
          confidential: false
        },
      }
    ];

    let a;
    let b;

    bilateralTestCases.forEach((testCase) => {
      it(`bilateral: deploys a ${testCase.a.label} and a ${testCase.b.label} contract` , async () => {
        b = await callableContract.deploy({
          data: CallableCounter.bytecode,
          arguments: [accounts[0], 5, true, accounts[0]],
          header: {
            confidential: testCase.b.confidential
          }
        }).send();
        a = await callableContract.deploy({
          data: CallableCounter.bytecode,
          arguments: [b.options.address, 10, false, accounts[0]],
          header: {
            confidential: testCase.a.confidential
          }
        }).send();
      });

      it(`bilateral: ${testCase.a.label} calls ${testCase.b.label}`, async () => {
        // Given contracts A and B.

        // When.
        let aCount = await a.methods.getCounter().invoke();
        let aPeerCount = await a.methods.getPeerCounter().invoke();
        let aSender = await a.methods._sender().invoke();
        let bSender = await b.methods._sender().invoke();

        // Then.
        assert.equal(aCount, 10);
        assert.equal(aPeerCount, 5);
        // Not set, so defaults to 0.
        assert.equal(aSender, 0);
        assert.equal(bSender, 0);
      });

      it(`bilateral: ${testCase.a.label} sets ${testCase.b.label} storage via call`, async () => {
        // Given, contracts A and B.

        // When.
        await a.methods.incrementPeerCounter().send();

        // Then.

        let aCount = await a.methods.getCounter().invoke();
        let bCount = await b.methods.getCounter().invoke();

        let aSender = await a.methods._sender().invoke();
        let bSender = await b.methods._sender().invoke();

        // Unchanged.
        assert.equal(aCount, 10);
        // Incremented.
        assert.equal(bCount, 6);
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

        let aCount = await a.methods.getCounter().invoke();
        let bCount = await b.methods.getCounter().invoke();

        // Incremented.
        assert.equal(aCount, 11);
        // Unchanged.
        assert.equal(bCount, 6);

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
          name: 'A',
          confidential: true
        },
        b: {
          label: 'confidential',
          name: 'B',
          confidential: true
        },
        c: {
          label: 'confidential',
          name: 'C',
          confidential: true
        },
      },
      {
        a: {
          label: 'confidential',
          name: 'A',
          confidential: true
        },
        b: {
          label: 'non-confidential',
          name: 'B',
          confidential: true
        },
        c: {
          label: 'confidential',
          name: 'C',
          confidential: true
        },
      }

    ];

    threePartyCases.forEach((testCase) => {

      it(`3-party: deploys a ${testCase.a.label}, ${testCase.b.label} and a ${testCase.c.label} contract`, async () => {
        c = await callableContract.deploy({
          data: CallableCounter.bytecode,
          arguments: [accounts[0], 2, true, accounts[0]],
          header: {
            confidential: testCase.b.confidential
          }
        }).send();
        b = await callableContract.deploy({
          data: CallableCounter.bytecode,
          arguments: [c.options.address, 1, false, accounts[0]],
          header: {
            confidential: testCase.b.confidential
          }
        }).send();
        a = await callableContract.deploy({
          data: CallableCounter.bytecode,
          arguments: [b.options.address, 0, false, accounts[0]],
          header: {
            confidential: testCase.a.confidential
          }
        }).send();
      });

      it(`3-party: ${testCase.a.label} calls ${testCase.c.label} through ${testCase.b.label}`, async () => {
        // Given contracts A, B, C.

        // When.
        let cCount = await a.methods.getTailCounter().invoke();

        // Then.
        assert.equal(cCount, 2);
      });

      it(`3-party: ${testCase.a.label} sets storage of ${testCase.c.label} through ${testCase.b.label}`, async () => {
        // Given contracts A, B, C.

        // When.
        await a.methods.incrementTailCounter().send();
        let cCount = await c.methods.getCounter().invoke();

        // Then.
        assert.equal(cCount, 3);
        let aSender = await a.methods._sender().invoke();
        let bSender = await b.methods._sender().invoke();
        let cSender = await c.methods._sender().invoke();
        // Set via call so should be the contract that called it.
        assert.equal(aSender, accounts[0]);
        assert.equal(bSender, a.options.address);
        assert.equal(cSender, b.options.address);
      });

      // accounts[0] - (call) -> A - (delegatecall) -> B - (delegatecall) -> C
      // This updates A's count with msg.sender == accounts[0] *when executing* all contracts.
      it(`3-party: ${testCase.a.label} causes ${testCase.b.label} to set storage of ${testCase.c.label} via delegatecall and delegatecall`, async () => {
        // Given contracts A, B, C.

        // When.
        await a.methods.incrementTailDelegatecallDelegatecall().send({
          gas: '0xf42400'
        });

        // Then.
        let aCount = await a.methods.getCounter().invoke();
        let bCount = await b.methods.getCounter().invoke();
        let cCount = await c.methods.getCounter().invoke();
        assert.equal(aCount, 1);
        assert.equal(bCount, 1);
        assert.equal(cCount, 3);
      });

      // A - (delegatecall) -> B - (call) -> C
      // This updates B's count with msg.sender == accounts[0] *when executing* all contracts.
      it(`3-party: ${testCase.c.label} sets storage of ${testCase.a.label} through ${testCase.b.name} via delegatecall and call`, async () => {
        // Given contracts A, B, C.

        // When.
        await a.methods.incrementTailDelegatecallCall().send({
          gas: '0xf42400'
        });

        // Then.
        let aCount = await a.methods.getCounter().invoke();
        let bCount = await b.methods.getCounter().invoke();
        let cCount = await c.methods.getCounter().invoke();
        assert.equal(aCount, 1);
        assert.equal(bCount, 2);
        assert.equal(cCount, 3);
      });
    });


  });
}
