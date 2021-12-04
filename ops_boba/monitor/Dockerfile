FROM node:14-buster as base

FROM base as build

RUN apt-get update && apt-get install -y bash git python build-essential

WORKDIR /

COPY "package.json" ./

COPY ops_boba ./ops_boba
COPY packages/core-utils ./packages/core-utils

RUN cd packages/core-utils && yarn install
RUN cd ops_boba/monitor/ && yarn install

WORKDIR /ops_boba/monitor

ENTRYPOINT yarn start
