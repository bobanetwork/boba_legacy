import { ethers } from 'ethers'
import dotenv from 'dotenv'
import * as fs from 'fs'
import { getContractFactory } from '@eth-optimism/contracts'
import chalk from 'chalk'

dotenv.config()

const env = process.env
const L1_NODE_WEB3_URL = env.L1_NODE_WEB3_URL
const L2_NODE_WEB3_URL = env.L2_NODE_WEB3_URL

const L1Web3 = new ethers.providers.JsonRpcProvider(L1_NODE_WEB3_URL)
const L2Web3 = new ethers.providers.JsonRpcProvider(L2_NODE_WEB3_URL)

const Lib_AddressManagerAddress = env.ADDRESS_MANAGER_ADDRESS
const L2CrossDomainMessengerAdress =
  '0x4200000000000000000000000000000000000007'
const L2StandardBridge = '0x4200000000000000000000000000000000000010'
const blankAddress = '0x0000000000000000000000000000000000000000'

;(async () => {
  const Lib_AddressManager = getContractFactory('Lib_AddressManager')
    .attach(Lib_AddressManagerAddress)
    .connect(L1Web3)

  console.log(`🔗 ${chalk.grey(`Verifying registered addresses`)}`)
  const registeredL2CrossDomainMessenger = await Lib_AddressManager.getAddress(
    'L2CrossDomainMessenger'
  )
  if (registeredL2CrossDomainMessenger === L2CrossDomainMessengerAdress) {
    console.log(
      `⭐️ ${chalk.green(`L2CrossDomainMessenger was successfully registered`)}`
    )
  } else {
    console.log(
      `💊 ${chalk.red(
        `L2CrossDomainMessenger is wrong - ${registeredL2CrossDomainMessenger}`
      )}`
    )
  }

  const registeredOVM_Sequencer = await Lib_AddressManager.getAddress(
    'OVM_Sequencer'
  )
  if (registeredOVM_Sequencer !== blankAddress) {
    console.log(
      `⭐️ ${chalk.green(`OVM_Sequencer was successfully registered`)}`
    )
  } else {
    console.log(
      `💊 ${chalk.red(`OVM_Sequencer is wrong - ${registeredOVM_Sequencer}`)}`
    )
  }

  const registeredOVM_Proposer = await Lib_AddressManager.getAddress(
    'OVM_Proposer'
  )
  if (registeredOVM_Proposer !== blankAddress) {
    console.log(
      `⭐️ ${chalk.green(`OVM_Proposer was successfully registered`)}`
    )
  } else {
    console.log(
      `💊 ${chalk.red(`OVM_Proposer is wrong - ${registeredOVM_Proposer}`)}`
    )
  }

  const registeredL2BatchMessageRelayer = await Lib_AddressManager.getAddress(
    'L2BatchMessageRelayer'
  )
  if (registeredL2BatchMessageRelayer !== blankAddress) {
    console.log(
      `⭐️ ${chalk.green(`L2BatchMessageRelayer was successfully registered`)}`
    )
  } else {
    console.log(
      `💊 ${chalk.red(
        `L2BatchMessageRelayer is wrong - ${registeredL2BatchMessageRelayer}`
      )}`
    )
  }

  const registeredL2BatcFastMessageRelayer =
    await Lib_AddressManager.getAddress('L2BatchFastMessageRelayer')
  if (registeredL2BatcFastMessageRelayer !== blankAddress) {
    console.log(
      `⭐️ ${chalk.green(
        `L2BatchFastMessageRelayer was successfully registered`
      )}`
    )
  } else {
    console.log(
      `💊 ${chalk.red(
        `L2BatchFastMessageRelayer is wrong - ${registeredL2BatcFastMessageRelayer}`
      )}`
    )
  }

  console.log(`🔗 ${chalk.grey(`Verifying ChainStorageContainer-CTC-batches`)}`)
  const CTCBatchAddress = await Lib_AddressManager.getAddress(
    'ChainStorageContainer-CTC-batches'
  )
  const CTCBatchStorage = getContractFactory('ChainStorageContainer')
    .attach(CTCBatchAddress)
    .connect(L1Web3)
  const CTCBatchStorageOwner = await CTCBatchStorage.owner()
  const CTCBatchStorageLibAddressManager =
    await CTCBatchStorage.libAddressManager()
  if (
    CTCBatchStorageOwner === 'CanonicalTransactionChain' &&
    CTCBatchStorageLibAddressManager === Lib_AddressManagerAddress
  ) {
    console.log(
      `⭐️ ${chalk.green(`ChainStorageContainer-CTC-batches was verified`)}`
    )
  } else {
    console.log(
      `💊 ${chalk.red(
        `ChainStorageContainer-CTC-batches was failed - CTCBatchStorageOwner: ${CTCBatchStorageOwner} CTCBatchStorageLibAddressManager: ${CTCBatchStorageLibAddressManager}`
      )}`
    )
  }

  console.log(`🔗 ${chalk.grey(`Verifying ChainStorageContainer-CTC-queue`)}`)
  const CTCQueueAddress = await Lib_AddressManager.getAddress(
    'ChainStorageContainer-CTC-queue'
  )
  const CTCQueueStorage = getContractFactory('ChainStorageContainer')
    .attach(CTCQueueAddress)
    .connect(L1Web3)
  const CTCQueueStorageOwner = await CTCQueueStorage.owner()
  const CTCQueueStorageLibAddressManager =
    await CTCQueueStorage.libAddressManager()
  if (
    CTCQueueStorageOwner === 'CanonicalTransactionChain' &&
    CTCQueueStorageLibAddressManager === Lib_AddressManagerAddress
  ) {
    console.log(
      `⭐️ ${chalk.green(`ChainStorageContainer-CTC-queue was verified`)}`
    )
  } else {
    console.log(
      `💊 ${chalk.red(
        `ChainStorageContainer-CTC-queue was failed - CTCQueueStorageOwner: ${CTCQueueStorageOwner} CTCQueueStorageLibAddressManager: ${CTCQueueStorageLibAddressManager}`
      )}`
    )
  }

  console.log(`🔗 ${chalk.grey(`Verifying ChainStorageContainer-SCC-batches`)}`)
  const SCCBatchAddress = await Lib_AddressManager.getAddress(
    'ChainStorageContainer-SCC-batches'
  )
  const SCCBatchStorage = getContractFactory('ChainStorageContainer')
    .attach(SCCBatchAddress)
    .connect(L1Web3)
  const SCCBatchStorageOwner = await SCCBatchStorage.owner()
  const SCCBatchStorageLibAddressManager =
    await SCCBatchStorage.libAddressManager()
  if (
    SCCBatchStorageOwner === 'StateCommitmentChain' &&
    SCCBatchStorageLibAddressManager === Lib_AddressManagerAddress
  ) {
    console.log(
      `⭐️ ${chalk.green(`ChainStorageContainer-SCC-batches was verified`)}`
    )
  } else {
    console.log(
      `💊 ${chalk.red(
        `ChainStorageContainer-SCC-batches was failed - SCCBatchStorageOwner: ${SCCBatchStorageOwner} SCCBatchStorageLibAddressManager: ${SCCBatchStorageLibAddressManager}`
      )}`
    )
  }

  console.log(`🔗 ${chalk.grey(`Verifying CanonicalTransactionChain`)}`)
  const CTCAddress = await Lib_AddressManager.getAddress(
    'CanonicalTransactionChain'
  )
  const CTCContract = getContractFactory('CanonicalTransactionChain')
    .attach(CTCAddress)
    .connect(L1Web3)
  const CTCLibAddressManager = await CTCContract.libAddressManager()
  if (CTCLibAddressManager === Lib_AddressManagerAddress) {
    console.log(`⭐️ ${chalk.green(`CanonicalTransactionChain was verified`)}`)
  } else {
    console.log(
      `💊 ${chalk.red(
        `CanonicalTransactionChain was failed - CTCLibAddressManager: ${CTCLibAddressManager}`
      )}`
    )
  }

  console.log(`🔗 ${chalk.grey(`Verifying StateCommitmentChain`)}`)
  const SCCAddress = await Lib_AddressManager.getAddress('StateCommitmentChain')
  const SCCContract = getContractFactory('StateCommitmentChain')
    .attach(SCCAddress)
    .connect(L1Web3)
  const SCCLibAddressManager = await SCCContract.libAddressManager()
  if (SCCLibAddressManager === Lib_AddressManagerAddress) {
    console.log(`⭐️ ${chalk.green(`StateCommitmentChain was verified`)}`)
  } else {
    console.log(
      `💊 ${chalk.red(
        `StateCommitmentChain was failed - SCCLibAddressManager: ${SCCLibAddressManager}`
      )}`
    )
  }
  const FRAUD_PROOF_WINDOW = await SCCContract.FRAUD_PROOF_WINDOW()
  const SEQUENCER_PUBLISH_WINDOW = await SCCContract.SEQUENCER_PUBLISH_WINDOW()
  console.log(`🔑 ${chalk.blue(`FRAUD_PROOF_WINDOW is ${FRAUD_PROOF_WINDOW}`)}`)
  console.log(
    `🔑 ${chalk.blue(
      `SEQUENCER_PUBLISH_WINDOW is ${SEQUENCER_PUBLISH_WINDOW}`
    )}`
  )

  console.log(`🔗 ${chalk.grey(`Verifying BondManager`)}`)
  const BondManagerAddress = await Lib_AddressManager.getAddress('BondManager')
  const BondManagerContract = getContractFactory('BondManager')
    .attach(BondManagerAddress)
    .connect(L1Web3)
  const BondManagerLibAddressManager =
    await BondManagerContract.libAddressManager()
  if (BondManagerLibAddressManager === Lib_AddressManagerAddress) {
    console.log(`⭐️ ${chalk.green(`BondManager was verified`)}`)
  } else {
    console.log(
      `💊 ${chalk.red(
        `BondManager was failed - BondManagerLibAddressManager: ${BondManagerLibAddressManager}`
      )}`
    )
  }

  console.log(`🔗 ${chalk.grey(`Verifying L1CrossDomainMessenger`)}`)
  const L1CrossDomainMessengerAddress = await Lib_AddressManager.getAddress(
    'L1CrossDomainMessenger'
  )
  const L1CrossDomainMessengerContract = getContractFactory(
    'L1CrossDomainMessenger'
  )
    .attach(L1CrossDomainMessengerAddress)
    .connect(L1Web3)
  const L1CrossDomainMessengerLibAddressManager =
    await L1CrossDomainMessengerContract.libAddressManager()
  if (L1CrossDomainMessengerLibAddressManager === Lib_AddressManagerAddress) {
    console.log(`⭐️ ${chalk.green(`L1CrossDomainMessenger was verified`)}`)
  } else {
    console.log(
      `💊 ${chalk.red(
        `L1CrossDomainMessenger was failed - L1CrossDomainMessengerLibAddressManager: ${L1CrossDomainMessengerLibAddressManager}`
      )}`
    )
  }

  console.log(`🔗 ${chalk.grey(`Verifying Proxy__L1CrossDomainMessenger`)}`)
  const Proxy__L1CrossDomainMessengerAddress =
    await Lib_AddressManager.getAddress('Proxy__L1CrossDomainMessenger')
  const Proxy__L1CrossDomainMessengerContract = getContractFactory(
    'L1CrossDomainMessenger'
  )
    .attach(Proxy__L1CrossDomainMessengerAddress)
    .connect(L1Web3)

  const Proxy__L1CrossDomainMessengerLibAddressManager =
    await Proxy__L1CrossDomainMessengerContract.libAddressManager()
  if (
    Proxy__L1CrossDomainMessengerLibAddressManager === Lib_AddressManagerAddress
  ) {
    console.log(
      `⭐️ ${chalk.green(`Proxy__L1CrossDomainMessenger was verified`)}`
    )
  } else {
    console.log(`💊 ${chalk.red(`Proxy__L1CrossDomainMessenger was failed`)}`)
  }

  console.log(`🔗 ${chalk.grey(`Verifying Proxy__L1StandardBridge`)}`)
  const Proxy__L1StandardBridgeAddress = await Lib_AddressManager.getAddress(
    'Proxy__L1StandardBridge'
  )
  const Proxy__L1StandardBridgeContract = getContractFactory('L1StandardBridge')
    .attach(Proxy__L1StandardBridgeAddress)
    .connect(L1Web3)

  const Proxy__L1StandardBridgeMessenger =
    await Proxy__L1StandardBridgeContract.messenger()
  const Proxy__L1StandardBridgeL2TokenBridge =
    await Proxy__L1StandardBridgeContract.l2TokenBridge()
  if (
    Proxy__L1StandardBridgeMessenger === Proxy__L1CrossDomainMessengerAddress &&
    Proxy__L1StandardBridgeL2TokenBridge === L2StandardBridge
  ) {
    console.log(`⭐️ ${chalk.green(`Proxy__L1StandardBridge was verified`)}`)
  } else {
    console.log(`💊 ${chalk.red(`Proxy__L1StandardBridge was failed`)}`)
  }

  if (registeredL2BatchMessageRelayer !== blankAddress) {
    console.log(`🔗 ${chalk.grey(`Verifying L1MultiMessageRelayer`)}`)
    const L1MultiMessageRelayerAddress = await Lib_AddressManager.getAddress(
      'L1MultiMessageRelayer'
    )
    const L1MultiMessageRelayerContract = getContractFactory(
      'L1MultiMessageRelayer'
    )
      .attach(L1MultiMessageRelayerAddress)
      .connect(L1Web3)

    const L1MultiMessageRelayerLibAddressManager =
      await L1MultiMessageRelayerContract.libAddressManager()
    if (L1MultiMessageRelayerLibAddressManager === Lib_AddressManagerAddress) {
      console.log(`⭐️ ${chalk.green(`L1MultiMessageRelayer was verified`)}`)
    } else {
      console.log(
        `💊 ${chalk.red(
          `L1MultiMessageRelayer was failed - L1MultiMessageRelayerLibAddressManager: ${L1MultiMessageRelayerLibAddressManager}`
        )}`
      )
    }
  } else {
    console.log(
      `💊 ${chalk.red(
        `PLEASE DEPLOY L1MultiMessageRelayer AND REGISTER L2BatchMessageRelayer!`
      )}`
    )
  }

  if (registeredL2BatchMessageRelayer !== blankAddress) {
    console.log(`🔗 ${chalk.grey(`Verifying L1MultiMessageRelayerFast`)}`)
    const L1MultiMessageRelayerFastAddress =
      await Lib_AddressManager.getAddress('L1MultiMessageRelayerFast')
    const L1MultiMessageRelayerFastContract = getContractFactory(
      'L1MultiMessageRelayer'
    )
      .attach(L1MultiMessageRelayerFastAddress)
      .connect(L1Web3)

    const L1MultiMessageRelayerFastLibAddressManager =
      await L1MultiMessageRelayerFastContract.libAddressManager()
    if (
      L1MultiMessageRelayerFastLibAddressManager === Lib_AddressManagerAddress
    ) {
      console.log(
        `⭐️ ${chalk.green(`L1MultiMessageRelayerFast was verified`)}`
      )
    } else {
      console.log(
        `💊 ${chalk.red(
          `L1MultiMessageRelayerFast was failed - L1MultiMessageRelayerFastLibAddressManager: ${L1MultiMessageRelayerFastLibAddressManager}`
        )}`
      )
    }
  } else {
    console.log(
      `💊 ${chalk.red(
        `PLEASE DEPLOY L1MultiMessageRelayerFast AND REGISTER L2BatchFastMessageRelayer!`
      )}`
    )
  }

  const Proxy__L1CrossDomainMessengerFastAddress =
    await Lib_AddressManager.getAddress('Proxy__L1CrossDomainMessengerFast')
  const L1CrossDomainMessengerFastAddress = await Lib_AddressManager.getAddress(
    'L1CrossDomainMessengerFast'
  )
  if (
    L1CrossDomainMessengerFastAddress === blankAddress ||
    Proxy__L1CrossDomainMessengerFastAddress === blankAddress
  ) {
    console.log(
      `💊 ${chalk.red(
        `PLEASE DEPLOY Proxy__L1CrossDomainMessengerFast AND L1CrossDomainMessengerFast!`
      )}`
    )
  } else {
    const Proxy__L1CrossDomainMessengerFastContract = getContractFactory(
      'L1CrossDomainMessenger'
    )
      .attach(Proxy__L1CrossDomainMessengerFastAddress)
      .connect(L1Web3)

    const Proxy__L1CrossDomainMessengerFastLibAddressManager =
      await Proxy__L1CrossDomainMessengerFastContract.libAddressManager()
    if (
      Proxy__L1CrossDomainMessengerFastLibAddressManager ===
      Lib_AddressManagerAddress
    ) {
      console.log(
        `⭐️ ${chalk.green(`Proxy__L1CrossDomainMessengerFast was verified`)}`
      )
    } else {
      console.log(
        `💊 ${chalk.red(`Proxy__L1CrossDomainMessengerFast was failed`)}`
      )
    }
  }
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
