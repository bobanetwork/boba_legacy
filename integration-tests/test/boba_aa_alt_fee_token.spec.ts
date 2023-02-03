import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, BigNumber } from 'ethers'

import BobaDepositPaymasterJson from '@boba/accountabstraction/artifacts/contracts/samples/BobaDepositPaymaster.sol/BobaDepositPaymaster.json'

import { OptimismEnv } from './shared/env'

describe('AA Alt Fee Token Test\n', async () => {
})