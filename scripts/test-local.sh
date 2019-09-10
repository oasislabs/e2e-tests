#! /bin/bash

################################################################################
#
# test-local.sh is a convenience script to easily run the e2e-tests. To run
# one must have the following dependencies installed.
#
# * oasis-cli
# * oasis-build
# * oasis-chain
#
# In addition, one should (optionally) have the runtime-ethereum repository
# cloned.
#
# Usage:
#
# From the e2e-tests top level directory, run
#
# ./scripts/test-local.sh [-t <path>] [-r <boolean>] [-e <path>]
#
# -t (optional) is the path to the file to test. If not given, all tests run.
# -r (optional) is true iff we want to compile the rust services.
#               Defaults to false.
# -e (optional) is the path to the runtime-ethereum directory. Set this if
#               you want to use runtime-ethereum's single-node config instead
#               of oasis-chain.
#
################################################################################

set -eo pipefail

# CLI arguments.

# True iff we want to compile the rust contracts.
rust_compile=0
# The file to test. If empty, then run all tests.
test=""
# The absolute path to the runtime-ethereum repo.
runtime_ethereum=""

# Parse CLI arguments into the above variables.
while getopts 'r:t:e:' arg
do
    case ${arg} in
        r) rust_compile=${OPTARG};;
        t) test=${OPTARG};;
        e) runtime_ethereum=${OPTARG};;
        *)
            echo "Usage: $0 [-t <test-filename>] [-r <boolean>]"
            exit 1
    esac
done

source scripts/common.sh

# oasis-chain must be installed to run this script.
if ! [ -x "$(command -v oasis-chain)" ]; then
    echo "ERROR: oasis-chain is not installed"
    exit 1
fi

# oasis-cli must be installed.
if ! [ -x "$(command -v oasis)" ]; then
    echo "ERROR: oasis is not installed"
    exit 1
fi

# TODO: launch the developer gateway.

if $rust_compile; then
    pushd mantle
        oasis build
    popd
fi

# Setup data directory for e2e-tests.
mkdir -p /tmp/e2e-tests

# Export ENV variables and boot up the chain
if [ "$runtime_ethereum" == "" ] ; then
    echo "Starting oasis-chain"

    export HTTPS_PROVIDER_URL="http://localhost:8545"
    export WS_PROVIDER_URL="ws://localhost:8546"
    export MNEMONIC="range drive remove bleak mule satisfy mandate east lion minimum unfold ready"
    export OASIS_CLIENT_SK="0xb5144c6bda090723de712e52b92b4c758d78348ddce9aa80ca8ef51125bfb308"
    export DEVELOPER_GATEWAY_URL="http://localhost:1234"

    oasis-chain > /tmp/e2e-tests/oasis-chain.log &
else
    echo "Starting single-node-config from $runtime_ethereum"

    export HTTPS_PROVIDER_URL="http://localhost:8545"
    export WS_PROVIDER_URL="ws://localhost:8555"
    export MNEMONIC="patient oppose cotton portion chair gentle jelly dice supply salmon blast priority"
    export OASIS_CLIENT_SK="533d62aea9bbcb821dfdda14966bb01bfbbb53b7e9f5f0d69b8326e052e3450c"
    export DEVELOPER_GATEWAY_URL="http://localhost:1234"

    pushd $runtime_ethereum
        make run-gateway > /tmp/e2e-tests/run-gateway.log
    popd
fi

npm run test:development $test
