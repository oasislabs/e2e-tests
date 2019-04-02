#! /bin/bash

####################################################################################
# Get funds from API faucet and run e2e tests against a specified gateway.
# Only works in-cluster, as the API faucet is not exposed externally.
#
# ./runner.sh <HTTPS_PROVIDER_URL> <WS_PROVIDER_URL> <FAUCET_URL>
#             <PROM_PUSH_GATEWAY> <PROM_JOB_PREFIX> [...]
#
# Required Args:
#
# - HTTPS_PROVIDER_URL: The gateway http endpoint (e.g., https://web3.oasiscloud.io).
# - WS_PROVIDER_URL:    Gateway websocket endpoint (e.g., wss://web.oasiscloud.io/ws).
# - FAUCET_URL:         API faucet endpoint.
# - PROM_PUSH_GATEWAY:  Prometheus push gateway endpoint.
# - PROM_JOB_NAME:      Prometheus job name.
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

# API faucet url.
FAUCET_URL=$3

# Prometheus config.
PROM_PUSH_GATEWAY=$4
PROM_JOB_NAME=$5

# Push the result to Prometheus.
function report {
  result=$?
  node src/pusher.js $PROM_PUSH_GATEWAY $PROM_JOB_NAME $result
}
trap report EXIT

# Generate a mnemonic and request funds from the API faucet.
mnemonic=`node src/funder.js $HTTPS_PROVIDER_URL $FAUCET_URL`
export MNEMONIC=$mnemonic

# Run truffle tests.
shift 5
npm run test:development $*
