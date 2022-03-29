const ethers = require('ethers')
const configs = require('./utilities/configs')
const { logger } = require('./utilities/logger')
const bobaJson = require('@boba/contracts/artifacts/contracts/DAO/governance-token/BOBA.sol/BOBA.json')

const provider = new ethers.providers.JsonRpcProvider(configs.periodicL2Web3Url)

const wallet = configs.periodicTransactionPrivateKey
  ? new ethers.Wallet(configs.periodicTransactionPrivateKey, provider)
  : undefined

const bobaContract = new ethers.Contract(
  configs.bobaContractL2Address,
  bobaJson.abi,
  wallet
)

module.exports.sendTransactionPeriodically = async () => {
  if (!wallet) {
    return
  }

  // const tx = {
  //   to: wallet.address,
  //   value: ethers.utils.parseEther(configs.periodicEthAmount + ''),
  //   gasLimit: 500000,
  // }
  // try {
  //   const transaction = await wallet.sendTransaction(tx)
  //   await transaction.wait()
  // } catch (e) {
  //   logger.error('Error while transfer ETH periodically in L2', {
  //     error: e.message,
  //   })
  // }

  const startingTime = new Date()
  try {
    const tx = await bobaContract.transfer(
      wallet.address,
      configs.periodicBobaAmount
    )
    await tx.wait()
    logger.info('Transfered Boba token periodically for testing in L2', {
      amount: configs.periodicBobaAmount,
      address: wallet.address,
      totalTime: (new Date() - startingTime) / 1000,
    })
  } catch (e) {
    logger.error('Error while transfer Boba periodically for testing in L2', {
      amount: configs.periodicBobaAmount,
      address: wallet.address,
      error: e.message,
    })
  }
}
