FROM node:10

ARG TESTRUNNER_COMMIT_SHA

LABEL com.oasislabs.testrunner-commit-sha="${TESTRUNNER_COMMIT_SHA}"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Unzip prebuilt contracts.
RUN unzip build.zip -d . && rm build.zip

ENTRYPOINT [ "scripts/runner.sh" ]
