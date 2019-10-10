# Oasis runtime end-to-end tests

[![Build status](https://badge.buildkite.com/58730a2be16848255387f3c8fe708465d09e699794fff0fae4.svg)](https://buildkite.com/oasislabs/e2e-tests)

A set of [Truffle](https://github.com/trufflesuite/truffle)-based acceptance tests covering changes to the Ethereum runtime on the Oasis platform.

## Installing

Download the tests and install their dependencies:

```
git clone https://github.com/oasislabs/e2e-tests.git
cd e2e-tests
npm install
npm install -g lerna
npm install -g yarn
```

Follow the [instructions](https://docs.oasis.dev/quickstart.html#set-up-the-oasis-sdk) for setting up the Oasis SDK.

## Compiling

```
npm run compile:truffle
npm run compile:oasis
```

## Running tests against Devnet

To run tests against the Devnet, run

`MNEMONIC="<MNEMONIC>" npm run test:devnet [TEST_FILE_PATH]`

assigning the mnemonic associated with your Devnet wallet to the `MNEMONIC` environment variable. Optionally, one can include the path to a specific test file, e.g., `[TEST_FILE_PATH]` could be `test/0_test_builtins.js`. (Note that if you're running against the Devnet, you'll likely be rate limited since Truffle actively issues requests to the provider it's communicating with.)

## Running tests against a local network

To run tests against a local Oasis *testing* network, e.g., in C.I., first export the environment variables associated with your network. For example,

```
export HTTPS_PROVIDER_URL="http://localhost:8545"
export WS_PROVIDER_URL="ws://localhost:8555"
```

Then, similar to before, run the command

`MNEMONIC="<MNEMONIC>" npm run test:development [TEST_FILE_PATH]`,

this time specifiying your `MNEMONIC`, `development` and optionally the test file to run.

As with any Truffle project, one can add custom networks by modifying `truffle-config.js`. Note that we use a custom version of truffle so that we can work with Rust and Solidity in the same workspace. It will be downloaded when running `npm install` and located in your local `node_modules/`.

## Running tests in staging cluster

The tests can be run from inside the staging cluster in order to bypass rate limits and auto-fund via the API faucet. For example, to run `3_test_pubsub.js` with "verbose rpc" enabled, run the following commands from the `private-ops` shell:

```
root@5c00abbf9761 /workdir# use_kube_env staging/aws/us-west-2
Setting environment staging/aws/us-west-2
kops has set your kubectl context to us-west-2.staging.oasiscloud.io
(k8s: us-west-2.staging.oasiscloud.io) root@5c00abbf9761 /workdir# kubectl --namespace="$k8s_namespace" create --filename=- <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: e2e-tests-$(date +%s)
spec:
  template:
    spec:
      containers:
        - name: runner
          image: oasislabs/e2e-test-runner:latest
          args:
            - http://\$(WEB3_GATEWAY_SERVICE_HOST):\$(WEB3_GATEWAY_SERVICE_PORT_WEB3)
            - ws://\$(WEB3_GATEWAY_WEBSOCKET_SERVICE_HOST):\$(WEB3_GATEWAY_WEBSOCKET_SERVICE_PORT_WEB3_WEBSOCKET)
            - http://faucet-internal.us-west-2.staging.oasiscloud-private.io
            - test/3_test_pubsub.js
            - --
            - --verbose-rpc
      imagePullSecrets:
        - name: docker-registry-creds
      restartPolicy: Never
EOF
```

The output should be something like:
```
job.batch/e2e-tests-1554141983 created
```

To clean up the job after it finishes (or hangs):
```
(k8s: us-west-2.staging.oasiscloud.io) root@5c00abbf9761 /workdir# kubectl delete job/e2e-tests-1554141983
job.batch "e2e-tests-1554141983" deleted
```

To instead get a shell directly into the testing image, run
```
kubectl run -i -t any-name-you-want --restart=Never --rm=true \
  --image=oasislabs/e2e-test-runner:latest \
  --overrides='{ "apiVersion": "v1", "spec": { "imagePullSecrets": [{"name": "docker-registry-creds"}] } }' --command=true /bin/bash
```
