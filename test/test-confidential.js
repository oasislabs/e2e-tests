const Counter = artifacts.require('Counter');
const _assert = require('assert');
const Web3c = require('web3c');
const utils = require('./utils');

contract('Confidential Contracts', async (accounts) => {
  const web3c = new Web3c(Counter.web3.currentProvider);

  let counterContract = new web3c.confidential.Contract(Counter.abi, undefined, {
    from: accounts[0]
  });

  it('stores the long term public key in the deploy logs', async () => {
    counterContract = await counterContract.deploy({ data: Counter.bytecode })
      .send()
      .on('receipt', (receipt) => {
        assert.equal(Object.keys(receipt.events).length, 1);

        let log = receipt.events['0'];
        assert.equal(log.raw.topics[0], '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        validatePublicKey(log.raw.data);
        assert.equal(log.transactionLogIndex, '0x0');
      });
  });

  let publicKeyPayload = null;

  it('retrieves a public key with a timestamp', async () => {
    publicKeyPayload = (await utils.makeRpc(
      'confidential_getPublicKey',
      [counterContract.options.address],
      utils.providerUrl(web3c)
    )).result;
    assert.equal(publicKeyPayload.timestamp > 0, true);
    validatePublicKey(publicKeyPayload.public_key);
  });

  // Note we don't do validation of the signature here. See ekiden or web3c.js for
  // signature validation tests.
  it('retrieves a public key with a signature of the correct form', async () => {
    assert.equal(publicKeyPayload.signature.length, 130);
    assert.equal(publicKeyPayload.signature.substr(0, 2), '0x');
    assert.equal(/0x[a-z0-9]+/.test(publicKeyPayload.signature), true);
  });

  it('should not retrieve contract keys from a non deployed contract address', async function () {
    await _assert.rejects(
      async function () {
        await web3c
          .confidential
          .getPublicKey('0x0000000000000000000000000000000000000000');
      }
    );
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

/**
 * Check the key is there. Expect it to be any (unpredictable) key of the form
 * '0x9385b8391e06d67c3de1675a58cffc3ad16bcf7cc56ab35d7db1fc03fb227a54'.
 */
function validatePublicKey (publicKey) {
  assert.equal(publicKey.length, 66);
  assert.equal(publicKey.substr(0, 2), '0x');
  assert.equal(/0x[a-z0-9]+/.test(publicKey), true);
}
