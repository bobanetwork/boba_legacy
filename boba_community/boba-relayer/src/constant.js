const { utils } = require('ethers')

const FAST_RELAYER_LIST = {
  // Mainnet
  1: ['0x1A26ef6575B7BBB864d984D9255C069F6c361a14'],
  // Goerli
  5: ['0x1F32017A84dE07A524b9C6993D35B4bF70e8Dc93'],
  // Moonbase
  1287: ['0x569a3e1A4A50D0F53BDF05d50D5FeAB3f716f5A1'],
  // Moonbeam
  1284: ['0x3fBc139f80a474c9B19A734e9ABb285b6550dF58'],
  // Fantom testnet
  4002: ['0x34024168ba3cfa608005b5E9f13389bb2532422A'],
  // Fantom mainnet
  250: ['0x0bF5402a57970C7BD9883248534B644Ab545e6d4'],
  // Avalanche testnet
  43113: ['0x30caB2fCA6260FB91B172D4AFB215514069868ea'],
  // Avalanche Mainnet
  43114: ['0x1E6D9F4dDD7C52EF8964e81E5a9a137Ee2489b21'],
  // BNB testnet
  97: ['0xed142c7BdA2A3d5b08Eae78C96b37FFe60Fecf80'],
  // BNB mainnet
  56: ['0x88b5d70be4fc644c55b164AD09A3DFD44E31eC59'],
}

const L2_CROSS_DOMAIN_MESSENGER_TOPIC = utils.id(
  'SentMessage(address,address,bytes,uint256,uint256)'
)

const L2_CROSS_DOMAIN_MESSENGER_INTERFACE = new utils.Interface([
  'function relayMessage(address, address, bytes, uint256)',
])

const STATE_COMMITMENT_CONTRACT_INTERFACE = new utils.Interface([
  'function getTotalBatches() view returns (uint256)',
  'event StateBatchAppended(uint256 indexed _batchIndex,bytes32 _batchRoot,uint256 _batchSize,uint256 _prevTotalElements,bytes _extraData)',
  'function FRAUD_PROOF_WINDOW() view returns (uint256)',
])

const DEFAULT_L2_CONTRACT_ADDRESSES = {
  OVM_L2CrossDomainMessenger: '0x4200000000000000000000000000000000000007',
}

const CUSTOM_ERROR = {
  INVALID_L2_TRANSACTION_HASH: 'INVALID_L2_TRANSACTION_HASH',
  INVALID_L2_CROSS_DOMAIN_TX: 'INVALID_L2_CROSS_DOMAIN_TX',
}

module.exports = {
  L2_CROSS_DOMAIN_MESSENGER_TOPIC,
  L2_CROSS_DOMAIN_MESSENGER_INTERFACE,
  STATE_COMMITMENT_CONTRACT_INTERFACE,
  DEFAULT_L2_CONTRACT_ADDRESSES,
  FAST_RELAYER_LIST,
  CUSTOM_ERROR,
}
