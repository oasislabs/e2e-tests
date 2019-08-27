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
# Usage:
#
# From the e2e-tests top level directory, run
#
# ./scripts/test-local.sh [-t <test-filename>]  [-r <boolean>]
#
# -t (optional) is the path to the file to test. If not given, all tests run.
# -c (optional) is true iff we want to compile the rust services.
#               Defaults to false.
#
################################################################################

# CLI arguments.

# True iff we want to compile the rust contracts.
RUST_COMPILE=0
# The file to test. If empty, then run all tests.
TEST=""

# Parse CLI arguments into the above variables.
while getopts 'r:t:' arg
do
    case ${arg} in
        r) RUST_COMPILE=${OPTARG};;
        t) TEST=${OPTARG};;
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

# Export ENV variables for the tests to run.
export HTTPS_PROVIDER_URL="http://localhost:8545"
export WS_PROVIDER_URL="ws://localhost:8546"
export MNEMONIC="range drive remove bleak mule satisfy mandate east lion minimum unfold ready"
export OASIS_CLIENT_SK="0xb5144c6bda090723de712e52b92b4c758d78348ddce9aa80ca8ef51125bfb308"
export DEVELOPER_GATEWAY_URL="http://localhost:1234"

# TODO: launch the developer gateway.

if $RUST_COMPILE; then
    pushd mantle
        oasis build
    popd
fi

# Setup data directory for e2e-tests.
mkdir -p /tmp/e2e-tests

# Start the blockchain the tests run against.
oasis-chain > /tmp/e2e-tests/oasis-chain.log &

npm run test:development $TEST
