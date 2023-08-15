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

    const contractL1 = networkService.getTeleportationContract(Layer.L1)
    const contractL2 = networkService.getTeleportationContract(Layer.L2)

    const mapEventToTransaction = async (t) => {
      const txReceipt = await t.getTransactionReceipt()
      const block = await t.getBlock()

      const action = {
        amount: t.args.amount?.toString(),
        sender: t.args.emitter,
        status: txReceipt?.status ? TRANSACTION_STATUS.Pending : TRANSACTION_STATUS.Failed, // TODO: Search disburse tx
        to: t.args.emitter,
        token: t.args.token,
      }
      return {
        ...t,
        ...txReceipt,
        timeStamp: block.timestamp,
        layer: Layer.L1,
        chainName: networkConfig.L1.name,
        originChainId: t.args.sourceChainId,
        destinationChainId: t.args.toChainId,
        UserFacingStatus: TRANSACTION_STATUS.Pending, // TODO: Search disburse tx
        contractAddress: t.address,
        hash: t.transactionHash,
        contractName: 'Teleportation',
        from: t.args.emitter,
        to: t.args.emitter,
        action,
        isTeleportation: true,
      }
    }

    let rawTx = []
    if (contractL1) {
      const assetSent = contractL1.filters.AssetReceived() //null, null, null, null, null/*networkService.account*/, null)
      const assetReceived = contractL1.filters.DisbursementSuccess()
      const eventsSent = await contractL1.queryFilter(assetSent, 40005) // TODO
      rawTx = rawTx.concat(await Promise.all(eventsSent.map(async t => {
        return await mapEventToTransaction(t)
      })))
      console.log('ASSETS:::SENT', assetSent, eventsSent)
      console.log('ASSETS:RECEIVED', assetReceived)
    } else {
      console.log("Teleportation not supported on network: ", networkConfig.L1)
    }

    // TODO: Events duplicate on both networks?
    if (contractL2) {
      const assetSent = contractL1.filters.AssetReceived() //null, null, null, null, null/*networkService.account*/, null)
      const assetReceived = contractL1.filters.DisbursementSuccess()
      const eventsSent = await contractL1.queryFilter(assetSent, 40005) // TODO
      rawTx = rawTx.concat(await Promise.all(eventsSent.map(async t => {
        return await mapEventToTransaction(t)
      })))
      console.log('ASSETS:::SENT', assetSent, eventsSent)
      console.log('ASSETS:RECEIVED', assetReceived)
    } else {
      console.log("Teleportation not supported on network: ", networkConfig.L2)
    }
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
        //add the chain: 'teleportation' field
        /*txTeleportation = responseTeleportation.data.map((v) => ({
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

const transctionService = new TransactionService()

export default transctionService
