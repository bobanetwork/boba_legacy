/* Imports: External */
import { sleep } from '@eth-optimism/core-utils'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  defaultHardhatNetworkHdAccountsConfigParams,
  defaultHardhatNetworkParams,
} from 'hardhat/internal/core/config/default-config'
import { normalizeHardhatNetworkAccountsConfig } from 'hardhat/internal/core/providers/util'
import { predeploys } from '../src/predeploys'

/* Imports: Internal */
import { getDeployedContract } from '../src/hardhat-deploy-ethers'

// This is a TEMPORARY way to fund the default hardhat accounts on L2. The better way to do this is
// to make a modification to hardhat-ovm. However, I don't have the time right now to figure the
// details of how to make that work cleanly. This is fine in the meantime.
const deployFn: DeployFunction = async (hre) => {
  // Only execute this step if we're on the hardhat chain ID.
  const { chainId } = await hre.ethers.provider.getNetwork()
  if (chainId === defaultHardhatNetworkParams.chainId) {
    const L1StandardBridge = await getDeployedContract(
      hre,
      'Proxy__L1StandardBridge',
      {
        iface: 'L1StandardBridge',
      }
    )

    const L1BobaToken = await getDeployedContract(hre, 'TK_L1BOBA', {
      iface: 'BOBA',
    })

    // Default has 20 accounts but we restrict to 20 accounts manually as well just to prevent
    // future problems if the number of default accounts increases for whatever reason.
    const accounts = normalizeHardhatNetworkAccountsConfig(
      defaultHardhatNetworkHdAccountsConfigParams
    ).slice(0, 20)

    // Boba holder
    const BobaHolder = new hre.ethers.Wallet(
      accounts[0].privateKey,
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
      const fundETHTx = await L1StandardBridge.connect(wallet).depositETH(
        8_000_000,
        '0x',
        {
          value: depositAmount,
          gasLimit: 2_000_000, // Idk, gas estimation was broken and this fixes it.
        }
      )
      await fundETHTx.wait()
      console.log(
        `✓ Funded ${wallet.address} on L2 with ${hre.ethers.utils.formatEther(
          depositAmount
        )} ETH`
      )

      // Deposit Boba tokens to L2 accounts
      const depositBobaAmount = hre.ethers.utils.parseEther('5000')
      const L2BobaAddress = predeploys.L2GovernanceERC20
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
        8_000_000,
        '0x',
        { gasLimit: 2_000_000 } // Idk, gas estimation was broken and this fixes it.
      )
      await fundBobaTx.wait()
      console.log(`✓ Funded ${wallet.address} on L2 with 5000.0 BOBA`)
    }
  }
}

deployFn.dependencies = ['Proxy__L1StandardBridge']
deployFn.tags = ['fund-accounts']

export default deployFn
