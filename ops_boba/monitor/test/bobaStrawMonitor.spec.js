const { ethers } = require('hardhat')
const { expect } = require('./setup')
const bobaStrawMonitorService = require('../services/bobaStrawMonitor')
const { formatBigNumberToEther } = require('../services/utils/utils')

const FluxAggregatorJson = require('@bobanetwork/contracts/artifacts/contracts/oracle/FluxAggregator.sol/FluxAggregator.json')
const L1ERC20Json = require('@bobanetwork/contracts/artifacts/contracts/test-helpers/L1ERC20.sol/L1ERC20.json')

let service
let FluxAggregator
let BobaToken

const BOBA_SUPPLY = ethers.utils.parseEther('10000')
const BOBA_DECIMALS = 18

const deployBoba = async () => {
  const Factory__L1ERC20Json = new ethers.ContractFactory(
    L1ERC20Json.abi,
    L1ERC20Json.bytecode,
    (await ethers.getSigners())[0]
  )
  BobaToken = await Factory__L1ERC20Json.deploy(
    BOBA_SUPPLY,
    'BOBA',
    'BOBA',
    BOBA_DECIMALS
  )
  return BobaToken
}

const deployFluxAggregator = async (BobaToken, addBalance) => {
  const Factory__FluxAggregator = new ethers.ContractFactory(
    FluxAggregatorJson.abi,
    FluxAggregatorJson.bytecode,
    (await ethers.getSigners())[0]
  )
  FluxAggregator = await Factory__FluxAggregator.deploy(
    BobaToken.address,
    0, // starting payment amount
    180, // timeout, 3 mins
    '0x0000000000000000000000000000000000000000', // validator
    0, // min submission value
    ethers.utils.parseUnits('50000', 8), // max submission value
    8, // decimals
    'TST USD' // description
  )
  const randomWallet = ethers.Wallet.createRandom().connect(ethers.provider)
  const addOracleTx = await FluxAggregator.changeOracles(
    [],
    [randomWallet.address],
    [randomWallet.address],
    1, // min submission count
    1, // max submission count
    0 // restart delay
  )
  await addOracleTx.wait()

  const approveTx = await BobaToken.approve(FluxAggregator.address, addBalance)
  await approveTx.wait()
  const addFundsTx = await FluxAggregator.addFunds(addBalance)
  await addFundsTx.wait()
  return FluxAggregator
}

describe('BobaStrawMonitorService Tests', () => {
  before(async () => {
    BobaToken = await deployBoba()
  })

  it('should connect to node', async () => {
    service = new bobaStrawMonitorService()
    service.L2Provider = ethers.provider
    await service.initConnection()
  })

  it('should get the correct balance of a single oracle', async () => {
    const addBalance = ethers.utils.parseEther('100')
    const oracle = await deployFluxAggregator(BobaToken, addBalance)
    service = new bobaStrawMonitorService()
    service.L2Provider = ethers.provider
    service.bobaStrawContractAddresses = `${oracle.address}`.split(',')
    service.bobaStrawMonitorInterval = 1000
    await service.initConnection()
    await service.startBobaStrawMonitor()
    expect(service.availableFunds[oracle.address]).to.be.equal(
      formatBigNumberToEther(addBalance)
    )
  })

  it('should get the correct balances of oracles', async () => {
    const addBalance = ethers.utils.parseEther('100')
    /* eslint-disable */
    const oracle1 = await deployFluxAggregator(BobaToken, addBalance)
    const oracle2 = await deployFluxAggregator(BobaToken, addBalance.add(ethers.BigNumber.from('1')))
    const oracle3 = await deployFluxAggregator(BobaToken, addBalance.add(ethers.BigNumber.from('2')))
    /* eslint-enable */
    service = new bobaStrawMonitorService()
    service.L2Provider = ethers.provider
    service.bobaStrawContractAddresses = `${oracle1.address},${oracle2.address},${oracle3.address}`.split(',')
    service.bobaStrawMonitorInterval = 1000
    await service.initConnection()
    await service.startBobaStrawMonitor()
    /* eslint-disable */
    expect(service.availableFunds[oracle1.address]).to.be.equal(formatBigNumberToEther(addBalance))
    expect(service.availableFunds[oracle2.address]).to.be.equal(formatBigNumberToEther(addBalance.add(ethers.BigNumber.from('1'))))
    expect(service.availableFunds[oracle3.address]).to.be.equal(formatBigNumberToEther(addBalance.add(ethers.BigNumber.from('2'))))
    /* eslint-enable */
  })
})
