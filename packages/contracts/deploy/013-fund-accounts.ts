/* Imports: External */
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { predeploys } from '../src/predeploys'
import { supportedLocalTestnet } from '../src/local-network-config'

/* Imports: Internal */
import { getDeployedContract } from '../src/hardhat-deploy-ethers'

// This is a TEMPORARY way to fund the default hardhat accounts on L2. The better way to do this is
// to make a modification to hardhat-ovm. However, I don't have the time right now to figure the
// details of how to make that work cleanly. This is fine in the meantime.
const deployFn: DeployFunction = async (hre) => {
  // Only execute this step if we're on the hardhat chain ID.
  const { chainId } = await hre.ethers.provider.getNetwork()
  const networkConfig = supportedLocalTestnet[chainId]
  if (typeof networkConfig === 'undefined') {
    throw new Error("Unsupported local chain ID!");

  }
  const L1StandardBridge = await getDeployedContract(
    hre,
    'Proxy__L1StandardBridge',
    {
      iface: networkConfig.isLocalAltL1 ? 'L1StandardBridgeAltL1' : 'L1StandardBridge',
    }
  )

  const L1BobaToken = await getDeployedContract(hre, 'TK_L1BOBA', {
    iface: 'BOBA',
  })

  const accounts = networkConfig.accounts

  // Boba holder
  const BobaHolder = new hre.ethers.Wallet(
    accounts.privateKey,
    hre.ethers.provider
  )

  // Fund the accounts.
  for (const account of accounts) {
    const wallet = new hre.ethers.Wallet(
      account.privateKey,
      hre.ethers.provider
    )
    const balance = await wallet.getBalance()
    const depositAmount = balance.div(2) // Deposit half of the wallet's balance into L2.

    await L1StandardBridge.connect(wallet).functions[
      networkConfig.isLocalAltL1? 'depositNativeToken': 'depositETH'
    ](networkConfig.depositL2Gas, '0x', {
      value: depositAmount,
      ...networkConfig.gasLimitOption,
    })
    console.log(
      `✓ Funded ${wallet.address} on L2 with ${hre.ethers.utils.formatEther(
        depositAmount
      )} ${networkConfig.isLocalAltL1? "L1 native token": "ETH"}`
    )

    // Deposit Boba tokens to L2 accounts
    const depositBobaAmount = hre.ethers.utils.parseEther('5000')
    const L2BobaAddress = networkConfig.isLocalAltL1
      ? predeploys.L2_BOBA_ALT_L1
      : predeploys.L2GovernanceERC20
    const approveTx = await L1BobaToken.connect(BobaHolder).approve(
      L1StandardBridge.address,
      depositBobaAmount
    )
    await approveTx.wait()
    const fundBobaTx = await L1StandardBridge.connect(
      BobaHolder
    ).depositERC20To(
      L1BobaToken.address,
      L2BobaAddress,
      wallet.address,
      depositBobaAmount,
      networkConfig.depositL2Gas,
      '0x',
      networkConfig.gasLimitOption // Idk, gas estimation was broken and this fixes it.
    )
    await fundBobaTx.wait()
    console.log(`✓ Funded ${wallet.address} on L2 with 5000.0 BOBA`)
  }
}

deployFn.dependencies = ['Proxy__L1StandardBridge']
deployFn.tags = ['fund-accounts']

export default deployFn
