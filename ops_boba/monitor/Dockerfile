FROM node:14-buster as base

FROM base as build

RUN apt-get update && apt-get install -y bash git python build-essential

WORKDIR /

COPY *.json yarn.lock ./

COPY ops_boba ./ops_boba
COPY packages/core-utils ./packages/core-utils
COPY packages/common-ts ./packages/common-ts
COPY packages/boba/contracts ./packages/boba/contracts
COPY packages/contracts ./packages/contracts
COPY packages/boba/turing ./packages/boba/turing

RUN yarn install

WORKDIR /ops_boba/monitor

ENTRYPOINT yarn start
