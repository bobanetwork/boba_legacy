FROM node:14-buster as base

FROM base as build

#RUN apt-get update && apt-get install -y bash git python build-essential

WORKDIR /app

COPY "package.json" ./
RUN yarn install --production

COPY . .

ENTRYPOINT yarn start
