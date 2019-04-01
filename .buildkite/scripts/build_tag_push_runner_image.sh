#! /bin/bash

# Helpful tips on writing build scripts:
# https://buildkite.com/docs/pipelines/writing-build-scripts
set -euxo pipefail

build_image_tag=$(git rev-parse HEAD)

docker build --rm --force-rm -t oasislabs/e2e-test-runner:"${build_image_tag}" --build-arg TESTRUNNER_COMMIT_SHA="${build_image_tag}" -f ./docker/test-runner/Dockerfile .

docker tag oasislabs/e2e-test-runner:"${build_image_tag}" oasislabs/e2e-test-runner:latest

docker push oasislabs/e2e-test-runner:"${build_image_tag}"
docker push oasislabs/e2e-test-runner:latest
