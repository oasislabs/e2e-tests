#! /bin/bash

################################################################################

# Installs the oasis-client as a git depenendency because npm doesn't support
# lerna based per package installs.

################################################################################

# Already installed so exit.
if [ -d "tmp/oasis-client" ]; then
	echo "oasis-client already exists"
	exit 0
fi

mkdir tmp
pushd tmp
    git clone https://github.com/oasislabs/oasis-client.git
    pushd oasis-client
      git checkout armani/test
      yarn
      yarn build
      ln -s $(pwd)/node_modules/client $(pwd)/../../node_modules/client
    popd
popd
