#!/bin/bash -e

if [ -z ${MNEMONIC+x} ]; then
    echo "environment variable MNEMONIC must be set"
    exit 1
fi

$@
