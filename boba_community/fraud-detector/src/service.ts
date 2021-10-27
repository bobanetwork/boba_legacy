
import { Contract, Signer, ethers, Wallet, BigNumber, providers } from 'ethers'
import { BaseService } from '@eth-optimism/common-ts'
import { loadContract, loadContractFromManager } from '@eth-optimism/contracts'
import chalk from 'chalk'

const L2_GENESIS_BLOCK = 1

import {
  L1ProviderWrapper,
  L2ProviderWrapper,
  sleep,
} from './utils'

interface FraudProverOptions {
  
  // Providers for interacting with L1 and L2.
  l1RpcProvider: providers.JsonRpcProvider
  l2RpcProvider: providers.JsonRpcProvider

  // Address of the AddressManager contract, used to resolve the various addresses we'll need
  // within this service.
  addressManagerAddress: string

  // Interval in seconds to wait between loops.
  pollingInterval?: number

  // L1 block to start querying events from. Recommended to set to the StateCommitmentChain deploy height
  l1StartOffset?: number

  // When L1 blocks are considered final
  l1BlockFinality: number

  // Number of blocks within each getLogs query - max is 2000
  getLogsInterval?: number
}

const optionSettings = {
  pollingInterval: { default: 1000 },
  l1StartOffset: { default: 0 },
  l1BlockFinality: { default: 0 },
  getLogsInterval: { default: 2000 },
}

export class FraudProverService extends BaseService<FraudProverOptions> {
  
  constructor(options: FraudProverOptions) {
    super('Fraud_Detector', options, optionSettings)
  }

  private state: {
    L2_block: number
    lastFinalizedTxHeight: number
    nextUnfinalizedTxHeight: number
    lastQueriedL1Block: number
    eventCache: ethers.Event[]
    Lib_AddressManager: Contract
    OVM_StateCommitmentChain: Contract
    l1Provider: L1ProviderWrapper
    l2Provider: L2ProviderWrapper
  }

  protected async _init(): Promise<void> {
    
    this.logger.info('Initializing fraud detector', { options: this.options })

    this.state = {} as any

    this.logger.info('Trying to connect to the L1 network...')
    for (let i = 0; i < 10; i++) {
      try {
        await this.options.l1RpcProvider.detectNetwork()
        this.logger.info('Successfully connected to the L1 network')
        break
      } catch (err) {
        if (i < 9) {
          this.logger.info('Unable to connect to L1 network', {
            retryAttemptsRemaining: 10 - i,
          })
          await sleep(1000)
        } else {
          throw new Error(
            `Unable to connect to the L1 network, check that your L1 endpoint is correct.`
          )
        }
      }
    }

    this.logger.info('Trying to connect to the Verifier...')
    for (let i = 0; i < 1000; i++) {
      try {
        await this.options.l2RpcProvider.detectNetwork()
        this.logger.info('Successfully connected to the L2 Verifier')
        break
      } catch (err) {
        if (i < 999) {
          this.logger.info('Waiting to connect to the L2 Verifier', {
            retryAttemptsRemaining: 1000 - i,
          })
          await sleep(10000)
        } else {
          throw new Error(
            `Unable to connect to the L2 Verifier, check that your L2 Verifier endpoint is correct.`
          )
        }
      }
    }

    this.logger.info('Connecting to Lib_AddressManager...')

    this.state.Lib_AddressManager = loadContract(
      'Lib_AddressManager',
      this.options.addressManagerAddress,
      this.options.l1RpcProvider
    )
    this.logger.info('Connected to Lib_AddressManager', {
      address: this.state.Lib_AddressManager.address,
    })

    this.logger.info('Connecting to OVM_StateCommitmentChain...')
    this.state.OVM_StateCommitmentChain = await loadContractFromManager({
      name: 'OVM_StateCommitmentChain',
      Lib_AddressManager: this.state.Lib_AddressManager,
      provider: this.options.l1RpcProvider,
    })
    this.logger.info('Connected to OVM_StateCommitmentChain', {
      address: this.state.OVM_StateCommitmentChain.address,
    })

    this.logger.info('Connected to all contracts')

    this.state.l1Provider = new L1ProviderWrapper(
      this.options.l1RpcProvider,
      this.state.OVM_StateCommitmentChain,
      this.options.l1StartOffset,
      this.options.l1BlockFinality
    )

    this.state.l2Provider = new L2ProviderWrapper(this.options.l2RpcProvider)

    this.logger.info(
      'Caching events for relevant contracts, this might take a while...'
    )

    this.logger.info('Caching events for OVM_StateCommitmentChain.StateBatchAppended...')
    
    await this.state.l1Provider.findAllEvents(
      this.state.OVM_StateCommitmentChain,
      this.state.OVM_StateCommitmentChain.filters.StateBatchAppended()
    )

    this.state.lastQueriedL1Block = this.options.l1StartOffset
    
    this.state.eventCache = []
    
    this.state.L2_block = this.state.l1Provider.getEarliestL2block(this.state.OVM_StateCommitmentChain.filters.StateBatchAppended())

    //skip the first 10 blocks right after genesis that had the wrong chainID 
    if (this.state.L2_block < 10 ) {
      this.state.L2_block = 10
    }

    console.log('Earliest L2 block',this.state.L2_block)

  }

  protected async _start(): Promise<void> {
    
    while (this.running) {
      
      await sleep(this.options.pollingInterval)
       
      try {
        
        this.logger.info("Currently at L2 block",{
          L2_block: this.state.L2_block
        })

        let nextOperatorL2block = await this.state.l1Provider.getOperatorL2block(
          this.state.L2_block
        )

        if(nextOperatorL2block === undefined) {
          console.log(chalk.bgWhite('\nWaiting for new blocks at L2 block ', this.state.L2_block))
        } else {
          console.log("Next operator L2 block to verify:", nextOperatorL2block)
        }

        while (nextOperatorL2block !== undefined) {
      
          //this.logger.info("Operator L2 block to verify", { nextOperatorL2block })

          const l1StateRoot = nextOperatorL2block.stateRoot

          const l2VStateRoot = await this.state.l2Provider.getStateRoot(
            this.state.L2_block + L2_GENESIS_BLOCK
          )
          
          if (l1StateRoot !== l2VStateRoot) {
            this.logger.info('State root MISMATCH - not verified', { 
              L2_block: this.state.L2_block,
              operatorSR: l1StateRoot,
              verifierSR: l2VStateRoot
            })
            console.log(chalk.white.bgRed.bold('\n***********************************************************'))
            console.log(chalk.white.bgRed.bold('State root MISMATCH - not verified L2 Block number ' + this.state.L2_block.toString()))
            console.log(chalk.white.bgRed.bold('***********************************************************\n'))
          } else {
            this.logger.info('State root MATCH - verified ✓', { 
              L2_block: this.state.L2_block,
              operatorSR: l1StateRoot,
              verifierSR: l2VStateRoot
            })
            console.log(chalk.bgGreen('\n***********************************************************'))
            console.log(chalk.bgGreen('State root MATCH - verified ✓ L2 Block number ' + this.state.L2_block.toString()))
            console.log(chalk.bgGreen('***********************************************************\n'))
          }

          //and now, move on to the next block
          this.state.L2_block++

          nextOperatorL2block = await this.state.l1Provider.getOperatorL2block(
            this.state.L2_block
          )
        }

      } catch (err) {
        this.logger.error('Caught an unhandled error', {
          err,
        })
      }
    }
  }

 }
