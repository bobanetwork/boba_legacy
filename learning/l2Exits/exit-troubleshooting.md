# Exit Mechanisms Troubleshooting Guide

## Critical Understanding

**All exit mechanisms (standard and fee-based) use identical L1 processing.** If one exit type is experiencing delays, all types will be affected equally. This guide focuses on exit-specific issues, but for 17-day withdrawal delays, use the [main troubleshooting guide](../withdrawal-troubleshooting-guide.md).

## Exit-Specific Issues

### 1. Discretionary Exit Fee Issues

#### Issue: "Billing contract address is not set"

**Symptoms**:
```
Error: Billing contract address is not set
```

**Cause**: The `DiscretionaryExitFee` contract hasn't been properly configured.

**Solution**:
```typescript
// Check billing contract configuration
const exitFeeContract = new ethers.Contract(EXIT_FEE_ADDRESS, exitFeeABI, provider);
const billingAddress = await exitFeeContract.billingContractAddress();

if (billingAddress === ethers.constants.AddressZero) {
  console.log("❌ Billing contract not configured");
  // Owner needs to call configureBillingContractAddress()
}
```

**Fix (Contract Owner)**:
```solidity
// Call this function as contract owner
exitFeeContract.configureBillingContractAddress(BILLING_CONTRACT_ADDRESS);
```

#### Issue: "Insufficient fee tokens"

**Symptoms**:
```
Error: ERC20: transfer amount exceeds balance
Error: ERC20: transfer amount exceeds allowance
```

**Diagnosis**:
```typescript
async function diagnoseFeeTokenIssue(userAddress: string) {
  const billingContract = new ethers.Contract(BILLING_ADDRESS, billingABI, provider);
  const exitFee = await billingContract.exitFee();
  const feeTokenAddress = await billingContract.feeTokenAddress();

  const feeToken = new ethers.Contract(feeTokenAddress, erc20ABI, provider);
  const balance = await feeToken.balanceOf(userAddress);
  const allowance = await feeToken.allowance(userAddress, EXIT_FEE_ADDRESS);

  console.log(`Required fee: ${ethers.utils.formatEther(exitFee)}`);
  console.log(`User balance: ${ethers.utils.formatEther(balance)}`);
  console.log(`User allowance: ${ethers.utils.formatEther(allowance)}`);

  if (balance.lt(exitFee)) {
    console.log("❌ Insufficient token balance");
  }

  if (allowance.lt(exitFee)) {
    console.log("❌ Insufficient token allowance");
  }
}
```

**Solutions**:

1. **Insufficient Balance**: User needs to acquire fee tokens
```typescript
// User needs to get fee tokens (BOBA, etc.)
const requiredTokens = exitFee.sub(currentBalance);
console.log(`Need ${ethers.utils.formatEther(requiredTokens)} more tokens`);
```

2. **Insufficient Allowance**: User needs to approve tokens
```typescript
// Approve fee tokens
const feeToken = new ethers.Contract(feeTokenAddress, erc20ABI, signer);
await feeToken.approve(EXIT_FEE_ADDRESS, exitFee);
```

#### Issue: Fee amount changed during transaction

**Symptoms**:
```
Error: Fee amount has changed
Transaction reverted
```

**Cause**: Fee was updated between transaction preparation and execution.

**Solution**:
```typescript
// Always get fresh fee amount before transaction
async function safePayAndWithdraw(l2Token: string, amount: ethers.BigNumber) {
  const billingContract = new ethers.Contract(BILLING_ADDRESS, billingABI, provider);

  // Get current fee
  const currentFee = await billingContract.exitFee();

  // Check allowance
  const feeToken = new ethers.Contract(
    await billingContract.feeTokenAddress(),
    erc20ABI,
    signer
  );

  const allowance = await feeToken.allowance(
    await signer.getAddress(),
    EXIT_FEE_ADDRESS
  );

  if (allowance.lt(currentFee)) {
    console.log("Updating token approval...");
    await feeToken.approve(EXIT_FEE_ADDRESS, currentFee);
  }

  // Execute withdrawal
  return await exitFeeContract.payAndWithdraw(l2Token, amount, 200000, '0x');
}
```

### 2. Exit Fee AltL1 Issues

#### Issue: "Insufficient Boba amount"

**Symptoms**:
```
Error: Insufficient Boba amount
```

**Cause**: User didn't send enough native tokens to cover both withdrawal amount and fee.

**Diagnosis**:
```typescript
async function diagnoseAltL1Issue(withdrawalAmount: ethers.BigNumber) {
  const exitFee = await billingContract.exitFee();
  const requiredTotal = withdrawalAmount.add(exitFee);
  const userBalance = await signer.getBalance();

  console.log(`Withdrawal amount: ${ethers.utils.formatEther(withdrawalAmount)}`);
  console.log(`Exit fee: ${ethers.utils.formatEther(exitFee)}`);
  console.log(`Total required: ${ethers.utils.formatEther(requiredTotal)}`);
  console.log(`User balance: ${ethers.utils.formatEther(userBalance)}`);

  if (userBalance.lt(requiredTotal)) {
    console.log("❌ Insufficient native token balance");
    console.log(`Need ${ethers.utils.formatEther(requiredTotal.sub(userBalance))} more`);
  }
}
```

**Solution**:
```typescript
// Correct way to call AltL1 exit fee
const exitFee = await billingContract.exitFee();
const totalValue = withdrawalAmount.add(exitFee);

await exitFeeAltL1Contract.payAndWithdraw(
  L2_BOBA_ALT_L1_ADDRESS,
  withdrawalAmount,  // Net amount user receives
  200000,
  '0x',
  { value: totalValue }  // Total sent (withdrawal + fee)
);
```

#### Issue: Wrong token address for AltL1

**Symptoms**:
```
Error: Either Amount Incorrect or Token Address Incorrect
```

**Cause**: Used wrong L2 token address for AltL1 networks.

**Solution**:
```typescript
// Use correct AltL1 addresses
const L2_TOKEN_ADDRESSES = {
  bobaEthereum: {
    ETH: '0x4200000000000000000000000000000000000006',
    BOBA: '0x4200000000000000000000000000000000000023'
  },
  bobaAvalanche: {
    AVAX: '0x4200000000000000000000000000000000000006',
    BOBA: '0x4200000000000000000000000000000000000023'
  },
  bobaFantom: {
    FTM: '0x4200000000000000000000000000000000000006',
    BOBA: '0x4200000000000000000000000000000000000023'
  }
};

// For BOBA withdrawal on Avalanche
const L2_BOBA_ALT_L1 = L2_TOKEN_ADDRESSES.bobaAvalanche.BOBA;
```

### 3. Exit Burn Issues

#### Issue: "Insufficient Gas For a Relay Transaction"

**Symptoms**:
```
Error: Insufficient Gas For a Relay Transaction
```

**Cause**: Not enough gas provided for the burning mechanism.

**Diagnosis**:
```typescript
async function diagnoseGasBurnIssue() {
  const extraGasRelay = await exitBurnContract.extraGasRelay();
  console.log(`Extra gas required: ${extraGasRelay}`);

  // Estimate total gas needed
  const baseGas = 100000; // Estimated withdrawal gas
  const safetyMargin = 50000;
  const totalGasNeeded = baseGas + extraGasRelay + safetyMargin;

  console.log(`Total gas needed: ${totalGasNeeded}`);
  return totalGasNeeded;
}
```

**Solution**:
```typescript
// Provide sufficient gas limit
const extraGasRelay = await exitBurnContract.extraGasRelay();
const gasLimit = 150000 + extraGasRelay; // Base + burn + safety

await exitBurnContract.burnAndWithdraw(
  l2Token,
  amount,
  200000,
  '0x',
  {
    gasLimit: gasLimit,
    gasPrice: await signer.getGasPrice() // Explicit gas price
  }
);
```

#### Issue: Gas burning not working as expected

**Symptoms**: Transaction succeeds but gas consumption lower than expected.

**Diagnosis**:
```typescript
async function checkGasBurning(txHash: string) {
  const receipt = await provider.getTransactionReceipt(txHash);
  const transaction = await provider.getTransaction(txHash);

  console.log(`Gas limit: ${transaction.gasLimit}`);
  console.log(`Gas used: ${receipt.gasUsed}`);
  console.log(`Gas burned: ${transaction.gasLimit.sub(receipt.gasUsed)}`);

  const extraGasRelay = await exitBurnContract.extraGasRelay();
  console.log(`Expected burn: ${extraGasRelay}`);
}
```

**Solution**: Verify `extraGasRelay` configuration:
```typescript
// Check current burn configuration
const currentBurnAmount = await exitBurnContract.extraGasRelay();
console.log(`Current burn amount: ${currentBurnAmount}`);

// Owner can update burn amount
// await exitBurnContract.configureExtraGasRelay(newBurnAmount);
```

### 4. L2BillingContract Issues

#### Issue: "Contract has not been initialized"

**Symptoms**:
```
Error: Contract has not been initialized
```

**Cause**: L2BillingContract not properly initialized.

**Diagnosis**:
```typescript
async function checkBillingContractInit() {
  const feeTokenAddress = await billingContract.feeTokenAddress();
  const owner = await billingContract.owner();
  const exitFee = await billingContract.exitFee();

  console.log(`Fee token: ${feeTokenAddress}`);
  console.log(`Owner: ${owner}`);
  console.log(`Exit fee: ${exitFee}`);

  if (feeTokenAddress === ethers.constants.AddressZero) {
    console.log("❌ Billing contract not initialized");
  }
}
```

**Solution** (Contract Owner):
```typescript
// Initialize billing contract
await billingContract.initialize(
  FEE_TOKEN_ADDRESS,  // e.g., BOBA token address
  L2_FEE_WALLET,      // Wallet to receive fees
  INITIAL_EXIT_FEE    // Initial fee amount (e.g., 10 * 10^18 for 10 tokens)
);
```

#### Issue: Fee withdrawal stuck

**Symptoms**: Collected fees not being withdrawn to fee wallet.

**Diagnosis**:
```typescript
async function checkFeeWithdrawal() {
  const feeToken = await billingContract.feeTokenAddress();
  const balance = await IERC20(feeToken).balanceOf(billingContract.address);
  const minWithdrawal = ethers.utils.parseEther("150"); // 150 tokens minimum

  console.log(`Collected fees: ${ethers.utils.formatEther(balance)}`);
  console.log(`Minimum for withdrawal: ${ethers.utils.formatEther(minWithdrawal)}`);

  if (balance.gte(minWithdrawal)) {
    console.log("✅ Ready for withdrawal");
  } else {
    console.log("⏳ Waiting for more fees");
  }
}
```

**Solution**:
```typescript
// Anyone can trigger withdrawal when threshold met
if (collectedBalance.gte(ethers.utils.parseEther("150"))) {
  await billingContract.withdraw();
}
```

## Common Integration Issues

### 1. Wrong Contract Addresses

**Issue**: Using incorrect contract addresses for different networks.

**Solution**: Maintain network-specific configurations:
```typescript
const NETWORK_CONFIGS = {
  bobaEthereum: {
    l2StandardBridge: '0x4200000000000000000000000000000000000010',
    exitFee: 'NETWORK_SPECIFIC_ADDRESS',
    billing: 'NETWORK_SPECIFIC_ADDRESS'
  },
  bobaBNB: {
    l2StandardBridge: '0x4200000000000000000000000000000000000010',
    exitFee: 'NETWORK_SPECIFIC_ADDRESS',
    billing: 'NETWORK_SPECIFIC_ADDRESS'
  },
  bobaAvalanche: {
    l2StandardBridge: '0x4200000000000000000000000000000000000010',
    exitFeeAltL1: 'NETWORK_SPECIFIC_ADDRESS',
    billing: 'NETWORK_SPECIFIC_ADDRESS'
  }
};

function getContractAddresses(network: string) {
  return NETWORK_CONFIGS[network] || NETWORK_CONFIGS.bobaEthereum;
}
```

### 2. Gas Estimation Errors

**Issue**: Transactions failing due to insufficient gas.

**Solution**: Implement robust gas estimation:
```typescript
async function safeGasEstimate(contract: ethers.Contract, method: string, params: any[]) {
  try {
    const estimated = await contract.estimateGas[method](...params);
    const safeGas = estimated.mul(120).div(100); // 20% buffer
    return safeGas;
  } catch (error) {
    console.warn('Gas estimation failed, using default:', error);
    return ethers.BigNumber.from(300000); // Conservative default
  }
}
```

### 3. Token Approval Race Conditions

**Issue**: Approval transactions conflicting with withdrawal transactions.

**Solution**: Implement proper sequencing:
```typescript
async function sequentialApprovalAndWithdrawal(
  token: ethers.Contract,
  exitContract: ethers.Contract,
  amount: ethers.BigNumber
) {
  // Step 1: Check current allowance
  const currentAllowance = await token.allowance(
    await signer.getAddress(),
    exitContract.address
  );

  // Step 2: Approve if needed
  if (currentAllowance.lt(amount)) {
    console.log('Approving tokens...');
    const approveTx = await token.approve(exitContract.address, amount);
    await approveTx.wait(1); // Wait for confirmation
    console.log('Approval confirmed');
  }

  // Step 3: Execute withdrawal
  console.log('Executing withdrawal...');
  const withdrawTx = await exitContract.payAndWithdraw(/* params */);
  return withdrawTx;
}
```

### 4. Network State Synchronization

**Issue**: Frontend showing outdated fee amounts or contract states.

**Solution**: Implement real-time state updates:
```typescript
class ExitFeeStateManager {
  private billingContract: ethers.Contract;
  private currentFee: ethers.BigNumber;
  private listeners: ((fee: ethers.BigNumber) => void)[] = [];

  constructor(billingContract: ethers.Contract) {
    this.billingContract = billingContract;
    this.startListening();
  }

  private startListening() {
    // Listen for fee updates
    const filter = this.billingContract.filters.UpdateExitFee();
    this.billingContract.on(filter, (newFee: ethers.BigNumber) => {
      this.currentFee = newFee;
      this.notifyListeners(newFee);
    });

    // Periodically refresh fee
    setInterval(async () => {
      try {
        const latestFee = await this.billingContract.exitFee();
        if (!latestFee.eq(this.currentFee)) {
          this.currentFee = latestFee;
          this.notifyListeners(latestFee);
        }
      } catch (error) {
        console.error('Error refreshing fee:', error);
      }
    }, 60000); // Every minute
  }

  private notifyListeners(fee: ethers.BigNumber) {
    this.listeners.forEach(listener => listener(fee));
  }

  onFeeUpdate(callback: (fee: ethers.BigNumber) => void) {
    this.listeners.push(callback);
  }

  getCurrentFee(): ethers.BigNumber {
    return this.currentFee;
  }
}
```

## Diagnostic Tools

### 1. Exit System Health Check

```typescript
async function runExitSystemDiagnostics() {
  console.log('🔍 Running exit system diagnostics...\n');

  // Check billing contract
  try {
    const feeToken = await billingContract.feeTokenAddress();
    const exitFee = await billingContract.exitFee();
    console.log('✅ Billing contract initialized');
    console.log(`   Fee token: ${feeToken}`);
    console.log(`   Current fee: ${ethers.utils.formatEther(exitFee)}`);
  } catch (error) {
    console.log('❌ Billing contract error:', error.message);
  }

  // Check exit fee contract
  try {
    const billingAddress = await exitFeeContract.billingContractAddress();
    const l2Bridge = await exitFeeContract.l2Bridge();
    console.log('✅ Exit fee contract configured');
    console.log(`   Billing: ${billingAddress}`);
    console.log(`   L2 Bridge: ${l2Bridge}`);
  } catch (error) {
    console.log('❌ Exit fee contract error:', error.message);
  }

  // Check L2 bridge
  try {
    const l1TokenBridge = await l2StandardBridge.l1TokenBridge();
    console.log('✅ L2 Standard Bridge functional');
    console.log(`   L1 Bridge: ${l1TokenBridge}`);
  } catch (error) {
    console.log('❌ L2 Standard Bridge error:', error.message);
  }
}
```

### 2. User Readiness Check

```typescript
async function checkUserReadiness(
  userAddress: string,
  withdrawalAmount: ethers.BigNumber,
  tokenAddress: string
) {
  console.log(`🔍 Checking readiness for user: ${userAddress}\n`);

  const issues: string[] = [];

  // Check token balance
  if (tokenAddress !== ethers.constants.AddressZero) {
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
    const balance = await tokenContract.balanceOf(userAddress);

    if (balance.lt(withdrawalAmount)) {
      issues.push(`Insufficient token balance: ${ethers.utils.formatEther(balance)} < ${ethers.utils.formatEther(withdrawalAmount)}`);
    } else {
      console.log('✅ Sufficient token balance');
    }
  }

  // Check fee tokens
  const exitFee = await billingContract.exitFee();
  const feeTokenAddress = await billingContract.feeTokenAddress();
  const feeToken = new ethers.Contract(feeTokenAddress, erc20ABI, provider);

  const feeBalance = await feeToken.balanceOf(userAddress);
  if (feeBalance.lt(exitFee)) {
    issues.push(`Insufficient fee tokens: ${ethers.utils.formatEther(feeBalance)} < ${ethers.utils.formatEther(exitFee)}`);
  } else {
    console.log('✅ Sufficient fee tokens');
  }

  // Check fee token allowance
  const allowance = await feeToken.allowance(userAddress, exitFeeContract.address);
  if (allowance.lt(exitFee)) {
    issues.push(`Insufficient fee token allowance: ${ethers.utils.formatEther(allowance)} < ${ethers.utils.formatEther(exitFee)}`);
  } else {
    console.log('✅ Sufficient fee token allowance');
  }

  // Check gas balance
  const gasBalance = await provider.getBalance(userAddress);
  const minGas = ethers.utils.parseEther('0.01'); // 0.01 ETH/BNB/etc
  if (gasBalance.lt(minGas)) {
    issues.push(`Low gas balance: ${ethers.utils.formatEther(gasBalance)}`);
  } else {
    console.log('✅ Sufficient gas balance');
  }

  if (issues.length > 0) {
    console.log('\n❌ Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    return false;
  } else {
    console.log('\n✅ User ready for withdrawal');
    return true;
  }
}
```

## Emergency Procedures

### 1. Bypass Fee System (Emergency Only)

If the fee system is broken but L2 bridge works:

```typescript
// Use standard bridge directly
await l2StandardBridge.withdraw(l2Token, amount, l1Gas, '0x');
```

### 2. Manual Fee Collection

If automatic fee collection is broken:

```typescript
// Anyone can trigger fee withdrawal when threshold is met
const balance = await feeToken.balanceOf(billingContract.address);
const minThreshold = ethers.utils.parseEther("150");

if (balance.gte(minThreshold)) {
  await billingContract.withdraw();
}
```

### 3. Update Exit Fees (Owner Only)

```typescript
// Update exit fee if current amount is problematic
await billingContract.updateExitFee(newFeeAmount);
```

---

## Summary

Exit mechanism troubleshooting focuses on:

1. **Contract Configuration**: Ensure all contracts are properly initialized
2. **User Balances**: Verify sufficient tokens, fees, and gas
3. **Allowances**: Check ERC20 token approvals for fee payments
4. **Network State**: Monitor real-time contract state changes
5. **Gas Management**: Handle gas estimation and burning mechanisms

**Remember**: All exit types use the same L1 processing. For 17-day delays, the issue is with L1 infrastructure, not the exit mechanisms themselves. Focus on sequencer, message relayer, and state commitment issues for those problems.
