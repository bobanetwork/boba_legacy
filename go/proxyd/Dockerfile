FROM golang:1.17.2-alpine3.13 AS builder

ARG GITCOMMIT=docker
ARG GITDATE=docker
ARG GITVERSION=docker

RUN apk add make jq git

WORKDIR /app
COPY . /app

RUN make proxyd

FROM alpine:3.14.2

EXPOSE 8080
COPY --from=builder /app/bin/proxyd /bin/proxyd
VOLUME /etc/proxyd
COPY proxyd.toml /etc/proxyd/proxyd.toml
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
