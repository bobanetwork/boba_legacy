#!/bin/sh

DATABASE_NAME='blockscout'
DATABASE_USER=`/opt/secret2env -name $SECRETNAME|grep -w postgres_user|sed 's/postgres_user=//g'`
DATABASE_PASS=`/opt/secret2env -name $SECRETNAME|grep -w postgres_pass|sed 's/postgres_pass=//g'`
DATABASE_HOST=`/opt/secret2env -name $SECRETNAME|grep -w postgres_host|sed 's/postgres_host=//g'`
export DATABASE_URL="postgresql://${DATABASE_USER}:${DATABASE_PASS}@${DATABASE_HOST}:5432/${DATABASE_NAME}?ssl=false"
printenv
mix do ecto.create, ecto.migrate
mix phx.server