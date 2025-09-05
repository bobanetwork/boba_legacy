# L2 Exit Mechanisms Documentation

This directory contains comprehensive documentation for **alternative L2 exit mechanisms** in the Boba Network, specifically the fee-based withdrawal systems.

## ?“š Exit Mechanism Types

### Standard Withdrawal (Free)

- **Contract**: `L2StandardBridge.withdraw()`
- **Fee**: None
- **Processing Time**: 7 days (fraud proof window)
- **Documentation**: [Main Withdrawal Guide](../boba-withdrawal-flow-guide.md)

### Fee-Based Exits (Documented Here)

#### 1. Discretionary Exit Fee

- **Contract**: `DiscretionaryExitFee.payAndWithdraw()`
- **Fee**: Configurable fee in fee tokens (typically BOBA)
- **Processing Time**: Still 7 days (same L1 processing)
- **Purpose**: Revenue generation, spam prevention

#### 2. Discretionary Exit Fee (AltL1)

- **Contract**: `DiscretionaryExitFeeAltL1.payAndWithdraw()`
- **Fee**: Configurable fee in native L2 tokens
- **Processing Time**: Still 7 days
- **Purpose**: Alternative L1 network support

#### 3. Discretionary Exit Burn

- **Contract**: `DiscretionaryExitBurn.burnAndWithdraw()`
- **Fee**: Gas burning mechanism
- **Processing Time**: Still 7 days
- **Purpose**: Spam prevention through gas consumption

## ?”„ Important Understanding

**All fee-based exits are wrappers around the standard withdrawal mechanism.** They:

1. **Collect fees** (various mechanisms)
2. **Call the standard** `L2Bridge.withdrawTo()` function
3. **Follow identical L1 processing** (7-day fraud window, message relayer, etc.)

The L1 completion process is **exactly the same** for all withdrawal types.

## ?“‹ Documentation Files

- **[Complete Exit Flow Guide](./complete-exit-flow-guide.md)** - Detailed technical analysis
- **[Fee Mechanisms Comparison](./fee-mechanisms-comparison.md)** - Side-by-side comparison
- **[L1 Processing Guide](./l1-processing-guide.md)** - L1 completion requirements
- **[Implementation Examples](./implementation-examples.md)** - Code examples and usage
- **[Troubleshooting](./exit-troubleshooting.md)** - Common issues and solutions

## ?š¨ Key Point for Current Issues

If you're experiencing withdrawal delays (17+ days), the issue is **NOT** with the exit fee mechanisms themselves. The problem is with the underlying infrastructure:

- Sequencer not submitting state batches
- Message relayer service down
- Data transport layer issues

**All exit types use the same L1 completion pathway**, so delays affect all withdrawal methods equally.

## ?”§ Quick Reference

### Contract Addresses (Network Dependent)

```
DiscretionaryExitFee: [Deployed per network]
DiscretionaryExitFeeAltL1: [Deployed per network]
DiscretionaryExitBurn: [Deployed per network]
L2BillingContract: [Manages fee collection]
```

### Usage Pattern

```solidity
// All exits eventually call:
IL2ERC20Bridge(l2Bridge).withdrawTo(_l2Token, _to, _amount, _l1Gas, _data);

// Which creates the same cross-domain message as standard withdrawals
```

## ?“ˆ Revenue and Analytics

Fee-based exits provide:

- **Revenue stream** for network operations
- **Spam prevention** through cost barriers
- **Usage analytics** for withdrawal patterns
- **Fee flexibility** for different market conditions

---

Start with the [Complete Exit Flow Guide](./complete-exit-flow-guide.md) for technical details.
