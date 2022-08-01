import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Wallet, providers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { gunzip } from "zlib";
require('dotenv').config()

let Factory__ve: ContractFactory
let ve: Contract
let Factory__gauges: ContractFactory
let gauges: Contract
let Factory__voter: ContractFactory
let voter: Contract
let Factory__dispatcher: ContractFactory
let dispatcher: Contract

async function main() {
    const l2Provider = new providers.JsonRpcProvider(process.env.L2_NODE_WEB3_URL)
    const deployer_l2 = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, l2Provider)
    const l2BobaAddress = process.env.L2BOBA_ADDRESS

    Factory__ve = await ethers.getContractFactory("contracts/ve.sol:ve", deployer_l2)
    Factory__gauges = await ethers.getContractFactory("BaseV1GaugeFactory", deployer_l2)
    Factory__voter = await ethers.getContractFactory("BaseV1Voter", deployer_l2)
    Factory__dispatcher = await ethers.getContractFactory("BaseV1Dispatcher", deployer_l2)

    console.log('Deploying ve...')
    ve = await Factory__ve.deploy()
    await ve.deployTransaction.wait()
    const veInitTx = await ve.initialize(l2BobaAddress, { gasLimit: 3000000 })
    await veInitTx.wait()
    console.log('👉 Deployed ve at ', ve.address)

    console.log('Deploying gauge factory...')
    gauges = await Factory__gauges.deploy()
    await gauges.deployTransaction.wait()
    console.log('👉 Deployed gauge factory at ', gauges.address)

    console.log('Deploying voter...')
    voter = await Factory__voter.deploy()
    await voter.deployTransaction.wait()
    const voterInitTx = await voter.initialize(ve.address, gauges.address, { gasLimit: 3000000 })
    await voterInitTx.wait()
    console.log('👉 Deployed voter at ', voter.address)

    console.log('Deploying dispatcher...')
    dispatcher = await Factory__dispatcher.deploy()
    await dispatcher.deployTransaction.wait()
    const dispatcherInitTx = await dispatcher.initialize(voter.address, ve.address, { gasLimit: 3000000 })
    await dispatcherInitTx.wait()
    console.log('👉 Deployed dispatcher at ', dispatcher.address)

    console.log('Initializing contracts..')
    const registerVoterTx = await ve.setVoter(voter.address, { gasLimit: 3000000 })
    await registerVoterTx.wait()
    console.log('Registered Voter on Ve')

    // add initialize guages if any here
    const initVoterTx = await voter.initiate_([], dispatcher.address, { gasLimit: 3000000 })
    await initVoterTx.wait()
    console.log('Initialized Voter')

    // TODO: this should come from a file
    // add if there's initial ve receipients
    // approve and have boba ready on the deployer if you want to supply boba to the contract
    const initDispatcherTx = await dispatcher.initiate_([],[], 0, { gasLimit: 3000000 })
    await initDispatcherTx.wait()
    console.log('Initialized Dispatcher')

    console.log('🚀 Initialized All Contracts')
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});