/* Imports: External */
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, ethers, utils, Transaction } from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { registerBobaAddress } from './000-Messenger.deploy'

import TuringHelperJson from '@boba/turing-hybrid-compute/artifacts/contracts/TuringHelper.sol/TuringHelper.json'

let L1Boba: Contract
let L2Boba: Contract

let BobaTuringHelper: Contract

const deployFn: DeployFunction = async (hre) => {

  const addressManager = getContractFactory('Lib_AddressManager')
    .connect((hre as any).deployConfig.deployer_l1)
    .attach(process.env.ADDRESS_MANAGER_ADDRESS) as any

  const BobaTuringCredit = getContractFactory('BobaTuringCredit')
    .connect((hre as any).deployConfig.deployer_l2)
    .attach((hre as any).deployConfig.BobaTuringCreditAddress)

  BobaTuringHelper = new Contract(
    (hre as any).deployConfig.BobaTuringHelperAddress,
    TuringHelperJson.abi,
    (hre as any).deployConfig.deployer_l2
  )

  const L2BobaAddress = await addressManager.getAddress('TK_L2BOBA')

  L2Boba = getContractFactory('L2GovernanceERC20')
    .connect((hre as any).deployConfig.deployer_l2)
    .attach(L2BobaAddress) as any

  // Set turing token
  const setToken = await BobaTuringCredit.updateTuringToken(L2Boba.address)
  await setToken.wait()
  console.log(`Turing token was set to L2 Boba at ${L2Boba.address}`)

  console.log(`BobaTuringCredit is at ${BobaTuringCredit.address}`)
  console.log(`BobaTuringHelper is at ${BobaTuringHelper.address}`)

  const depositBobaAmountL2 = utils.parseEther('500') //too much? 

  // Deposit Boba to BobaTuringHelper and set Turing price
  const approveL2BobaTx = await L2Boba.approve(
    BobaTuringCredit.address,
    depositBobaAmountL2
  )
  await approveL2BobaTx.wait()

  const addBalanceTx = await BobaTuringCredit.addBalanceTo(
    depositBobaAmountL2,
    BobaTuringHelper.address
  )
  await addBalanceTx.wait()

  console.log(
    `Boba was added for BobaTuringHelper in BobaTuringCredit: ${addBalanceTx.hash}`
  )

  const turingPrice = utils.parseEther('0.1')
  const setPriceTx = await BobaTuringCredit.updateTuringPrice(turingPrice)
  await setPriceTx.wait()

  console.log(`Turing price was set to ${turingPrice}`)

  // this is a predeploy on some chains - let's make sure it's registered one way or the other
  const BobaTuringCreditSubmission: DeploymentSubmission = {
    ...BobaTuringCredit,
    receipt: BobaTuringCredit.receipt,
    address: BobaTuringCredit.address,
    abi: BobaTuringCredit.abi,
  }

  await hre.deployments.save('BobaTuringCredit', BobaTuringCreditSubmission)
  await registerBobaAddress(
    addressManager,
    'BobaTuringCredit',
    BobaTuringCredit.address
  )
  console.log(
    `Registered BobaTuringCredit in the AddressManager at ${BobaTuringCredit.address}`
  )
}

deployFn.tags = ['BobaTuring']

export default deployFn
