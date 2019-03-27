const bip39 = require('bip39')
const HDWalletProvider = require('truffle-hdwallet-provider');
const parseArgs = require('minimist');
const request = require('request-promise');

/**
 * Request funds from the API faucet.
 * Will only work in cluster (staging or prod).
 */
async function requestFunds (address, faucet) {
    // Request 1 DEV.
    let url = faucet + '?to=' + address + '&amnt=0xde0b6b3a7640000';
    await request(url);
}

// Parse command-line arguments.
const argv = parseArgs(process.argv.slice(2));
if (argv._.length !== 2) {
  console.error("Usage: funder <gateway_https_endpoint> <private_faucet_endpoint>");
  process.exit(1);
}
let gateway = argv._[0];
let faucet = argv._[1];

// Generate a mnemonic.
const mnemonic = bip39.generateMnemonic();
let wallet = new HDWalletProvider(mnemonic, gateway);
let address = wallet.addresses[0];

// Request funds from the faucet.
requestFunds(address, faucet).catch(error => {
  console.error("Could not get funds from API faucet.");
  process.exit(1);
}).then(() => {
  // Print the generated mnemonic.
  console.log(mnemonic);
  process.exit(0);
});
