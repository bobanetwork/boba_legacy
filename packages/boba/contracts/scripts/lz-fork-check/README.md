# LayerZero V1 ULNv301 fix: owner runbook

LayerZero moved the Endpoint v1 default library to ULNv301 on 2026-08-04; empty `adapterParams`
now revert (`LZ_ULN_InvalidWorkerOptions`). The deployed bridges already have
`setUseCustomAdapterParams(bool,uint256)`, so **no contract upgrade is needed**, only an owner tx
(plus clients sending `0x0001 + gasLimit`).

| Bridge | Address | Owner | Tx |
| --- | --- | --- | --- |
| Ethereum `Proxy__EthBridgeToBNB` | `0x1A36E24D61BC1aDa68C21C2Da1aD53EaB8E03e55` | `0x1f2414d0af8741bc822dbc2f88069c2b2907a840` | calldata below |
| BNB `Proxy__BNBBridgeToEth` | `0x819FF4d9215C9dAC76f5eC676b1355973157eBBa` | `0xE1B5383666E5B6ea684b98371d6aBCCdb8f4E4d9` | same calldata |

Calldata (`setUseCustomAdapterParams(true, 200000)`):

    0x7e0ced0900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000030d40

Verified via `eth_call` from each owner: the setter succeeds on both chains. Note the 1-arg
`setUseCustomAdapterParams(bool)` does not exist; use the 2-arg form.

Client side after the tx: `adapterParams = ethers.utils.solidityPack(['uint16','uint256'],[1, 200000])`
for both `estimateFees` and `depositERC20(To)` / `withdraw*`. Gas must be >= the min set (200000).
Call `estimateFees` with the same params (fee changes).

Check (mainnet fork, ETH -> BNB): `ETH_RPC_URL=... ./eth-bridge-adapter-params.sh`

Known follow-up (not fixed here, needs an AltL1Bridge upgrade): the failed-deposit refund path in
`AltL1Bridge._finalizeDeposit` calls `_lzSend(..., bytes(""))`, which will revert under ULNv301.
Also: any route still on ULNv2 must move to ULNv301 before the 2026-12-15 relayer shutdown.
