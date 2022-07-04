/* Imports: External */
import { DeployFunction } from 'hardhat-deploy/dist/types'

/* Imports: Internal */
import { registerAddress } from '../src/hardhat-deploy-ethers'
import { predeploys } from '../src/predeploys'

const deployFn: DeployFunction = async (hre) => {
  const { deploy } = hre.deployments
  const { deployer } = await hre.getNamedAccounts()

  await deploy('Lib_AddressManager', {
    from: deployer,
    args: [],
    log: true,
  })

  // L2CrossDomainMessenger is the address of the predeploy on L2. We can refactor off-chain
  // services such that we can remove the need to set this address, but for now it's easier
  // to simply keep setting the address.
  await registerAddress({
    hre,
    name: 'L2CrossDomainMessenger',
    address: predeploys.L2CrossDomainMessenger,
  })

  // OVM_Sequencer is the address allowed to submit "Sequencer" blocks to the
  // CanonicalTransactionChain.
  await registerAddress({
    hre,
    name: 'OVM_Sequencer',
    address: (hre as any).deployConfig.ovmSequencerAddress,
  })

  // OVM_Proposer is the address allowed to submit state roots (transaction results) to the
  // StateCommitmentChain.
  await registerAddress({
    hre,
    name: 'OVM_Proposer',
    address: (hre as any).deployConfig.ovmProposerAddress,
  })

  await registerAddress({
    hre,
    name: 'L2BatchMessageRelayer',
    address: (hre as any).deployConfig.ovmRelayerAddress,
  })

  await registerAddress({
    hre,
    name: 'Proxy__BobaTuringCredit',
    address: predeploys.Lib_ResolvedDelegateBobaProxy,
  })

  await registerAddress({
    hre,
    name: 'BobaTuringHelper',
    address: predeploys.BobaTuringHelper,
  })

  await registerAddress({
    hre,
    name: 'TK_L2BOBA',
    address: predeploys.L2GovernanceERC20,
  })

  await registerAddress({
    hre,
    name: 'Boba_GasPriceOracle',
    address: predeploys.Boba_GasPriceOracle,
  })
}

deployFn.tags = ['Lib_AddressManager']

export default deployFn
