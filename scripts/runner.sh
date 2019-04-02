#! /bin/bash

####################################################################################
# Get funds from API faucet and run e2e tests against a specified gateway.
# Only works in-cluster, as the API faucet is not exposed externally.
#
# ./runner.sh <HTTPS_PROVIDER_URL> <WS_PROVIDER_URL> <FAUCET_URL> [...]
#
# Required Args:
#
# - HTTPS_PROVIDER_URL: The gateway http endpoint (e.g., https://web3.oasiscloud.io).
# - WS_PROVIDER_URL:    Gateway websocket endpoint (e.g., wss://web.oasiscloud.io/ws).
# - FAUCET_URL:         API faucet endpoint.
# - Optional extra args are passed to 'truffle test'.
#
####################################################################################

# Helpful tips on writing build scripts:
# https://buildkite.com/docs/pipelines/writing-build-scripts
set -euxo pipefail

# Skip contract compilation step (contracts are prebuilt).
export SKIP_OASIS_COMPILE=true

# Export gateway endpoints for truffle.
export HTTPS_PROVIDER_URL=$1
export WS_PROVIDER_URL=$2
export KEY_MANAGER_PUBLIC_KEY="0x51d5e24342ae2c4a951e24a2ba45a68106bcb7986198817331889264fd10f1bf"

FAUCET_URL=$3

# Generate a mnemonic and request funds from the API faucet.
mnemonic=`node src/funder.js $HTTPS_PROVIDER_URL $FAUCET_URL`
export MNEMONIC=$mnemonic

# Run truffle tests.
shift 3
npm run test:development $*
