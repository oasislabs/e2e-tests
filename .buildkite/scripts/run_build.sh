#!/bin/bash

################################################################################
# First set up our environment so that we can build.
################################################################################

set -euxo pipefail

# Required args.
out_dir=$1

# Setup the environment so that we can use npm.
export PS1="set PS1 to anything so that we can source .bashrc"
set +ux
. ~/.bashrc
set -ux

# Update the PATH to respect $CARGO_INSTALL_ROOT.
# This allows 'cargo install' to reuse binaries
# from previous installs as long as the correct
# host directory is mounted on the docker container.
# Huge speed improvements during local dev and testing.
set +u
export PATH=$CARGO_INSTALL_ROOT/bin/:$PATH
set -u

################################################################################
# Now we can start the build.
################################################################################

# Install the latest oasis-bulid deps.
cargo install --git https://github.com/oasislabs/oasis-cli.git oasis-cli
cargo install --git https://github.com/oasislabs/oasis-rs.git oasis-build
# So we can skip the oasis-cli startup prompts.
mkdir -p ~/.config/oasis/
touch ~/.config/oasis/config.toml

apt-get update -qq
apt-get install -qq --assume-yes nodejs npm zip

# Install e2e-test dependencies.
npm install

# Lint Check.
npm run lint

# Compile the contracts.
npm run compile:truffle
npm run compile:oasis

# Finally move the build to the out directory.
zip -r build.zip build
mkdir -p $out_dir
mv build.zip $out_dir

zip -r services.zip services
mv services.zip $out_dir
