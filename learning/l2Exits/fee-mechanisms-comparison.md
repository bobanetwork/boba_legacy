# Fee Mechanisms Comparison Guide

## Exit Methods Overview

| Exit Method | Contract | Fee Type | Fee Amount | Processing Time | Use Case |
|-------------|----------|----------|------------|----------------|----------|
| **Standard** | `L2StandardBridge` | None | Free | 7 days | Regular users |
| **Exit Fee** | `DiscretionaryExitFee` | Fee tokens | Configurable | 7 days | Revenue generation |
| **Exit Fee AltL1** | `DiscretionaryExitFeeAltL1` | Native tokens | Configurable | 7 days | Alt L1 networks |
| **Exit Burn** | `DiscretionaryExitBurn` | Gas burning | Variable | 7 days | Spam prevention |

## Detailed Comparison

### 1. Standard Withdrawal (FREE)

```solidity
// L2StandardBridge.sol
function withdraw(address _l2Token, uint256 _amount, uint32 _l1Gas, bytes calldata _data) external
```

**Characteristics**:
- ✅ **Free**: No additional costs beyond gas
- ✅ **Simple**: Direct call to bridge
- ✅ **Standard**: Most common withdrawal method
- ⚠️ **No spam protection**: Vulnerable to low-value spam

**Usage**:
```typescript
await l2StandardBridge.withdraw(tokenAddress, amount, l1Gas, data);
```

### 2. Discretionary Exit Fee

```solidity
// DiscretionaryExitFee.sol
function payAndWithdraw(address _l2Token, uint256 _amount, uint32 _l1Gas, bytes calldata _data) external payable
```

**Characteristics**:
- 💰 **Fee Required**: Pays in designated fee token (usually BOBA)
- 🏦 **Revenue Model**: Generates income for network
- 🛡️ **Spam Protection**: Fee deters small withdrawals
- ⚙️ **Configurable**: Fee amount adjustable by owner

**Fee Structure**:
```solidity
L2BillingContract billingContract = L2BillingContract(billingContractAddress);
uint256 exitFee = billingContract.exitFee();
address feeToken = billingContract.feeTokenAddress();
```

**Usage**:
```typescript
// 1. Check fee requirements
const exitFee = await billingContract.exitFee();
const feeToken = await billingContract.feeTokenAddress();

// 2. Approve fee token
await feeTokenContract.approve(exitFeeContract.address, exitFee);

// 3. Execute withdrawal
await exitFeeContract.payAndWithdraw(l2Token, amount, l1Gas, data);
```

### 3. Discretionary Exit Fee AltL1

```solidity
// DiscretionaryExitFeeAltL1.sol
function payAndWithdraw(address _l2Token, uint256 _amount, uint32 _l1Gas, bytes calldata _data) external payable
```

**Characteristics**:
- 💰 **Native Fee**: Pays fee in native L2 tokens
- 🌐 **Alt L1 Networks**: Designed for Avalanche, Fantom, etc.
- 📉 **Net Amount**: Withdrawal reduced by fee amount
- 💸 **Direct Payment**: Fee included in msg.value

**Fee Calculation**:
```solidity
uint256 exitFee = billingContract.exitFee();
uint256 netAmount = msg.value - exitFee;  // Amount actually withdrawn
```

**Usage**:
```typescript
// For BOBA withdrawal on AltL1
const exitFee = await billingContract.exitFee();
const totalValue = withdrawAmount.add(exitFee);

await exitFeeAltL1Contract.payAndWithdraw(
  L2_BOBA_ALT_L1_ADDRESS,
  withdrawAmount,
  l1Gas,
  data,
  { value: totalValue }
);
```

### 4. Discretionary Exit Burn

```solidity
// DiscretionaryExitBurn.sol
function burnAndWithdraw(address _l2Token, uint256 _amount, uint32 _l1Gas, bytes calldata _data) external payable
```

**Characteristics**:
- 🔥 **Gas Burning**: Consumes extra gas instead of token fees
- 🛡️ **Spam Prevention**: High gas cost deters spam
- ⚙️ **Configurable**: Burn amount set by gas oracle owner
- 💨 **No Revenue**: Gas is consumed, not collected

**Burn Mechanism**:
```solidity
uint256 startingGas = gasleft();
uint256 desiredGasLeft = startingGas.sub(extraGasRelay);
uint256 i;
while (gasleft() > desiredGasLeft) {
    i++;  // Burn gas in loop
}
```

**Usage**:
```typescript
// Higher gas limit required due to burning
const gasLimit = estimatedGas + extraGasRelay;

await exitBurnContract.burnAndWithdraw(
  l2Token,
  amount,
  l1Gas,
  data,
  { gasLimit: gasLimit }
);
```

## Cost Analysis

### Standard Withdrawal
```
Total Cost = L2 Gas + L1 Relay Gas
Example: ~50,000 gas + relayer gas = ~$1-5 USD
```

### Discretionary Exit Fee
```
Total Cost = L2 Gas + Fee Token Cost + L1 Relay Gas
Example: ~80,000 gas + 10 BOBA + relayer gas = ~$10-20 USD
```

### Discretionary Exit Fee AltL1
```
Total Cost = L2 Gas + Native Token Fee + L1 Relay Gas
Example: ~60,000 gas + 5 BOBA + relayer gas = ~$8-15 USD
```

### Discretionary Exit Burn
```
Total Cost = (L2 Gas + Extra Burn Gas) + L1 Relay Gas
Example: ~200,000 gas + relayer gas = ~$5-10 USD
```

## Network-Specific Implementations

### Boba Ethereum (Standard Networks)
- **Standard**: `L2StandardBridge.withdraw()`
- **Fee-Based**: `DiscretionaryExitFee.payAndWithdraw()`
- **Fee Token**: BOBA tokens
- **L1 Network**: Ethereum

### Boba Alternative L1s (Avalanche, Fantom, etc.)
- **Standard**: `L2StandardBridge.withdraw()`
- **Fee-Based**: `DiscretionaryExitFeeAltL1.payAndWithdraw()`
- **Fee Token**: Native L2 BOBA
- **L1 Networks**: Avalanche, Fantom, Moonbeam

### Boba BNB (BSC)
- **Standard**: `L2StandardBridge.withdraw()`
- **Fee-Based**: `DiscretionaryExitFee.payAndWithdraw()`
- **Fee Token**: BOBA tokens
- **L1 Network**: Binance Smart Chain

## Decision Matrix

### When to Use Standard Withdrawal
- ✅ Regular users with no time constraints
- ✅ Cost-sensitive transactions
- ✅ High-value withdrawals where fee % is minimal
- ✅ Development and testing

### When to Use Discretionary Exit Fee
- ✅ Revenue generation for network operations
- ✅ Premium service offering
- ✅ Corporate/institutional users
- ✅ When fee token is readily available

### When to Use Exit Fee AltL1
- ✅ Alternative L1 networks (Avalanche, Fantom)
- ✅ When native token fees are preferred
- ✅ Simplified fee payment model
- ✅ Integration with native token economics

### When to Use Exit Burn
- ✅ Spam prevention without revenue model
- ✅ When token-based fees are not desired
- ✅ Gas-rich environments
- ✅ Research and testing scenarios

## Implementation Considerations

### Frontend Integration Complexity

| Method | Integration Difficulty | Required Checks |
|--------|----------------------|----------------|
| Standard | ⭐ Simple | Balance, gas |
| Exit Fee | ⭐⭐⭐ Moderate | Balance, allowance, fee amount |
| Exit Fee AltL1 | ⭐⭐ Easy | Balance, fee calculation |
| Exit Burn | ⭐⭐ Easy | Gas limit calculation |

### Backend Monitoring Requirements

| Method | Events to Monitor | Revenue Tracking |
|--------|-------------------|------------------|
| Standard | `WithdrawalInitiated` | None |
| Exit Fee | `WithdrawalInitiated`, `CollectFee` | Fee token analytics |
| Exit Fee AltL1 | `WithdrawalInitiated`, fee transfers | Native token analytics |
| Exit Burn | `WithdrawalInitiated` | Gas consumption metrics |

## Performance Characteristics

### Gas Usage Comparison

```typescript
// Approximate gas consumption
const gasUsage = {
  standard: 45000,           // Base withdrawal
  exitFee: 85000,           // Base + fee transfer + approval
  exitFeeAltL1: 55000,      // Base + native transfer
  exitBurn: 45000 + burnAmount // Base + configurable burn
};
```

### Transaction Success Rates

| Method | Typical Success Rate | Common Failures |
|--------|---------------------|-----------------|
| Standard | 99%+ | Insufficient balance |
| Exit Fee | 95%+ | Insufficient fee tokens, allowance |
| Exit Fee AltL1 | 97%+ | Insufficient native tokens |
| Exit Burn | 95%+ | Gas estimation errors |

## Revenue and Analytics

### Fee Collection Analytics

```typescript
// Revenue tracking for fee-based methods
interface FeeAnalytics {
  totalFeesCollected: BigNumber;
  uniqueUsers: number;
  averageFeePerWithdrawal: BigNumber;
  feeTokenDistribution: {
    [token: string]: BigNumber;
  };
}

// Gas burn analytics
interface BurnAnalytics {
  totalGasBurned: BigNumber;
  averageBurnPerWithdrawal: BigNumber;
  spamPreventionEffectiveness: number;
}
```

### Economic Impact Analysis

| Metric | Standard | Exit Fee | Exit Fee AltL1 | Exit Burn |
|--------|----------|----------|----------------|-----------|
| Revenue Generation | ❌ None | ✅ High | ✅ Medium | ❌ None |
| Spam Prevention | ❌ Low | ✅ High | ✅ High | ✅ Medium |
| User Adoption | ✅ High | ⚠️ Medium | ⚠️ Medium | ⚠️ Low |
| Operational Cost | ✅ Low | ⚠️ Medium | ⚠️ Medium | ✅ Low |

## Migration Strategies

### From Standard to Fee-Based

```typescript
// Gradual migration approach
const migrationStrategy = {
  phase1: "Deploy fee contracts alongside standard",
  phase2: "Offer fee-based as premium option",
  phase3: "Increase standard withdrawal gas costs",
  phase4: "Deprecate standard for large amounts"
};
```

### Fee Adjustment Strategies

```typescript
// Dynamic fee adjustment
const feeStrategy = {
  lowUsage: "Reduce fees to encourage adoption",
  highUsage: "Increase fees for revenue optimization",
  spam: "Temporary fee increases during attack",
  maintenance: "Higher fees during maintenance windows"
};
```

---

## Summary

Each exit mechanism serves different purposes:

- **Standard**: Free, simple, universal
- **Exit Fee**: Revenue generation, premium service
- **Exit Fee AltL1**: Alternative L1 network support
- **Exit Burn**: Spam prevention without revenue

**All methods use identical L1 processing**, so infrastructure issues affect all equally. Choose based on business requirements, user base, and revenue models.
