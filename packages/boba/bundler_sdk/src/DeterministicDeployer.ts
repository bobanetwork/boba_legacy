import { BigNumber, BigNumberish, ContractFactory, Wallet } from 'ethers'
import { hexConcat, hexlify, hexZeroPad, keccak256 } from 'ethers/lib/utils'
import { TransactionRequest } from '@ethersproject/abstract-provider'
import { JsonRpcProvider } from '@ethersproject/providers'

/**
 * wrapper class for Arachnid's deterministic deployer
 * (deterministic deployer used by 'hardhat-deployer'. generates the same addresses as "hardhat-deploy")
 */
export class DeterministicDeployer {
  /**
   * return the address this code will get deployed to.
   *
   * @param ctrCode constructor code to pass to CREATE2, or ContractFactory
   * @param salt optional salt. defaults to zero
   */
  static async getAddress(ctrCode: string, salt: BigNumberish): Promise<string>
  static async getAddress(ctrCode: string): Promise<string>
  static async getAddress(
    ctrCode: ContractFactory,
    salt: BigNumberish,
    params: any[]
  ): Promise<string>
  static async getAddress(
    ctrCode: string | ContractFactory,
    salt: BigNumberish = 0,
    params: any[] = []
  ): Promise<string> {
    return await DeterministicDeployer.instance.getDeterministicDeployAddress(
      ctrCode,
      salt,
      params
    )
  }

  /**
   * deploy the contract, unless already deployed
   *
   * @param ctrCode constructor code to pass to CREATE2 or ContractFactory
   * @param salt optional salt. defaults to zero
   * @return the deployed address
   */
  static async deploy(ctrCode: string, salt?: BigNumberish): Promise<string>
  static async deploy(
    ctrCode: ContractFactory,
    salt: BigNumberish,
    params: any[]
  ): Promise<string>
  static async deploy(
    ctrCode: string | ContractFactory,
    salt: BigNumberish = 0,
    params: any[] = []
  ): Promise<string> {
    return DeterministicDeployer.instance.deterministicDeploy(
      ctrCode,
      salt,
      params
    )
  }

  // from: https://github.com/Arachnid/deterministic-deployment-proxy
  proxyAddress = '0x4e59b44847b379578588920ca78fbf26c0b4956c'
  deploymentTransaction =
    '0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222'

  deploymentSignerAddress = '0x3fab184622dc19b6109349b94811493bf2a45362'
  deploymentGasPrice = 100e9
  deploymentGasLimit = 100000

  constructor(
    readonly provider: JsonRpcProvider,
    readonly wallet?: Wallet,
    network?: string
  ) {
    if (network === 'boba_mainnet' || network === 'boba_bnb_testnet') {
      this.proxyAddress = '0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7'
      this.deploymentTransaction =
        '0xf8a7808504a817c800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3820264a02836f16b67fdf74d02d4d9548495cffd739f509b9bc4b8fdffd2611c38489642a07864709b3f830a661897f4d60d98efc26754f44be447cf35a65ff92a06cb7bd0'
      this.deploymentSignerAddress =
        '0xE1CB04A0fA36DdD16a06ea828007E35e1a3cBC37'
      this.deploymentGasPrice = 20000000000
      this.deploymentGasLimit = 100000
    } else if (network === 'boba_goerli') {
      this.proxyAddress = '0x4e59b44847b379578588920ca78fbf26c0b4956c'
      this.deploymentTransaction =
        '0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222'
      this.deploymentSignerAddress =
        '0x3fab184622dc19b6109349b94811493bf2a45362'
      this.deploymentGasPrice = 100e9
      this.deploymentGasLimit = 100000
    }
  }

  async isContractDeployed(address: string): Promise<boolean> {
    return await this.provider.getCode(address).then((code) => code.length > 2)
  }

  async isDeployerDeployed(): Promise<boolean> {
    return await this.isContractDeployed(this.proxyAddress)
  }

  async deployFactory(): Promise<void> {
    if (await this.isContractDeployed(this.proxyAddress)) {
      return
    }
    const bal = await this.provider.getBalance(this.deploymentSignerAddress)
    const neededBalance = BigNumber.from(this.deploymentGasLimit).mul(
      this.deploymentGasPrice
    )
    const signer = this.provider.getSigner()
    if (bal.lt(neededBalance)) {
      await signer.sendTransaction({
        to: this.deploymentSignerAddress,
        value: neededBalance,
        gasLimit: this.deploymentGasLimit,
      })
    }
    await this.provider.send('eth_sendRawTransaction', [
      this.deploymentTransaction,
    ])
    if (!(await this.isContractDeployed(this.proxyAddress))) {
      throw new Error("raw TX didn't deploy deployer!")
    }
  }

  async getDeployTransaction(
    ctrCode: string | ContractFactory,
    salt: BigNumberish = 0,
    params: any[] = []
  ): Promise<TransactionRequest> {
    await this.deployFactory()
    const saltEncoded = hexZeroPad(hexlify(salt), 32)
    const ctrEncoded = await this.getCtrCode(ctrCode, params)
    return {
      to: this.proxyAddress,
      data: hexConcat([saltEncoded, ctrEncoded]),
    }
  }

  getCtrCode(ctrCode: string | ContractFactory, params: any[]): string {
    if (typeof ctrCode !== 'string') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return hexlify(ctrCode.getDeployTransaction(...params).data!)
    } else {
      if (params.length !== 0) {
        throw new Error(
          'constructor params can only be passed to ContractFactory'
        )
      }
      return ctrCode
    }
  }

  async getDeterministicDeployAddress(
    ctrCode: string | ContractFactory,
    salt: BigNumberish = 0,
    params: any[] = []
  ): Promise<string> {
    // this method works only before the contract is already deployed:
    // return await this.provider.call(await this.getDeployTransaction(ctrCode, salt))
    const saltEncoded = hexZeroPad(hexlify(salt), 32)
    const ctrCode1 = this.getCtrCode(ctrCode, params)
    return (
      '0x' +
      keccak256(
        hexConcat(['0xff', this.proxyAddress, saltEncoded, keccak256(ctrCode1)])
      ).slice(-40)
    )
  }

  async deterministicDeploy(
    ctrCode: string | ContractFactory,
    salt: BigNumberish = 0,
    params: any[] = []
  ): Promise<string> {
    const addr = await this.getDeterministicDeployAddress(ctrCode, salt, params)
    console.log('deterministicDeploy')
    console.log(addr)
    if (!(await this.isContractDeployed(addr))) {
      if (this.wallet != null) {
        await this.wallet.sendTransaction(
          await this.getDeployTransaction(ctrCode, salt, params)
        )
      } else {
        await this.provider
          .getSigner()
          .sendTransaction(
            await this.getDeployTransaction(ctrCode, salt, params)
          )
      }
    }
    return addr
  }

  private static _instance?: DeterministicDeployer

  static init(
    provider: JsonRpcProvider,
    wallet?: Wallet,
    network?: string
  ): void {
    this._instance = new DeterministicDeployer(provider, wallet, network)
  }

  static get instance(): DeterministicDeployer {
    if (this._instance == null) {
      throw new Error(
        'must call "DeterministicDeployer.init(ethers.provider)" first'
      )
    }
    return this._instance
  }
}
