import omgxWatcherAxiosInstance from 'api/omgxWatcherAxios'
import networkService from './networkService'
import {AllNetworkConfigs, CHAIN_ID_LIST, getRpcUrlByChainId} from 'util/network/network.util'
import {TRANSACTION_STATUS} from "../containers/history/types";
import {teleportationGraphQLService} from "./graphql.service";
import {ethers, providers} from "ethers";
import {isDevBuild} from "../util/constant";

class TransactionService {
  async getSevens(networkConfig = networkService.networkConfig) {
    const response = await omgxWatcherAxiosInstance(
      networkConfig
    ).get('get.l2.pendingexits')

    if (response.status === 201) {
      const data = response.data
      const filtered = data.filter(
        (i) => i.fastRelay === 0 && i.status === 'pending'
      )
      return filtered
    } else {
      return []
    }

  }

  async getFastExits(networkConfig = networkService.networkConfig) {
    const response = await omgxWatcherAxiosInstance(
      networkConfig
    ).get('get.l2.pendingexits')

    if (response.status === 201) {
      const data = response.data
      const filtered = data.filter(
        (i) => i.fastRelay === 1 && i.status === 'pending'
      )
      return filtered
    } else {
      return []
    }
  }

  // fetch L2 transactions from omgxWatcherAxiosInstance
  async fetchL2Tx(networkConfig = networkService.networkConfig) {
    let L2Txs = []
    try {
      const responseL2 = await omgxWatcherAxiosInstance(
        networkConfig
      )
        .post('get.l2.transactions', {
          address: networkService.account,
          fromRange: 0,
          toRange: 1000,
        })
        .catch((error) => {
          console.log('get l2 tx', error)
        })

      if (responseL2.status === 201) {
        L2Txs = responseL2.data.map((v) => ({
          ...v, layer: 'L2', chainName: networkConfig.L2.name,
          originChainId: networkConfig.L2.chainId,
          destinationChainId: networkConfig.L1.chainId
        }))
      }
      return L2Txs
    } catch (error) {
      console.log('TS: fetchL2Tx', error)
      return L2Txs
    }
  }

  // fetch L0 transactions from omgxWatcherAxiosInstance
  async fetchL0Tx(networkConfig = networkService.networkConfig) {
    let L0Txs = []
    try {
      const responseL0 = await omgxWatcherAxiosInstance(
        networkConfig
      ).post('get.layerzero.transactions', {
        address: networkService.account,
        fromRange: 0,
        toRange: 1000,
      })

      if (responseL0.status === 201) {
        L0Txs = responseL0.data.map((v) => ({
          ...v,
          hash: v.tx_hash,
          blockNumber: parseInt(v.block_number),
          timeStamp: parseInt(v.timestamp), //fix bug - sometimes this is string, sometimes an integer
          layer: 'L0',
          chainName: networkConfig.L1.name,
          originChainId: networkConfig.L1.chainId,
          altL1: true,
        }))
      }
      return L0Txs
    } catch (error) {
      console.log('TS: fetchL0Tx', error)
      return L0Txs
    }
  }

  // fetch L1 pending transactions from omgxWatcherAxiosInstance
  async fetchL1PendingTx(networkConfig = networkService.networkConfig) {
    let txL1pending = []
    try {
      const responseL1pending = await omgxWatcherAxiosInstance(
        networkConfig
      ).post('get.l1.transactions', {
        address: networkService.account,
        fromRange: 0,
        toRange: 1000,
      })

      if (responseL1pending.status === 201) {
        //add the chain: 'L1pending' field and chainName:  field
        txL1pending = responseL1pending.data.map((v) => ({
          ...v,
          layer: 'L1pending',
          chainName: networkConfig.L1.name,
          originChainId: networkConfig.L1.chainId,
          destinationChainId: networkConfig.L2.chainId
        }))
      }
      return txL1pending
    } catch (error) {
      console.log('TS: fetchL1PendingTx', error)
      return txL1pending
    }
  }

  /**
   * @getTransactions
   *   - loads L1Txs, l2Txs, l0Txs, L1PendingTxs
   *
   */
  async getTransactions(networkConfig = networkService.networkConfig) {
    const networksArray = Array.from(Object.values(AllNetworkConfigs))

    const networkConfigsArray = networksArray.flatMap((network) => {
      return [network.Testnet, network.Mainnet]
    })

    const allNetworksTransactions = await Promise.all(networkConfigsArray.flatMap((config) => {
        return [this.fetchL2Tx(config),
          this.fetchL1PendingTx(config),
          this.fetchTeleportationTransactions(config)]
      }
    ))
    const filteredResults = allNetworksTransactions.reduce((acc, res) => [...acc, ...res], [])
    return filteredResults?.filter((transaction) => transaction.hash)
  }

  async fetchTeleportationTransactions(networkConfig = networkService.networkConfig) {
    let rawTx = []

    const contractL1 = networkService.getTeleportationContract(networkConfig.L1.chainId)
    const contractL2 = networkService.getTeleportationContract(networkConfig.L2.chainId)

    const mapEventToTransaction = async (sendEvent, disburseEvent, contract) => {
      const txReceipt = await contract.provider.getTransactionReceipt(sendEvent.txHash)
      let crossDomainMessageFinalize

      if (disburseEvent) {
        crossDomainMessageFinalize = disburseEvent.blockTimestamp
      }

      const crossDomainMessage = {
        crossDomainMessage: disburseEvent?.depositId,
        crossDomainMessageEstimateFinalizedTime: crossDomainMessageFinalize ?? (parseInt(sendEvent.blockTimestamp) + 180), // should never take longer than a few minutes
        crossDomainMessageFinalize,
        crossDomainMessageSendTime: sendEvent.blockTimestamp,
        fromHash: sendEvent.txHash,
      }

      let status = txReceipt?.status ? TRANSACTION_STATUS.Pending : TRANSACTION_STATUS.Failed
      if (disburseEvent && status === TRANSACTION_STATUS.Pending) {
        const rpc = new providers.JsonRpcProvider(getRpcUrlByChainId(sendEvent.toChainId))
        const disburseTxReceipt = await rpc.getTransactionReceipt(disburseEvent.txHash)
        status = disburseTxReceipt.status === 1 ? TRANSACTION_STATUS.Succeeded : TRANSACTION_STATUS.Failed
        if (status === TRANSACTION_STATUS.Succeeded && disburseEvent.__typename === "TeleportationDisbursementFailedEvent") {
          // won't go in here if already retried
          status = TRANSACTION_STATUS.Failed // TODO: but can be retried
        }
        crossDomainMessage.toHash = disburseEvent.txHash
      }

      const action = {
        amount: sendEvent.amount?.toString(),
        sender: sendEvent.emitter,
        status,
        to: sendEvent.emitter,
        token: sendEvent.token,
      }
      const networkConfigForChainId = CHAIN_ID_LIST[sendEvent.sourceChainId]
      return {
        ...sendEvent,
        ...txReceipt,
        disburseEvent,
        timeStamp: sendEvent.blockTimestamp,
        layer: networkConfigForChainId.layer,
        chainName: networkConfigForChainId.name,
        originChainId: sendEvent.sourceChainId,
        destinationChainId: sendEvent.toChainId,
        UserFacingStatus: status,
        contractAddress: contract.address,
        hash: sendEvent.txHash,
        crossDomainMessage,
        contractName: 'Teleportation',
        from: sendEvent.emitter,
        to: sendEvent.emitter,
        action,
        isTeleportation: true,
      };
    }

    const getEventsForTeleportation = async (contract, sourceChainId) => {
      if (contract) {
        let sentEvents = []
        try {
          sentEvents = await teleportationGraphQLService.queryAssetReceivedEvent(networkService.account, sourceChainId)
        } catch (err) {
          console.error(err)
        }

        if (!sentEvents || !sentEvents?.length) return []
        return await Promise.all(sentEvents.map(async sentEvent => {
          let receiveEvent = await teleportationGraphQLService.queryDisbursementSuccessEvent(networkService.account, sentEvent.sourceChainId, sentEvent.toChainId, sentEvent.token, sentEvent.amount, sentEvent.depositId)
          if (!receiveEvent && sentEvent.token === ethers.constants.AddressZero) {
            // Native assets can fail and retried
            receiveEvent = await teleportationGraphQLService.queryDisbursementFailedEvent(networkService.account, sentEvent.sourceChainId, sentEvent.toChainId, sentEvent.amount, sentEvent.depositId)
            if (receiveEvent) {
              // check if successfully retried
              receiveEvent = await teleportationGraphQLService.queryDisbursementRetrySuccessEvent(networkService.account, sentEvent.sourceChainId, sentEvent.toChainId, sentEvent.amount, sentEvent.depositId)
            }
            receiveEvent.token = ethers.constants.AddressZero
          }
          return await mapEventToTransaction(sentEvent, receiveEvent, contract)
        }))
      } else if (isDevBuild()) {
        console.log("DEV: Teleportation not supported on network")
      }
      return []
    }

    rawTx = rawTx.concat(await getEventsForTeleportation(contractL1, networkConfig.L1.chainId))
    return rawTx.concat(await getEventsForTeleportation(contractL2, networkConfig.L2.chainId))
  }
}

const transactionService = new TransactionService()

export default transactionService
