#! /bin/bash

################################################################################
# Get funds from API faucet and run e2e tests against a specified gateway.
# Only works in-cluster, as the API faucet is not exposed externally.
#
# ./runner.sh <HTTPS_PROVIDER_URL> <WS_PROVIDER_URL> <FAUCET_URL>
#
# Required Args:
#
# - HTTPS_PROVIDER_URL: The gateway http endpoint (e.g., https://web3.oasiscloud.io).
# - WS_PROVIDER_URL:    Gateway's websocket endpoint (e.g., wss://web.oasiscloud.io/ws).
# - FAUCET_URL:         Faucet API endpoint.
#
################################################################################

# Helpful tips on writing build scripts:
# https://buildkite.com/docs/pipelines/writing-build-scripts
set -euxo pipefail

# Skip compilation step.
export SKIP_OASIS_COMPILE=true

# Gateway endpoints.
export HTTPS_PROVIDER_URL=$1
export WS_PROVIDER_URL=$2

# Generate a mnemonic and request funds from the API faucet.
mnemonic=`node src/funder.js $HTTPS_PROVIDER_URL $3`
export MNEMONIC=$mnemonic

# Run truffle tests.
npm run test:development
