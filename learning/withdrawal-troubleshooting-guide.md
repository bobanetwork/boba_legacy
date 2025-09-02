# Boba Network Withdrawal Troubleshooting Guide

## Quick Diagnosis Checklist

When withdrawals are taking longer than 7 days, follow this systematic approach:

### 🔴 Critical Checks (Do First)

1. **State Batch Submissions** - Are L2 states being committed to L1?
2. **Message Relayer Status** - Is the relayer service running and processing?
3. **Fraud Proof Window** - Has the 7-day period actually expired?
4. **Service Connectivity** - Are all RPC connections healthy?

### 🟡 Secondary Checks

5. **Gas Levels** - Does the relayer have sufficient funds?
6. **Event Indexing** - Are monitoring services working?
7. **Network Congestion** - Are L1 transactions being delayed?

## Detailed Diagnostic Procedures

### 1. Check State Batch Submissions

**Objective**: Verify the sequencer is submitting L2 state to BSC

**Steps**:
```bash
# Query StateCommitmentChain for recent StateBatchAppended events
# Contract: 0xeF85fA550e6EC5486121313C895EDe1005e2397f on BSC

# Check last 24 hours of events
# Expected: Events every ~30 minutes
# Red flag: Gaps > 2 hours between events
```

**Using Web3 CLI**:
```javascript
const stateCommitmentChain = "0xeF85fA550e6EC5486121313C895EDe1005e2397f";
const currentBlock = await provider.getBlockNumber();
const fromBlock = currentBlock - 2880; // ~24 hours on BSC

const events = await provider.getLogs({
  address: stateCommitmentChain,
  topics: ["0x16be4c5129a4e03cf3350262e181dc02ddfb4a6008d925368c0899fcd97ca9c5"], // StateBatchAppended
  fromBlock: fromBlock,
  toBlock: currentBlock
});

console.log(`Found ${events.length} state batches in last 24 hours`);
```

**Interpretation**:
- ✅ **Normal**: 40-50 events per day (every ~30 minutes)
- ⚠️ **Warning**: <20 events per day (gaps > 1 hour)
- 🔴 **Critical**: <5 events per day or no events >4 hours

### 2. Verify Message Relayer Status

**Objective**: Confirm the message relayer is actively processing withdrawals

**Steps**:
```bash
# Check L1CrossDomainMessenger for RelayedMessage events
# Contract: 0x31338a7D5d123E18a9a71447136B54B6D28241ae on BSC

# Look for recent successful message relays
```

**Using Boba SDK**:
```typescript
import { CrossChainMessenger } from '@bobanetwork/sdk';

const messenger = new CrossChainMessenger({
  l1SignerOrProvider: l1Provider,
  l2SignerOrProvider: l2Provider,
  l1ChainId: 56, // BSC
});

// Check specific withdrawal status
const status = await messenger.getMessageStatus(withdrawalTxHash);
console.log('Withdrawal status:', status);

// Possible statuses:
// UNCONFIRMED_L1_TO_L2_MESSAGE - Still processing
// READY_FOR_RELAY - Fraud window expired, ready to relay
// RELAYED - Successfully completed
```

**Interpretation**:
- ✅ **Normal**: Status progresses from UNCONFIRMED → READY_FOR_RELAY → RELAYED
- ⚠️ **Warning**: Stuck at READY_FOR_RELAY for >1 hour
- 🔴 **Critical**: Multiple messages stuck at READY_FOR_RELAY

### 3. Validate Fraud Proof Window

**Objective**: Ensure the 7-day waiting period has actually expired

**Steps**:
```javascript
// For a specific withdrawal, check if fraud proof window has expired
const stateCommitmentChain = new ethers.Contract(
  "0xeF85fA550e6EC5486121313C895EDe1005e2397f",
  stateCommitmentChainABI,
  provider
);

// Get the batch header for the withdrawal's state root
const isInsideWindow = await stateCommitmentChain.insideFraudProofWindow(batchHeader);

if (isInsideWindow) {
  console.log("Still within fraud proof window - withdrawal not yet eligible");
} else {
  console.log("Fraud proof window expired - withdrawal should be processable");
}
```

**Timeline Calculation**:
```javascript
const FRAUD_PROOF_WINDOW = 604800; // 7 days in seconds
const batchTimestamp = batchHeader.extraData; // Decode to get timestamp
const currentTime = Math.floor(Date.now() / 1000);
const windowExpiry = batchTimestamp + FRAUD_PROOF_WINDOW;
const timeRemaining = windowExpiry - currentTime;

if (timeRemaining > 0) {
  console.log(`${Math.floor(timeRemaining / 86400)} days remaining in fraud proof window`);
}
```

### 4. Check Service Connectivity

**Objective**: Verify all critical services can communicate with blockchains

**RPC Health Checks**:
```bash
# Test L2 RPC (Boba BNB)
curl -X POST https://bnb.boba.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test L1 RPC (BSC)
curl -X POST https://bsc-dataseed.binance.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Service Status Checks**:
```bash
# Check if message relayer process is running
ps aux | grep message-relayer

# Check if DTL services are running
ps aux | grep data-transport-layer

# Check service logs for errors
tail -f /var/log/message-relayer.log
tail -f /var/log/data-transport-layer.log
```

### 5. Monitor Gas and Transaction Status

**Objective**: Ensure the relayer has funds and transactions aren't failing

**Gas Balance Check**:
```javascript
const relayerAddress = "0x..."; // Message relayer wallet address
const balance = await provider.getBalance(relayerAddress);
const balanceInBNB = ethers.utils.formatEther(balance);

console.log(`Relayer balance: ${balanceInBNB} BNB`);

// Alert if balance < 0.1 BNB
if (parseFloat(balanceInBNB) < 0.1) {
  console.log("⚠️ Low relayer balance - may cause transaction failures");
}
```

**Recent Transaction Check**:
```javascript
// Check recent transactions from relayer
const recentTxs = await provider.getHistory(relayerAddress, -10); // Last 10 transactions

for (const tx of recentTxs) {
  const receipt = await provider.getTransactionReceipt(tx.hash);
  if (receipt.status === 0) {
    console.log(`❌ Failed transaction: ${tx.hash}`);
    console.log(`Gas used: ${receipt.gasUsed} / ${tx.gasLimit}`);
  }
}
```

## Common Issues and Solutions

### Issue 1: Sequencer Not Submitting State Batches

**Symptoms**:
- No `StateBatchAppended` events for >2 hours
- Withdrawals stuck indefinitely
- L2 appears to be working normally

**Root Causes**:
- Sequencer service crashed or stopped
- BSC RPC connectivity issues
- Insufficient gas funds for sequencer
- BSC network congestion

**Solutions**:
```bash
# 1. Restart sequencer service
systemctl restart boba-sequencer

# 2. Check sequencer logs
tail -f /var/log/boba-sequencer.log

# 3. Verify BSC connectivity
curl -X POST https://bsc-dataseed.binance.org -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 4. Check sequencer wallet balance
# Ensure >1 BNB for gas fees
```

### Issue 2: Message Relayer Not Processing

**Symptoms**:
- Withdrawals stuck at `READY_FOR_RELAY` status
- No `RelayedMessage` events from L1CrossDomainMessenger
- Fraud proof window has expired

**Root Causes**:
- Message relayer service down
- Relayer wallet out of gas
- L1 RPC connection issues
- Incorrect relayer configuration

**Solutions**:
```bash
# 1. Restart message relayer
systemctl restart message-relayer

# 2. Check relayer configuration
cat /etc/message-relayer/config.json

# 3. Fund relayer wallet (needs BNB for BSC gas)
# Send >0.5 BNB to relayer address

# 4. Test manual relay (emergency)
# Use L1CrossDomainMessenger.relayMessage() directly with proper proofs
```

### Issue 3: Data Transport Layer Sync Issues

**Symptoms**:
- Events not being indexed
- Services can't find withdrawal data
- Inconsistent status reporting

**Root Causes**:
- DTL services crashed
- Database corruption
- RPC rate limiting
- Block reorganizations

**Solutions**:
```bash
# 1. Restart DTL services
systemctl restart data-transport-layer-l1
systemctl restart data-transport-layer-l2

# 2. Clear and resync database (if needed)
rm -rf /var/lib/dtl/database
# Service will resync from scratch

# 3. Check for RPC rate limits
# Ensure dedicated RPC endpoints with sufficient rate limits
```

### Issue 4: Gas Price Spikes

**Symptoms**:
- Relayer transactions failing with "out of gas"
- Successful transactions but very slow confirmation
- High transaction costs

**Root Causes**:
- BSC network congestion
- Gas price estimation issues
- Fixed gas limits too low

**Solutions**:
```bash
# 1. Update gas configuration
# Increase gas limit and gas price multiplier in relayer config

# 2. Monitor BSC gas prices
# Use BSCScan gas tracker or web3 gasPrice calls

# 3. Implement dynamic gas pricing
# Update relayer to use current network gas prices
```

## Emergency Procedures

### Manual Withdrawal Processing

If the automated system is down, advanced users can manually process withdrawals:

```typescript
// 1. Get withdrawal message details
const withdrawalMessage = await messenger.getMessageFromL2Tx(l2WithdrawalTx);

// 2. Generate inclusion proof
const proof = await messenger.getMessageProof(withdrawalMessage);

// 3. Call relayMessage directly
const l1CrossDomainMessenger = new ethers.Contract(
  "0x31338a7D5d123E18a9a71447136B54B6D28241ae",
  l1CrossDomainMessengerABI,
  l1Signer
);

const tx = await l1CrossDomainMessenger.relayMessage(
  withdrawalMessage.target,
  withdrawalMessage.sender,
  withdrawalMessage.message,
  withdrawalMessage.messageNonce,
  proof
);

await tx.wait();
```

### Batch Processing for Backlog

Use the batch relayer for multiple stuck withdrawals:

```typescript
// Collect multiple ready withdrawals
const readyWithdrawals = await getReadyWithdrawals();

// Process in batches of 10-20 to avoid gas limits
const batchSize = 15;
const l1MultiMessageRelayer = new ethers.Contract(
  L1_MULTI_MESSAGE_RELAYER_ADDRESS,
  l1MultiMessageRelayerABI,
  l1Signer
);

for (let i = 0; i < readyWithdrawals.length; i += batchSize) {
  const batch = readyWithdrawals.slice(i, i + batchSize);
  await l1MultiMessageRelayer.batchRelayMessages(batch);
}
```

## Monitoring and Alerting Setup

### Key Metrics to Monitor

1. **State Batch Frequency**: Alert if no batches >1 hour
2. **Message Relay Rate**: Alert if ready messages not processed >1 hour
3. **Service Uptime**: Alert if critical services down
4. **Gas Balances**: Alert if relayer balance <0.1 BNB
5. **Transaction Failure Rate**: Alert if >5% of relayer transactions fail

### Recommended Monitoring Stack

```yaml
Metrics Collection:
  - Prometheus + Grafana for service metrics
  - Custom blockchain event monitors
  - RPC endpoint health checks

Alerting:
  - PagerDuty/OpsGenie for critical alerts
  - Slack/Discord for warnings
  - Email for status updates

Logging:
  - Centralized logging (ELK stack)
  - Structured JSON logs
  - Log aggregation from all services
```

---

## Quick Reference Commands

```bash
# Check state batch submissions (last 24h)
curl -X POST https://api.bscscan.com/api \
  -d "module=logs&action=getLogs&address=0xeF85fA550e6EC5486121313C895EDe1005e2397f&topic0=0x16be4c5129a4e03cf3350262e181dc02ddfb4a6008d925368c0899fcd97ca9c5&fromBlock=latest-2880"

# Check relayer balance
curl -X POST https://bsc-dataseed.binance.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["RELAYER_ADDRESS","latest"],"id":1}'

# Service status
systemctl status message-relayer
systemctl status data-transport-layer-l1
systemctl status data-transport-layer-l2
systemctl status boba-sequencer
```

This troubleshooting guide provides systematic approaches to diagnose and resolve withdrawal delays in the Boba Network.
