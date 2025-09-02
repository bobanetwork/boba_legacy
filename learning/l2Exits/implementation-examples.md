# Implementation Examples for L2 Exit Mechanisms

## Frontend Integration Examples

### 1. Standard Withdrawal Implementation

```typescript
import { ethers } from 'ethers';
import { CrossChainMessenger } from '@bobanetwork/sdk';

class StandardWithdrawal {
  private l2Provider: ethers.providers.Provider;
  private l2Signer: ethers.Signer;
  private messenger: CrossChainMessenger;

  constructor(l2Provider: ethers.providers.Provider, l2Signer: ethers.Signer) {
    this.l2Provider = l2Provider;
    this.l2Signer = l2Signer;

    // Initialize cross-chain messenger
    this.messenger = new CrossChainMessenger({
      l1SignerOrProvider: l1Provider,
      l2SignerOrProvider: l2Signer,
      l1ChainId: 56, // BSC for Boba BNB
    });
  }

  async withdrawERC20(
    l2TokenAddress: string,
    amount: ethers.BigNumber,
    recipient?: string
  ): Promise<ethers.TransactionResponse> {
    const l2StandardBridge = new ethers.Contract(
      '0x4200000000000000000000000000000000000010', // L2StandardBridge
      l2StandardBridgeABI,
      this.l2Signer
    );

    const to = recipient || await this.l2Signer.getAddress();
    const l1Gas = 200000; // Gas for L1 execution

    return await l2StandardBridge.withdraw(
      l2TokenAddress,
      amount,
      l1Gas,
      '0x' // No additional data
    );
  }

  async withdrawETH(
    amount: ethers.BigNumber,
    recipient?: string
  ): Promise<ethers.TransactionResponse> {
    const OVM_ETH = '0x4200000000000000000000000000000000000006';
    return this.withdrawERC20(OVM_ETH, amount, recipient);
  }

  async getWithdrawalStatus(withdrawalTxHash: string): Promise<string> {
    return await this.messenger.getMessageStatus(withdrawalTxHash);
  }

  async estimateWithdrawalTime(withdrawalTxHash: string): Promise<number> {
    // Returns estimated completion time in milliseconds
    const status = await this.getWithdrawalStatus(withdrawalTxHash);

    if (status === 'READY_FOR_RELAY' || status === 'RELAYED') {
      return Date.now(); // Already ready or completed
    }

    // Estimate based on fraud proof window (7 days)
    return Date.now() + (7 * 24 * 60 * 60 * 1000);
  }
}
```

### 2. Discretionary Exit Fee Implementation

```typescript
class DiscretionaryExitFee {
  private l2Provider: ethers.providers.Provider;
  private l2Signer: ethers.Signer;
  private exitFeeContract: ethers.Contract;
  private billingContract: ethers.Contract;

  constructor(
    l2Provider: ethers.providers.Provider,
    l2Signer: ethers.Signer,
    exitFeeAddress: string,
    billingAddress: string
  ) {
    this.l2Provider = l2Provider;
    this.l2Signer = l2Signer;

    this.exitFeeContract = new ethers.Contract(
      exitFeeAddress,
      discretionaryExitFeeABI,
      l2Signer
    );

    this.billingContract = new ethers.Contract(
      billingAddress,
      l2BillingContractABI,
      l2Provider
    );
  }

  async getExitFeeInfo(): Promise<{
    exitFee: ethers.BigNumber;
    feeToken: string;
    feeTokenSymbol: string;
  }> {
    const exitFee = await this.billingContract.exitFee();
    const feeTokenAddress = await this.billingContract.feeTokenAddress();

    const feeTokenContract = new ethers.Contract(
      feeTokenAddress,
      erc20ABI,
      this.l2Provider
    );
    const feeTokenSymbol = await feeTokenContract.symbol();

    return {
      exitFee,
      feeToken: feeTokenAddress,
      feeTokenSymbol
    };
  }

  async checkUserCanAffordFee(userAddress: string): Promise<{
    canAfford: boolean;
    userBalance: ethers.BigNumber;
    requiredFee: ethers.BigNumber;
    hasAllowance: boolean;
  }> {
    const { exitFee, feeToken } = await this.getExitFeeInfo();

    const feeTokenContract = new ethers.Contract(
      feeToken,
      erc20ABI,
      this.l2Provider
    );

    const userBalance = await feeTokenContract.balanceOf(userAddress);
    const allowance = await feeTokenContract.allowance(
      userAddress,
      this.exitFeeContract.address
    );

    return {
      canAfford: userBalance.gte(exitFee),
      userBalance,
      requiredFee: exitFee,
      hasAllowance: allowance.gte(exitFee)
    };
  }

  async approveExitFee(): Promise<ethers.TransactionResponse> {
    const { exitFee, feeToken } = await this.getExitFeeInfo();

    const feeTokenContract = new ethers.Contract(
      feeToken,
      erc20ABI,
      this.l2Signer
    );

    return await feeTokenContract.approve(
      this.exitFeeContract.address,
      exitFee
    );
  }

  async payAndWithdraw(
    l2TokenAddress: string,
    amount: ethers.BigNumber,
    recipient?: string
  ): Promise<ethers.TransactionResponse> {
    // Check prerequisites
    const userAddress = await this.l2Signer.getAddress();
    const canAfford = await this.checkUserCanAffordFee(userAddress);

    if (!canAfford.canAfford) {
      throw new Error(`Insufficient fee tokens. Required: ${canAfford.requiredFee}, Balance: ${canAfford.userBalance}`);
    }

    if (!canAfford.hasAllowance) {
      throw new Error('Must approve fee tokens first. Call approveExitFee()');
    }

    const to = recipient || userAddress;
    const l1Gas = 200000;

    // Handle ETH withdrawals
    const value = l2TokenAddress === '0x4200000000000000000000000000000000000006' ? amount : 0;

    return await this.exitFeeContract.payAndWithdraw(
      l2TokenAddress,
      amount,
      l1Gas,
      '0x', // No additional data
      { value }
    );
  }
}
```

### 3. Exit Fee AltL1 Implementation

```typescript
class DiscretionaryExitFeeAltL1 {
  private l2Signer: ethers.Signer;
  private exitFeeContract: ethers.Contract;
  private billingContract: ethers.Contract;

  constructor(
    l2Signer: ethers.Signer,
    exitFeeAddress: string,
    billingAddress: string
  ) {
    this.l2Signer = l2Signer;

    this.exitFeeContract = new ethers.Contract(
      exitFeeAddress,
      discretionaryExitFeeAltL1ABI,
      l2Signer
    );

    this.billingContract = new ethers.Contract(
      billingAddress,
      l2BillingContractABI,
      l2Signer.provider
    );
  }

  async getExitFeeInNativeToken(): Promise<ethers.BigNumber> {
    return await this.billingContract.exitFee();
  }

  async payAndWithdrawBOBA(
    amount: ethers.BigNumber,
    recipient?: string
  ): Promise<ethers.TransactionResponse> {
    const exitFee = await this.getExitFeeInNativeToken();
    const totalValue = amount.add(exitFee);

    // Check user has enough BOBA (including fee)
    const userBalance = await this.l2Signer.getBalance();
    if (userBalance.lt(totalValue)) {
      throw new Error(`Insufficient BOBA. Required: ${totalValue}, Balance: ${userBalance}`);
    }

    const userAddress = await this.l2Signer.getAddress();
    const to = recipient || userAddress;
    const l1Gas = 200000;
    const L2_BOBA_ALT_L1 = '0x4200000000000000000000000000000000000006'; // Network-specific

    return await this.exitFeeContract.payAndWithdraw(
      L2_BOBA_ALT_L1,
      amount, // Net withdrawal amount
      l1Gas,
      '0x',
      { value: totalValue } // amount + fee
    );
  }

  async payAndWithdrawERC20(
    l2TokenAddress: string,
    amount: ethers.BigNumber,
    recipient?: string
  ): Promise<ethers.TransactionResponse> {
    const exitFee = await this.getExitFeeInNativeToken();

    // Check user has enough native tokens for fee
    const userBalance = await this.l2Signer.getBalance();
    if (userBalance.lt(exitFee)) {
      throw new Error(`Insufficient native tokens for fee. Required: ${exitFee}, Balance: ${userBalance}`);
    }

    // Check user has enough ERC20 tokens
    const tokenContract = new ethers.Contract(l2TokenAddress, erc20ABI, this.l2Signer);
    const tokenBalance = await tokenContract.balanceOf(await this.l2Signer.getAddress());
    if (tokenBalance.lt(amount)) {
      throw new Error(`Insufficient token balance. Required: ${amount}, Balance: ${tokenBalance}`);
    }

    const userAddress = await this.l2Signer.getAddress();
    const to = recipient || userAddress;
    const l1Gas = 200000;

    return await this.exitFeeContract.payAndWithdraw(
      l2TokenAddress,
      amount,
      l1Gas,
      '0x',
      { value: exitFee } // Only the fee, not the withdrawal amount
    );
  }
}
```

### 4. Exit Burn Implementation

```typescript
class DiscretionaryExitBurn {
  private l2Signer: ethers.Signer;
  private exitBurnContract: ethers.Contract;

  constructor(l2Signer: ethers.Signer, exitBurnAddress: string) {
    this.l2Signer = l2Signer;

    this.exitBurnContract = new ethers.Contract(
      exitBurnAddress,
      discretionaryExitBurnABI,
      l2Signer
    );
  }

  async getExtraGasRelay(): Promise<number> {
    return await this.exitBurnContract.extraGasRelay();
  }

  async burnAndWithdraw(
    l2TokenAddress: string,
    amount: ethers.BigNumber,
    recipient?: string
  ): Promise<ethers.TransactionResponse> {
    const extraGasRelay = await this.getExtraGasRelay();
    const baseGasLimit = 100000; // Estimated base gas for withdrawal
    const totalGasLimit = baseGasLimit + extraGasRelay + 50000; // Safety margin

    const userAddress = await this.l2Signer.getAddress();
    const to = recipient || userAddress;
    const l1Gas = 200000;

    // Handle ETH withdrawals
    const value = l2TokenAddress === '0x4200000000000000000000000000000000000006' ? amount : 0;

    return await this.exitBurnContract.burnAndWithdraw(
      l2TokenAddress,
      amount,
      l1Gas,
      '0x',
      {
        value,
        gasLimit: totalGasLimit // Important: Include gas for burning
      }
    );
  }

  async estimateGasCost(
    l2TokenAddress: string,
    amount: ethers.BigNumber
  ): Promise<{
    estimatedGas: ethers.BigNumber;
    gasBurnAmount: number;
    totalGasCost: ethers.BigNumber;
  }> {
    const extraGasRelay = await this.getExtraGasRelay();

    try {
      const estimatedGas = await this.exitBurnContract.estimateGas.burnAndWithdraw(
        l2TokenAddress,
        amount,
        200000,
        '0x',
        { value: l2TokenAddress === '0x4200000000000000000000000000000000000006' ? amount : 0 }
      );

      const gasPrice = await this.l2Signer.getGasPrice();
      const totalGasCost = estimatedGas.mul(gasPrice);

      return {
        estimatedGas,
        gasBurnAmount: extraGasRelay,
        totalGasCost
      };
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }
}
```

## Backend Integration Examples

### 1. Exit Fee Revenue Tracking

```typescript
class ExitFeeAnalytics {
  private l2Provider: ethers.providers.Provider;
  private billingContract: ethers.Contract;
  private exitFeeContract: ethers.Contract;

  constructor(l2Provider: ethers.providers.Provider, contracts: {
    billing: string;
    exitFee: string;
  }) {
    this.l2Provider = l2Provider;

    this.billingContract = new ethers.Contract(
      contracts.billing,
      l2BillingContractABI,
      l2Provider
    );

    this.exitFeeContract = new ethers.Contract(
      contracts.exitFee,
      discretionaryExitFeeABI,
      l2Provider
    );
  }

  async trackFeeCollection(fromBlock: number, toBlock: number): Promise<{
    totalFeesCollected: ethers.BigNumber;
    totalWithdrawals: number;
    uniqueUsers: Set<string>;
    averageFeePerWithdrawal: ethers.BigNumber;
  }> {
    // Get CollectFee events from billing contract
    const collectFeeFilter = this.billingContract.filters.CollectFee();
    const collectFeeEvents = await this.billingContract.queryFilter(
      collectFeeFilter,
      fromBlock,
      toBlock
    );

    // Get WithdrawalInitiated events from exit fee contract
    const withdrawalFilter = this.exitFeeContract.filters.WithdrawalInitiated();
    const withdrawalEvents = await this.exitFeeContract.queryFilter(
      withdrawalFilter,
      fromBlock,
      toBlock
    );

    let totalFeesCollected = ethers.BigNumber.from(0);
    const uniqueUsers = new Set<string>();

    for (const event of collectFeeEvents) {
      totalFeesCollected = totalFeesCollected.add(event.args.amount);
      uniqueUsers.add(event.args.user.toLowerCase());
    }

    const averageFeePerWithdrawal = withdrawalEvents.length > 0
      ? totalFeesCollected.div(withdrawalEvents.length)
      : ethers.BigNumber.from(0);

    return {
      totalFeesCollected,
      totalWithdrawals: withdrawalEvents.length,
      uniqueUsers,
      averageFeePerWithdrawal
    };
  }

  async monitorFeeCollection(): Promise<void> {
    const collectFeeFilter = this.billingContract.filters.CollectFee();

    this.billingContract.on(collectFeeFilter, (user: string, amount: ethers.BigNumber, event) => {
      console.log(`Fee collected: ${ethers.utils.formatUnits(amount, 18)} from ${user}`);

      // Store in database
      this.storeFeeCollection({
        user,
        amount: amount.toString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Date.now()
      });
    });
  }

  private async storeFeeCollection(data: {
    user: string;
    amount: string;
    blockNumber: number;
    transactionHash: string;
    timestamp: number;
  }): Promise<void> {
    // Implement database storage
    console.log('Storing fee collection:', data);
  }
}
```

### 2. Unified Withdrawal Monitor

```typescript
class UnifiedWithdrawalMonitor {
  private l2Provider: ethers.providers.Provider;
  private l1Provider: ethers.providers.Provider;
  private messenger: CrossChainMessenger;
  private contracts: {
    l2StandardBridge: ethers.Contract;
    exitFee: ethers.Contract;
    exitFeeAltL1: ethers.Contract;
    exitBurn: ethers.Contract;
    l1StandardBridge: ethers.Contract;
  };

  constructor(
    l2Provider: ethers.providers.Provider,
    l1Provider: ethers.providers.Provider,
    contractAddresses: any
  ) {
    this.l2Provider = l2Provider;
    this.l1Provider = l1Provider;

    this.messenger = new CrossChainMessenger({
      l1SignerOrProvider: l1Provider,
      l2SignerOrProvider: l2Provider,
      l1ChainId: 56, // BSC
    });

    // Initialize all contracts
    this.contracts = {
      l2StandardBridge: new ethers.Contract(
        contractAddresses.l2StandardBridge,
        l2StandardBridgeABI,
        l2Provider
      ),
      exitFee: new ethers.Contract(
        contractAddresses.exitFee,
        discretionaryExitFeeABI,
        l2Provider
      ),
      exitFeeAltL1: new ethers.Contract(
        contractAddresses.exitFeeAltL1,
        discretionaryExitFeeAltL1ABI,
        l2Provider
      ),
      exitBurn: new ethers.Contract(
        contractAddresses.exitBurn,
        discretionaryExitBurnABI,
        l2Provider
      ),
      l1StandardBridge: new ethers.Contract(
        contractAddresses.l1StandardBridge,
        l1StandardBridgeABI,
        l1Provider
      )
    };
  }

  async monitorAllWithdrawalTypes(): Promise<void> {
    // Monitor standard withdrawals
    const standardFilter = this.contracts.l2StandardBridge.filters.WithdrawalInitiated();
    this.contracts.l2StandardBridge.on(standardFilter, (l1Token, l2Token, from, to, amount, data, event) => {
      this.handleWithdrawalInitiated('STANDARD', {
        l1Token, l2Token, from, to, amount, data,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });

    // Monitor fee-based withdrawals
    const feeFilter = this.contracts.exitFee.filters.WithdrawalInitiated();
    this.contracts.exitFee.on(feeFilter, (l1Token, l2Token, from, to, amount, data, event) => {
      this.handleWithdrawalInitiated('EXIT_FEE', {
        l1Token, l2Token, from, to, amount, data,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });

    // Monitor AltL1 fee withdrawals
    const altL1Filter = this.contracts.exitFeeAltL1.filters.WithdrawalInitiated();
    this.contracts.exitFeeAltL1.on(altL1Filter, (l1Token, l2Token, from, to, amount, data, event) => {
      this.handleWithdrawalInitiated('EXIT_FEE_ALT_L1', {
        l1Token, l2Token, from, to, amount, data,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });

    // Monitor burn withdrawals
    const burnFilter = this.contracts.exitBurn.filters.WithdrawalInitiated();
    this.contracts.exitBurn.on(burnFilter, (l1Token, l2Token, from, to, amount, data, event) => {
      this.handleWithdrawalInitiated('EXIT_BURN', {
        l1Token, l2Token, from, to, amount, data,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });

    // Monitor L1 completions
    const completionFilter = this.contracts.l1StandardBridge.filters.ERC20WithdrawalFinalized();
    this.contracts.l1StandardBridge.on(completionFilter, (l1Token, l2Token, from, to, amount, data, event) => {
      this.handleWithdrawalCompleted({
        l1Token, l2Token, from, to, amount, data,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });
  }

  private async handleWithdrawalInitiated(type: string, data: any): Promise<void> {
    console.log(`${type} withdrawal initiated:`, data);

    // Store initial withdrawal record
    await this.storeWithdrawal({
      ...data,
      type,
      status: 'INITIATED',
      timestamp: Date.now()
    });

    // Start monitoring this specific withdrawal
    this.trackWithdrawalProgress(data.txHash, type);
  }

  private async handleWithdrawalCompleted(data: any): Promise<void> {
    console.log('Withdrawal completed:', data);

    // Update withdrawal record
    await this.updateWithdrawalStatus(data.txHash, 'COMPLETED');
  }

  private async trackWithdrawalProgress(l2TxHash: string, type: string): Promise<void> {
    const checkProgress = async () => {
      try {
        const status = await this.messenger.getMessageStatus(l2TxHash);
        await this.updateWithdrawalStatus(l2TxHash, status);

        if (status === 'RELAYED') {
          console.log(`${type} withdrawal completed: ${l2TxHash}`);
          return; // Stop tracking
        }

        // Continue tracking
        setTimeout(checkProgress, 60000); // Check every minute
      } catch (error) {
        console.error(`Error tracking withdrawal ${l2TxHash}:`, error);
        setTimeout(checkProgress, 300000); // Retry in 5 minutes
      }
    };

    checkProgress();
  }

  private async storeWithdrawal(data: any): Promise<void> {
    // Implement database storage
    console.log('Storing withdrawal:', data);
  }

  private async updateWithdrawalStatus(txHash: string, status: string): Promise<void> {
    // Implement database update
    console.log(`Updating withdrawal ${txHash} status to ${status}`);
  }
}
```

### 3. Health Monitoring System

```typescript
class ExitSystemHealthMonitor {
  private l1Provider: ethers.providers.Provider;
  private l2Provider: ethers.providers.Provider;
  private contracts: any;

  constructor(l1Provider: ethers.providers.Provider, l2Provider: ethers.providers.Provider) {
    this.l1Provider = l1Provider;
    this.l2Provider = l2Provider;

    // Initialize contracts for monitoring
    this.initializeContracts();
  }

  async checkSystemHealth(): Promise<{
    overall: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    components: {
      stateBatches: any;
      messageRelay: any;
      exitFeeSystem: any;
      l1Processing: any;
    };
  }> {
    const [stateBatches, messageRelay, exitFeeSystem, l1Processing] = await Promise.all([
      this.checkStateBatchSubmissions(),
      this.checkMessageRelayActivity(),
      this.checkExitFeeSystem(),
      this.checkL1Processing()
    ]);

    const components = { stateBatches, messageRelay, exitFeeSystem, l1Processing };
    const healthStates = Object.values(components).map(c => c.status);

    let overall: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (healthStates.includes('CRITICAL')) {
      overall = 'CRITICAL';
    } else if (healthStates.includes('WARNING')) {
      overall = 'WARNING';
    }

    return { overall, components };
  }

  private async checkStateBatchSubmissions(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    batchCount24h: number;
    lastBatchTime: number;
    details: string;
  }> {
    const currentBlock = await this.l1Provider.getBlockNumber();
    const fromBlock = currentBlock - 2880; // ~24 hours on BSC

    const stateCommitmentChain = new ethers.Contract(
      '0xeF85fA550e6EC5486121313C895EDe1005e2397f',
      stateCommitmentChainABI,
      this.l1Provider
    );

    const filter = stateCommitmentChain.filters.StateBatchAppended();
    const events = await stateCommitmentChain.queryFilter(filter, fromBlock, currentBlock);

    const batchCount24h = events.length;
    const lastBatchTime = events.length > 0 ? events[events.length - 1].blockNumber : 0;

    const currentTime = await this.l1Provider.getBlock('latest').then(b => b.timestamp);
    const lastBatchTimestamp = await this.l1Provider.getBlock(lastBatchTime).then(b => b.timestamp);
    const timeSinceLastBatch = currentTime - lastBatchTimestamp;

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    let details = `${batchCount24h} batches in 24h, last: ${Math.floor(timeSinceLastBatch / 60)} min ago`;

    if (timeSinceLastBatch > 7200) { // 2 hours
      status = 'CRITICAL';
      details += ' - NO RECENT BATCHES';
    } else if (batchCount24h < 30) { // Expected ~48
      status = 'WARNING';
      details += ' - LOW BATCH FREQUENCY';
    }

    return { status, batchCount24h, lastBatchTime, details };
  }

  private async checkMessageRelayActivity(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    readyMessages: number;
    stuckMessages: number;
    details: string;
  }> {
    // Simplified check - in production, implement proper message status tracking
    const readyMessages = 0; // Would query actual ready messages
    const stuckMessages = 0; // Would check for messages stuck >1 hour

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    let details = `${readyMessages} ready, ${stuckMessages} stuck`;

    if (stuckMessages > 5) {
      status = 'CRITICAL';
      details += ' - MANY STUCK MESSAGES';
    } else if (stuckMessages > 0) {
      status = 'WARNING';
      details += ' - SOME STUCK MESSAGES';
    }

    return { status, readyMessages, stuckMessages, details };
  }

  private async checkExitFeeSystem(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    currentFee: ethers.BigNumber;
    feeCollectionRate: number;
    details: string;
  }> {
    // Check billing contract status
    const billingContract = new ethers.Contract(
      'BILLING_CONTRACT_ADDRESS',
      l2BillingContractABI,
      this.l2Provider
    );

    try {
      const currentFee = await billingContract.exitFee();
      const feeToken = await billingContract.feeTokenAddress();

      // Check recent fee collections
      const currentBlock = await this.l2Provider.getBlockNumber();
      const fromBlock = currentBlock - 1000; // Recent blocks

      const filter = billingContract.filters.CollectFee();
      const events = await billingContract.queryFilter(filter, fromBlock, currentBlock);

      const feeCollectionRate = events.length;

      return {
        status: 'HEALTHY',
        currentFee,
        feeCollectionRate,
        details: `Fee: ${ethers.utils.formatEther(currentFee)} tokens, ${feeCollectionRate} collections recent`
      };
    } catch (error) {
      return {
        status: 'CRITICAL',
        currentFee: ethers.BigNumber.from(0),
        feeCollectionRate: 0,
        details: `Error checking fee system: ${error.message}`
      };
    }
  }

  private async checkL1Processing(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    avgProcessingTime: number;
    recentCompletions: number;
    details: string;
  }> {
    // Check L1 bridge completion rate
    const l1StandardBridge = new ethers.Contract(
      '0x1E0f7f4b2656b14C161f1caDF3076C02908F9ACC',
      l1StandardBridgeABI,
      this.l1Provider
    );

    const currentBlock = await this.l1Provider.getBlockNumber();
    const fromBlock = currentBlock - 1000;

    const filter = l1StandardBridge.filters.ERC20WithdrawalFinalized();
    const events = await l1StandardBridge.queryFilter(filter, fromBlock, currentBlock);

    const recentCompletions = events.length;
    const avgProcessingTime = 7 * 24 * 60 * 60 * 1000; // Approximate 7 days

    return {
      status: 'HEALTHY',
      avgProcessingTime,
      recentCompletions,
      details: `${recentCompletions} recent completions, ~7 day processing`
    };
  }

  private initializeContracts(): void {
    // Initialize contract instances for monitoring
  }
}
```

---

## Integration Checklist

### Frontend Implementation

- [ ] **Standard Withdrawal**: Implement free withdrawal option
- [ ] **Fee-Based Options**: Add premium withdrawal with fee display
- [ ] **User Balance Checks**: Verify sufficient tokens/fees before transaction
- [ ] **Approval Flow**: Handle ERC20 token approvals for fees
- [ ] **Status Tracking**: Monitor withdrawal progress with real-time updates
- [ ] **Error Handling**: Graceful handling of insufficient funds/approvals
- [ ] **Gas Estimation**: Accurate gas estimation for each exit type

### Backend Implementation

- [ ] **Event Monitoring**: Track all withdrawal types and their completion
- [ ] **Fee Analytics**: Revenue tracking and user behavior analysis
- [ ] **Health Monitoring**: System health checks and alerting
- [ ] **Database Integration**: Store withdrawal records and status updates
- [ ] **API Endpoints**: Provide withdrawal status and fee information
- [ ] **Notification System**: Alert users of withdrawal progress
- [ ] **Admin Dashboard**: Monitor system health and fee collection

### Security Considerations

- [ ] **Fee Validation**: Ensure users can't bypass fee payments
- [ ] **Reentrancy Protection**: Secure against reentrancy attacks
- [ ] **Access Controls**: Proper permission checks for admin functions
- [ ] **Rate Limiting**: Prevent spam through gas burning or fees
- [ ] **Error Recovery**: Handle failed transactions gracefully
- [ ] **Monitoring Alerts**: Real-time alerts for system issues

These implementation examples provide a solid foundation for integrating all L2 exit mechanisms into your application stack.
