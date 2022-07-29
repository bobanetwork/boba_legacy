#!/bin/bash
set -e

DATADIR=/home/boba/datadir

RPC_FLAGS=" \
  --datadir /home/boba/datadir \
  --http.port 8545 \
  --http.addr 0.0.0.0 \
  --http.vhosts "l1_chain,localhost" \
  --http.corsdomain "*" \
  --http.api "eth,debug,net,erigon,web3" \
  --verbosity 4 \
"

ERIGON_FLAGS=" \
  --chain dev \
  --datadir /home/boba/datadir \
  --mine \
  --miner.etherbase=0x123463a4B065722E99115D6c222f267d9cABb524 \
  --miner.sigfile /home/boba/datadir/nodekey \
  --http.port 8888 \
  --private.api.addr=0.0.0.0:9090 \
  --allow-insecure-unlock \
  --metrics \
  --metrics.addr=0.0.0.0 \
  --metrics.port=6060 \
  --pprof \
  --pprof.addr=0.0.0.0 \
  --pprof.port=6061 \
  --verbosity 4 \
  "

if [ ! -f ${DATADIR}/l1_genesis.json ] ; then
  echo "Creating genesis file"
  echo
  cat > ${DATADIR}/l1_genesis.json <<END
{
  "config": {
    "ChainName": "l1_chain",
    "chainId": $CHAIN_ID,
    "consensus": "clique",
    "homesteadBlock": 0,
    "daoForkSupport": true,
    "eip150Block": 0,
    "eip150Hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "eip155Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "terminalBlockHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "muirGlacierBlock": 0,
    "arrowGlacierBlock": 0,
    "grayGlacierBlock": 0,
    "clique": {
      "period": ${BLOCK_INTERVAL},
      "epoch": 30000
    }
  },
  "difficulty": "1",
  "gasLimit": "30000000",
  "extradata": "0x0000000000000000000000000000000000000000000000000000000000000000123463a4B065722E99115D6c222f267d9cABb5240000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "alloc": {
    "0x123463a4B065722E99115D6c222f267d9cABb524": { "balance": "20000000000000000000000" },
    "0x5678E9E827B3be0E3d4b910126a64a697a148267": { "balance": "20000000000000000000000" },
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": { "balance": "10000000000000000000000" },
    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": { "balance": "10000000000000000000000" },
    "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": { "balance": "10000000000000000000000" },
    "0x90f79bf6eb2c4f870365e785982e1f101e93b906": { "balance": "10000000000000000000000" },
    "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65": { "balance": "10000000000000000000000" },
    "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc": { "balance": "10000000000000000000000" },
    "0x976ea74026e726554db657fa54763abd0c3a0aa9": { "balance": "10000000000000000000000" },
    "0x14dc79964da2c08b23698b3d3cc7ca32193d9955": { "balance": "10000000000000000000000" },
    "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f": { "balance": "10000000000000000000000" },
    "0xa0ee7a142d267c1f36714e4a8f75612f20a79720": { "balance": "10000000000000000000000" },
    "0xbcd4042de499d14e55001ccbb24a551f3b954096": { "balance": "10000000000000000000000" },
    "0x71be63f3384f5fb98995898a86b02fb2426c5788": { "balance": "10000000000000000000000" },
    "0xfabb0ac9d68b0b445fb7357272ff202c5651694a": { "balance": "10000000000000000000000" },
    "0x1cbd3b2770909d4e10f157cabc84c7264073c9ec": { "balance": "10000000000000000000000" },
    "0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097": { "balance": "10000000000000000000000" },
    "0xcd3b766ccdd6ae721141f452c550ca635964ce71": { "balance": "10000000000000000000000" },
    "0x2546bcd3c84621e976d8185a91a922ae77ecec30": { "balance": "10000000000000000000000" },
    "0xbda5747bfd65f08deb54cb465eb87d40e51b197e": { "balance": "10000000000000000000000" },
    "0xdd2fd4581271e230360230f9337d5c0430bf44c0": { "balance": "10000000000000000000000" },
    "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199": { "balance": "10000000000000000000000" }
  }
}
END
  erigon ${ERIGON_FLAGS} init ${DATADIR}/l1_genesis.json

  echo "Creating keyfile"
  echo "2e0834786285daccd064ca17f1654f67b4aef298acbb82cef9ec422fb4975622" > ${DATADIR}/nodekey

  echo "Init completed"
  echo
fi

erigon ${ERIGON_FLAGS} &
sleep 5
rpcdaemon ${RPC_FLAGS}

  

 
