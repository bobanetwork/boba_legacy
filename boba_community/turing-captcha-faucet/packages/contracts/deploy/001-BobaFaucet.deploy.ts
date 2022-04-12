import { getContractFactory } from '@eth-optimism/contracts'
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/dist/types'
import { Contract, ContractFactory, utils } from 'ethers'

/* eslint-disable */
require('dotenv').config()

import TuringHelperJson from '../artifacts/contracts/TuringHelper.sol/TuringHelper.json'
import BobaTuringCreditJson from '../artifacts/contracts/BobaTuringCredit.sol/BobaTuringCredit.json'
import BobaFaucetJson from '../artifacts/contracts/BobaFaucet.sol/BobaFaucet.json'
import ERC20Json from '../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json'

let Factory__TuringHelperr: ContractFactory
let TuringHelper: Contract

let Factory__BobaFaucet: ContractFactory
let BobaFaucet: Contract

let BobaTuringCredit: Contract

let L2BobaToken: Contract

const deployFn: DeployFunction = async (hre) => {
    L2BobaToken = new Contract(
        (hre as any).deployConfig.L2BOBATokenAddress,
        ERC20Json.abi,
        (hre as any).deployConfig.deployer_l2
    )

    BobaTuringCredit = new Contract(
        (hre as any).deployConfig.BobaTuringCreditAddress,
        BobaTuringCreditJson.abi,
        (hre as any).deployConfig.deployer_l2
    )

    Factory__TuringHelperr = new ContractFactory(
        TuringHelperJson.abi,
        TuringHelperJson.bytecode,
        (hre as any).deployConfig.deployer_l2
    )

    TuringHelper = await Factory__TuringHelperr.deploy()
    await TuringHelper.deployTransaction.wait()

    console.log(`TuringHelper was deployed at: ${TuringHelper.address}`)

    const TuringHelperDeploymentSubmission: DeploymentSubmission = {
        ...TuringHelper,
        receipt: TuringHelper.receipt,
        address: TuringHelper.address,
        abi: TuringHelper.abi,
    }
    await hre.deployments.save('TuringHelper', TuringHelperDeploymentSubmission)

    Factory__BobaFaucet = new ContractFactory(
        BobaFaucetJson.abi,
        BobaFaucetJson.bytecode,
        (hre as any).deployConfig.deployer_l2
    )

    BobaFaucet = await Factory__BobaFaucet.deploy(
        TuringHelper.address,
        'https://bfx0hsojl5.execute-api.us-east-1.amazonaws.com/prod/post.captcha',
        L2BobaToken.address,
        86400, // 24 hours 24 * 60 * 60
        utils.parseEther('10'),
        utils.parseEther('0.1')
    )
    await BobaFaucet.deployTransaction.wait()

    console.log(`BobaFaucet was deployed at: ${BobaFaucet.address}`)

    const BobaFaucetDeploymentSubmission: DeploymentSubmission = {
        ...BobaFaucet,
        receipt: BobaFaucet.receipt,
        address: BobaFaucet.address,
        abi: BobaFaucet.abi,
    }
    await hre.deployments.save('BobaFaucet', BobaFaucetDeploymentSubmission)

    // Add credit
    const approveTx = await L2BobaToken.approve(
        BobaTuringCredit.address,
        utils.parseEther('100')
    )
    await approveTx.wait()

    const addCreditTx = await BobaTuringCredit.addBalanceTo(
        utils.parseEther('100'),
        TuringHelper.address
    )
    await addCreditTx.wait()

    // Give permission
    const addPermissionTx = await TuringHelper.addPermittedCaller(
        BobaFaucet.address
    )
    await addPermissionTx.wait()

    // Add Boba
    const addBobaTx = await L2BobaToken.transfer(
        BobaFaucet.address,
        utils.parseEther('100')
    )
    await addBobaTx.wait()
}

deployFn.tags = ['BobaFaucet', 'required']

export default deployFn
