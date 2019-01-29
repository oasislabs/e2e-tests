const request = require('request-promise');
const truffleConfig = require('../truffle-config');

const KEY_MANAGER_PUBLIC_KEY = '51d5e24342ae2c4a951e24a2ba45a68106bcb7986198817331889264fd10f1bf';
const PUBLIC_KEY_LENGTH = 64;
const GAS_PRICE = '0x3b9aca00';
const GAS_LIMIT = '0x100000';
const _CONFIDENTIAL_PREFIX = '00656e63';

/**
 * Returns a confidential version of the initcode such that, if it's used in a
 * transaction, it will create a confidential contract.
 */
function makeConfidential (initcodeHex) {
  return '0x' + _CONFIDENTIAL_PREFIX + initcodeHex.substr(2);
}

async function fetchNonce (address) {
  return makeRpc('eth_getTransactionCount', [address, 'latest']);
}

async function makeRpc (method, params, uri) {
  let body = {
    'method': method,
    'id': 1,
    'jsonrpc': '2.0',
    'params': params
  };
  let options = {
    headers: {
      'Content-type': 'application/json'
    },
    method: 'POST',
    uri: uri,
    body: JSON.stringify(body)
  };
  return JSON.parse(await request(options));
}

function fromHexStr (hexStr) {
  return new Uint8Array(hexStr.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

function toHexStr (bytes) {
  return Buffer.from(bytes).toString('hex');
}

/**
 * Adds one to the byteArray, a Uint8Array.
 */
function incrementByteArray (byteArray) {
  let carry = 1;
  let byteIndex = byteArray.length - 1;
  while (carry === 1) {
    carry += byteArray[byteIndex];
    byteArray[byteIndex] = (carry % 256);
    carry /= 256;
    byteIndex -= 1;
    // We've overflowed and are done (result is all zeroes).
    if (byteIndex === 0) {
      return byteArray;
    }
  }
  return byteArray;
}

/**
 * Get the current provider url to make raw RPC requests against.
 * Truffle's HDWalletProvider doesn't provide an api to get it so manually do so.
 */
function providerUrl () {
  if (truffleConfig.DEVNET) {
    return truffleConfig.DEVNET_HTTPS_PROVIDER_URL;
  }
  return truffleConfig.HTTPS_PROVIDER_URL;
}

function wsProviderUrl () {
  // Special case Devnet because the wsProviderUrl is constant and doesn't require
  // definition by a client running the tests.
  if (providerUrl() === truffleConfig.DEVNET_HTTPS_PROVIDER_URL) {
    return truffleConfig.DEVNET_WS_PROVIDER_URL;
  }
  if (truffleConfig.WS_PROVIDER_URL === undefined) {
    throw new Error('You must define the WS_PROVIDER_URL environment variable.');
  }
  return truffleConfig.WS_PROVIDER_URL;
}

module.exports = {
  fetchNonce,
  fromHexStr,
  toHexStr,
  incrementByteArray,
  makeRpc,
  makeConfidential,
  providerUrl,
  wsProviderUrl,
  KEY_MANAGER_PUBLIC_KEY,
  PUBLIC_KEY_LENGTH,
  GAS_LIMIT,
  GAS_PRICE
};
