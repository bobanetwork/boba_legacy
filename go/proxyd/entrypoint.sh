#!/bin/sh
echo "Replacing MAIN_L2GETH with $MAIN_L2GETH"
sed -i "s#MAIN_GETH#$MAIN_L2GETH#g" /etc/proxyd/proxyd.toml
echo "Replacing REPLICA_L2GETH with $REPLICA_L2GETH"
sed -i "s#REPLICA_L2GETH#$REPLICA_L2GETH#g" /etc/proxyd/proxyd.toml
echo "Replacing ELASTICACHE with $ELASTICACHE"
sed -i "s#ELASTICACHE#$ELASTICACHE#g" /etc/proxyd/proxyd.toml
echo "Starting RPC Proxy"
/bin/proxyd /etc/proxyd/proxyd.toml
