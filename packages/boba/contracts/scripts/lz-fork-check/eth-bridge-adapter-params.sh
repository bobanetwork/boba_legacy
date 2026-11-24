#!/usr/bin/env bash
# Mainnet-fork check for the LayerZero ULNv301 (Aug 4 2026) empty-adapterParams revert on
# Proxy__EthBridgeToBNB. Proves: (A) empty adapterParams revert, (B) after the owner calls
# setUseCustomAdapterParams(true, 200000), a deposit with 0x0001+gas succeeds.
# Requires foundry (anvil, cast). Usage: ETH_RPC_URL=<mainnet rpc> ./eth-bridge-adapter-params.sh
set -euo pipefail
RPC=${ETH_RPC_URL:?set ETH_RPC_URL}
P=0x1A36E24D61BC1aDa68C21C2Da1aD53EaB8E03e55   # Proxy__EthBridgeToBNB
BOBA=0x42bBFa2e77757C645eeaAd1655E0911a7553Efbc
EP=0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675  # LZ v1 endpoint (Ethereum)
DST=102; GAS=200000; AMT=1000000000000000000
ZERO=0x0000000000000000000000000000000000000000
U=0x00000000000000000000000000000000000dEaD1
L=http://127.0.0.1:8599
O=$(cast call $P "owner()(address)" --rpc-url "$RPC")
BNB=$(cast call $P "tokenPairs(address)(address)" $BOBA --rpc-url "$RPC")
anvil --fork-url "$RPC" --port 8599 --silent & APID=$!; trap 'kill $APID' EXIT; sleep 8
imp(){ cast rpc anvil_impersonateAccount "$1" --rpc-url $L >/dev/null; cast rpc anvil_setBalance "$1" 0x56BC75E2D63100000 --rpc-url $L >/dev/null; }
imp $U; imp $P; imp "$O"
cast send $BOBA "transfer(address,uint256)" $U 1000000000000000000000 --from $P --unlocked --rpc-url $L >/dev/null
cast send $BOBA "approve(address,uint256)" $P 1000000000000000000000 --from $U --unlocked --rpc-url $L >/dev/null
dep(){ cast send $P "depositERC20(address,address,uint256,address,bytes,bytes)" $BOBA "$BNB" $AMT $ZERO "$1" 0x --value 0.05ether --from $U --unlocked --rpc-url $L 2>&1; }

echo "A) empty adapterParams must revert with LZ_ULN_InvalidWorkerOptions"
OUT=$(dep 0x || true); echo "$OUT" | grep -q InvalidWorkerOptions && echo "  PASS (reverts as expected)" || { echo "  FAIL: $OUT"; exit 1; }

echo "B) owner enables custom params, deposit with 0x0001+gas must succeed"
cast send $P "setUseCustomAdapterParams(bool,uint256)" true $GAS --from "$O" --unlocked --rpc-url $L >/dev/null
AP=$(cast abi-encode --packed "f(uint16,uint256)" 1 $GAS)
OUT=$(dep "$AP" || true); echo "$OUT" | grep -q "status *1" && echo "  PASS (deposit succeeded, adapterParams=$AP)" || { echo "  FAIL: $OUT"; exit 1; }

echo "C) too-low gas must still be rejected by the bridge"
LOW=$(cast abi-encode --packed "f(uint16,uint256)" 1 1000)
OUT=$(dep "$LOW" || true); echo "$OUT" | grep -q "gas limit is too low" && echo "  PASS" || { echo "  FAIL: $OUT"; exit 1; }
