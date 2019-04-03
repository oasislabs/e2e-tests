const Counter = artifacts.require('Counter');
const request = require('request-promise');
const truffleConfig = require('../truffle-config');
const Web3c = require('web3c');

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
  if (truffleConfig.NETWORK === 'devnet') {
    return truffleConfig.DEVNET_HTTPS_PROVIDER_URL;
  }
  if (truffleConfig.NETWORK === 'staging') {
    return truffleConfig.STAGING_HTTPS_PROVIDER_URL;
  }
  return truffleConfig.HTTPS_PROVIDER_URL;
}

function wsProviderUrl () {
  // Special case Devnet because the wsProviderUrl is constant and doesn't require
  // definition by a client running the tests.
  if (providerUrl() === truffleConfig.DEVNET_HTTPS_PROVIDER_URL) {
    return truffleConfig.DEVNET_WS_PROVIDER_URL;
  }
  if (providerUrl() === truffleConfig.STAGING_HTTPS_PROVIDER_URL) {
    return truffleConfig.STAGING_WS_PROVIDER_URL;
  }
  if (truffleConfig.WS_PROVIDER_URL === undefined) {
    throw new Error('You must define the WS_PROVIDER_URL environment variable.');
  }
  return truffleConfig.WS_PROVIDER_URL;
}

/**
 * @returns a web3c instance with softwallet setup.
 */
function web3cSoftWallet (websocket = true) {
  let provider;
  if (websocket) {
    provider = new (new Web3c()).providers.WebsocketProvider(wsProviderUrl());
  } else {
    provider = new (new Web3c()).providers.HttpProvider(providerUrl());
  }

  const web3c = new Web3c(provider, undefined, {
    keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
  });

  let hdWalletProvider = Counter.web3.currentProvider;
  let addr = hdWalletProvider.addresses[0];
  let privKey = '0x' + hdWalletProvider.wallets[addr]._privKey.toString('hex');
  let acct = web3c.eth.accounts.privateKeyToAccount(privKey);
  web3c.eth.defaultAccount = acct.address;
  web3c.eth.accounts.wallet.add(acct);

  web3c.oasis.defaultAccount = acct.address;
  web3c.oasis.accounts.wallet.add(acct);

  return web3c;
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setupWebsocketProvider (hdWalletProvider) {
  const web3cWebsocket = new Web3c(new (new Web3c()).providers.WebsocketProvider(wsProviderUrl()), undefined, {
    keyManagerPublicKey: truffleConfig.KEY_MANAGER_PUBLIC_KEY
  });

  let addr = Object.keys(hdWalletProvider.wallets)[0];
  let privKey = '0x' + hdWalletProvider.wallets[addr]._privKey.toString('hex');
  let acct = web3cWebsocket.eth.accounts.privateKeyToAccount(privKey);

  web3cWebsocket.eth.defaultAccount = acct.address;
  web3cWebsocket.eth.accounts.wallet.add(acct);

  web3cWebsocket.oasis.defaultAccount = acct.address;
  web3cWebsocket.oasis.accounts.wallet.add(acct);

  return web3cWebsocket;
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
  web3cSoftWallet,
  sleep,
  setupWebsocketProvider,
  PUBLIC_KEY_LENGTH,
  GAS_LIMIT,
  GAS_PRICE
};
