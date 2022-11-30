import { ETHERSCAN_API_KEY, INFURA_ID } from "util/constant";

export const moonbaseConfig = {
  Mainnet: {
    OMGX_WATCHER_URL: `https://api-watcher.mainnet.boba.network/`,
    VERIFIER_WATCHER_URL: `https://api-verifier.mainnet.boba.network/`,
    MM_Label: `Mainnet`,
    addressManager: `0x8376ac6C3f73a25Dd994E0b0669ca7ee0C02F089`,
    L1: {
      name: "Mainnet",
      chainId: 1,
      chainIdHex: '0x1',
      rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
      blockExplorer: `https://api.etherscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`,
      transaction: ` https://etherscan.io/tx/`,
    },
    L2: {
      name: "BOBA L2",
      chainId: 288,
      chainIdHex: '0x120',
      rpcUrl: `https://mainnet.boba.network`,
      blockExplorer: `https://bobascan.com/`,
      transaction: `https://bobascan.com/tx/`,
    },
    payloadForL1SecurityFee: {
      from: '0x5E7a06025892d8Eef0b5fa263fA0d4d2E5C3B549',
      to: '0x17C83E2B96ACfb5190d63F5E46d93c107eC0b514',
      value: '0x38d7ea4c68000',
      data:
        '0x7ff36ab5000000000000000000000000000000000000000000000000132cc41aecbfbace00000000000000000000000000000000000000000000000000000000000000800000000000000000000000005e7a06025892d8eef0b5fa263fa0d4d2e5c3b54900000000000000000000000000000000000000000000000000000001c73d14500000000000000000000000000000000000000000000000000000000000000002000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00000000000000000000000000005008f837883ea9a07271a1b5eb0658404f5a9610',
    },
    payloadForFastDepositBatchCost: {
      from: '0x5E7a06025892d8Eef0b5fa263fA0d4d2E5C3B549',
      to: '0x1A26ef6575B7BBB864d984D9255C069F6c361a14',
      value: '0x038d7ea4c68000',
      data:
        '0xa44c80e30000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000042bbfa2e77757c645eeaad1655e0911a7553efbc0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038d7ea4c68000'
    },
    gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`
  }
}
