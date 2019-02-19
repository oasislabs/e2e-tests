const Counter = artifacts.require('Counter');
const hash = require('js-sha512').sha512_256;
const nacl = require('tweetnacl');
const Web3c = require('web3c');
const utils = require('../src/utils');

const truffleConfig = require('../truffle-config');

if (truffleConfig.shouldRun(__filename)) {
  contract('Confidential Contracts', async (accounts) => {
    const web3c = new Web3c(Counter.web3.currentProvider);

    // Timestamp is expected to be 2^53-1, the maximum safe integer in javascript.
    const expectedTimestamp = '9007199254740991';
    // Uint8Array representation when interpreting expectedTimestamp as a u64.
    const expectedTimestamp8Array = new Uint8Array([0, 31, 255, 255, 255, 255, 255, 255]);
    // Contract we will be testing against.
    let counterContract = new web3c.confidential.Contract(Counter.abi, undefined, {
      from: accounts[0]
    });
    // System log output by the confidential vm. Expect the log to be of the
    // form public_key || sign(public_key).
    let deployLog;

    it('stores the long term public key in the deploy logs', async () => {
      counterContract = await counterContract.deploy({ data: Counter.bytecode })
        .send()
        .on('receipt', (receipt) => {
          // The Counter contract does not itself define any logs.
          assert.equal(Object.keys(receipt.events).length, 1);
          // Save the log for use by other tests.
          deployLog = receipt.events['0'];
          // Validate the log came from 0xff...f address.
          assert.equal(deployLog.raw.topics[0], '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
          // Validate it is the very first log in the transaction.
          assert.equal(deployLog.transactionLogIndex, '0x0');
          // Chop off 0x.
          let publicKey = deployLog.raw.data.substr(0, 2 + utils.PUBLIC_KEY_LENGTH);
          // Should start with 0x.
          assert.equal(publicKey.substr(0, 2), '0x');
          // Validate the public key is valid.
          validatePublicKey(publicKey.substr(2));
        });
    });

    it('stores a key manager signature of the long term key in the deploy logs', async () => {
      let publicKey = deployLog.raw.data.substr(2, utils.PUBLIC_KEY_LENGTH);
      let signature = deployLog.raw.data.substr(2 + utils.PUBLIC_KEY_LENGTH);
      validateSignature(utils.fromHexStr(signature), utils.fromHexStr(publicKey));
    });

    // Response from the web3c rpc confidential_getPublicKey.
    let publicKeyPayload = null;

    it('retrieves a public key with a max timestamp', async () => {
      publicKeyPayload = (await utils.makeRpc(
        'confidential_getPublicKey',
        [counterContract.options.address],
        utils.providerUrl()
      )).result;

      validatePublicKey(publicKeyPayload.public_key.substr(2));

      assert.equal(publicKeyPayload.timestamp, expectedTimestamp);
    });

    it('retrieves a public key signed by the key manager', async () => {
      validateSignature(
        utils.fromHexStr(publicKeyPayload.signature.substr(2)),
        utils.fromHexStr(publicKeyPayload.public_key.substr(2)),
        expectedTimestamp8Array
      );
    });

    // Note we don't do validation of the signature here. See ekiden or web3c.js for
    // signature validation tests.
    it('retrieves a public key with a signature of the correct form', async () => {
      assert.equal(publicKeyPayload.signature.length, 130);
      assert.equal(publicKeyPayload.signature.substr(0, 2), '0x');
      assert.equal(/0x[a-z0-9]+/.test(publicKeyPayload.signature), true);
    });

    it('uses an auto incrementing nonce when encrypting many logs', async () => {
      // Ensure we overflow at least one byte in the counter.
      const numEvents = 256 + 1;
      // Execute a transaction to trigger a bunch of logs to be encrypted.
      const decryptedReceipt = await counterContract.methods.incrementCounterManyTimes(numEvents).send();
      // First check the decrypted data is as expected (web3c will decrypt  automatically).
      const events = decryptedReceipt.events.Incremented;
      assert.equal(events.length, numEvents);
      for (let k = 0; k < numEvents; k += 1) {
        assert.equal(events[k].returnValues.newCounter, k + 1);
      }
      // Now check all nonces are incremented by one.
      const txHash = decryptedReceipt.transactionHash;
      const encryptedReceipt = (await utils.makeRpc(
        'eth_getTransactionReceipt',
        [txHash],
        utils.providerUrl()
      )).result;
      let last;
      encryptedReceipt.logs.forEach((log) => {
        let nonce = utils.fromHexStr(log.data.substr(2, 32));
        if (last === undefined) {
          last = nonce;
        } else {
          let lastPlusOne = utils.incrementByteArray(last);
          assert.deepStrictEqual(lastPlusOne, nonce);
        }
      });
    });

    it('should not retrieve contract keys from a non deployed contract address', async () => {
      publicKeyPayload = await web3c
        .confidential
        .getPublicKey('0x0000000000000000000000000000000000000000');
      assert.equal(publicKeyPayload, null);
    });

    it('should yield a larger estimate for confidential transactions than non-confidential', async () => {
      const confidentialContract = new web3c.confidential.Contract(Counter.abi);
      const confidentialDeploy = confidentialContract.deploy({ data: Counter.bytecode });
      const confidentialEstimatedGas = await confidentialDeploy.estimateGas();

      const contract = new web3c.eth.Contract(Counter.abi);
      const deploy = contract.deploy({ data: Counter.bytecode });
      const estimatedGas = await deploy.estimateGas();

      assert.equal(confidentialEstimatedGas - estimatedGas > 0, true);
    });
  });
}

/**
 * Check the key is there. Expect it to be any (unpredictable) key of the form
 * '0x9385b8391e06d67c3de1675a58cffc3ad16bcf7cc56ab35d7db1fc03fb227a54'.
 */
function validatePublicKey (publicKey) {
  assert.equal(publicKey.length, 64);
  assert.equal(/[a-z0-9]+/.test(publicKey), true);
}

/**
 * Asserts signature is Sign_{key_manager}(hash(longTermKey || timestamp)).
 * Assumes signature, longTermKey, and timestamp are of type Uint8Array.
 * Timestamp is optional.
 */
function validateSignature (signature, longTermKey, timestamp) {
  let predigest;
  if (timestamp !== undefined) {
    predigest = new Uint8Array(longTermKey.length + timestamp.length);
    predigest.set(longTermKey);
    predigest.set(timestamp, longTermKey.length);
  } else {
    predigest = longTermKey;
  }
  const digest = utils.fromHexStr(hash(predigest));
  let keyManagerPk = utils.fromHexStr(utils.KEY_MANAGER_PUBLIC_KEY);
  assert.equal(
    nacl.sign.detached.verify(digest, signature, keyManagerPk),
    true
  );
}
