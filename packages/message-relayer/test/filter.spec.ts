import { expect } from './setup'
import { ethers } from 'hardhat'
import { MessageRelayerService } from '../src'

describe('message relayer filter tests', () => {
  const Proxy__L1StandardBridge = ethers.Wallet.createRandom().address
  const Proxy__L1LiquidityPool = ethers.Wallet.createRandom().address
  const Proxy__L1NFTBridge = ethers.Wallet.createRandom().address
  const Proxy__L1ERC1155Bridge = ethers.Wallet.createRandom().address
  const L1Message = ethers.Wallet.createRandom().address

  let messageRelayerService: any

  const apiPort = 3000
  let apiEndpoint: string

  before(async () => {
    /* eslint-disable */
     const http = require('http')
     const ip = require("ip")
     // start local server
     const server = module.exports = http.createServer(async function (req, res) {
       req.on('data', () => {})
       req.on('end', async () => {
         if (req.url === "/boba-addr.json") {
           console.log(`[API] ${req.method} ${req.url} 200`)
           res.end(JSON.stringify({
             Proxy__L1StandardBridge,
             Proxy__L1LiquidityPool,
             Proxy__L1NFTBridge,
             Proxy__L1ERC1155Bridge,
             L1Message,
           }))
           server.emit('success')
         }
       })
     }).listen(apiPort)
     apiEndpoint = `http://${ip.address()}:${apiPort}`
     /* eslint-enable */
  })

  it('should filter addresses for message relayer', async () => {
    const randomWallet_1 = ethers.Wallet.createRandom()
    const randomWallet_2 = ethers.Wallet.createRandom()
    const randomWallet_3 = ethers.Wallet.createRandom()
    const relayerFilterWhitelist = `${randomWallet_1.address},${randomWallet_2.address},${randomWallet_3.address}`
    messageRelayerService = new MessageRelayerService({
      l2RpcProvider: ethers.provider,
      l1Wallet: ethers.Wallet.createRandom().connect(ethers.provider),
      minBatchSize: 1,
      maxWaitTimeS: 100,
      maxWaitTxTimeS: 1,
      isFastRelayer: false,
      enableRelayerFilter: true,
      relayerFilterWhitelist,
      filterEndpoint: `${apiEndpoint}/boba-addr.json`,
    })
    await messageRelayerService._init()
    await messageRelayerService._getFilter()
    expect(messageRelayerService.state.fastRelayerFilter).to.be.deep.equal([
      Proxy__L1LiquidityPool,
      L1Message,
    ])
    expect(messageRelayerService.state.relayerFilter).to.be.deep.equal([
      Proxy__L1StandardBridge,
      Proxy__L1NFTBridge,
      Proxy__L1ERC1155Bridge,
      ...relayerFilterWhitelist.split(','),
    ])
  })

  it('should filter addresses for message relayer fast', async () => {
    const randomWallet_1 = ethers.Wallet.createRandom()
    const randomWallet_2 = ethers.Wallet.createRandom()
    const randomWallet_3 = ethers.Wallet.createRandom()
    const relayerFilterWhitelist = `${randomWallet_1.address},${randomWallet_2.address},${randomWallet_3.address}`
    messageRelayerService = new MessageRelayerService({
      l2RpcProvider: ethers.provider,
      l1Wallet: ethers.Wallet.createRandom().connect(ethers.provider),
      minBatchSize: 1,
      maxWaitTimeS: 100,
      maxWaitTxTimeS: 1,
      isFastRelayer: true,
      enableRelayerFilter: true,
      relayerFilterWhitelist,
      filterEndpoint: `${apiEndpoint}/boba-addr.json`,
    })
    await messageRelayerService._init()
    await messageRelayerService._getFilter()
    expect(messageRelayerService.state.fastRelayerFilter).to.be.deep.equal([
      Proxy__L1LiquidityPool,
      L1Message,
    ])
    expect(messageRelayerService.state.relayerFilter).to.be.deep.equal([
      Proxy__L1StandardBridge,
      Proxy__L1NFTBridge,
      Proxy__L1ERC1155Bridge,
      ...relayerFilterWhitelist.split(','),
    ])
  })
})
