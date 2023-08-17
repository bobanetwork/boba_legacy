import omgxWatcherAxiosInstance from 'api/omgxWatcherAxios'
import networkService from './networkService'
import {AllNetworkConfigs} from 'util/network/network.util'
import {Layer} from "../util/constant";
import {useSelector} from "react-redux";
import {selectLayer} from "../selectors";
import {TRANSACTION_STATUS} from "../containers/history/types";
import {ethers} from "ethers";

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
    let txTeleportation = []
    let rawTx = []

    const contractL1 = networkService.getTeleportationContract(networkConfig.L1.chainId)
    const contractL2 = networkService.getTeleportationContract(networkConfig.L2.chainId)

    const mapEventToTransaction = async (sendEvent, disburseEvent) => {
      const txReceipt = await sendEvent.getTransactionReceipt()
      const block = await sendEvent.getBlock()
      let crossDomainMessageFinalize

      if (disburseEvent) {
        crossDomainMessageFinalize = (await disburseEvent.getBlock()).timestamp
      }

      const crossDomainMessage = {
        crossDomainMessage: disburseEvent?.args?.depositId,
        crossDomainMessageEstimateFinalizedTime: crossDomainMessageFinalize ?? (block.timestamp + 180), // should never take longer than a few minutes
        crossDomainMessageFinalize,
        crossDomainMessageSendTime: block.timestamp,
      }

      let status = txReceipt?.status ? TRANSACTION_STATUS.Pending : TRANSACTION_STATUS.Failed
      if (disburseEvent && status === TRANSACTION_STATUS.Pending) {
        status = (await disburseEvent.getTransactionReceipt()).status === 1 ? TRANSACTION_STATUS.Succeeded : TRANSACTION_STATUS.Failed
      }

      const action = {
        amount: sendEvent.args.amount?.toString(),
        sender: sendEvent.args.emitter,
        status,
        to: sendEvent.args.emitter,
        token: sendEvent.args.token,
      }
      return {
        ...sendEvent,
        ...txReceipt,
        disburseEvent,
        timeStamp: block.timestamp,
        layer: Layer.L1,
        chainName: networkConfig.L1.name,
        originChainId: sendEvent.args.sourceChainId,
        destinationChainId: sendEvent.args.toChainId,
        UserFacingStatus: status,
        contractAddress: sendEvent.address,
        hash: sendEvent.transactionHash,
        crossDomainMessage,
        contractName: 'Teleportation',
        from: sendEvent.args.emitter,
        to: sendEvent.args.emitter,
        action,
        isTeleportation: true,
      }
    }

    const getEventsForContract = async (contract) => {
      if (contract) {
        const currBlockNumber = await contract.provider.getBlockNumber()
        const assetSent = contract.filters.AssetReceived(null, null, null, null, networkService.account, null)
        const assetReceived = contract.filters.DisbursementSuccess(null, networkService.account, null, null, null)
        let sentEvents = []
        try {
          sentEvents = await contract.queryFilter(assetSent, currBlockNumber - 500) // TODO --> use external service, e.g. GraphQL
        } catch (err) {
          console.error(err)
        }
        let receiveEvents = []
        try {
          receiveEvents = receiveEvents.concat(await contract.queryFilter(assetReceived, currBlockNumber - 500))
        } catch (err) {
          console.error(err)
        }

        return await Promise.all(sentEvents.map(async sentEvent => {
          const receiveEvent = receiveEvents.find(re => re.args.sourceChainId === sentEvent.args.toChainId
            && re.args.amount.toString() === sentEvent.args.amount.toString() && re.args.to === sentEvent.args.emitter
          && sentEvent.args.depositId.toString() === re.args.depositId.toString())
          return await mapEventToTransaction(sentEvent, receiveEvent)
        }))
      } else {
        console.log("Teleportation not supported on network")
      }
      return []
    }

    rawTx = rawTx.concat(await getEventsForContract(contractL1))
    rawTx = rawTx.concat(await getEventsForContract(contractL2))

    try {

      /* TODO
      const responseTeleportation = await omgxWatcherAxiosInstance(networkService.networkConfig)
        .post('get.teleportation.transactions', {
          address: networkService.account,
          fromRange: 0,
          toRange: 1000,
        })*/
      // TODO
      const responseTeleportation = {
        status: 201,
        data: rawTx,
      }

      console.log("RESP TELEPO", responseTeleportation)

      if (responseTeleportation.status === 201) {
        // add the chain: 'teleportation' field
        /* todo txTeleportation = responseTeleportation.data.map((v) => ({
          ...v, layer: networkConfig.layer, chainName: networkConfig.L2.name,
          originChainId: networkConfig.L2.chainId,
          destinationChainId: networkConfig.L1.chainId
        }))*/
        txTeleportation = responseTeleportation.data
      }
      return txTeleportation
    } catch (error) {
      console.log('TS: getTeleportationTransactions', error)
      return txTeleportation
    }
  }
}

const transactionService = new TransactionService()

export default transactionService
