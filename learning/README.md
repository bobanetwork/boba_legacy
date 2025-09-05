# Boba Network Withdrawal System - Learning Resources

This directory contains comprehensive documentation for understanding and troubleshooting the Boba Network withdrawal system.

## 📚 Documentation Overview

### [Boba Withdrawal Flow Guide](./boba-withdrawal-flow-guide.md)

**The main learning document** - Complete technical guide covering:

- System architecture and components
- Step-by-step withdrawal flow
- Smart contract interactions
- Service dependencies
- Code references and configuration

### [System Architecture](./boba-system-architecture.md)

**Visual system overview** - Diagrams and architecture documentation:

- Component relationship diagrams
- Service dependency maps
- Data flow sequences
- Monitoring points and health checks

### [Troubleshooting Guide](./withdrawal-troubleshooting-guide.md)

**Operational troubleshooting** - Practical diagnostic procedures:

- Quick diagnosis checklist
- Common issues and solutions
- Emergency procedures
- Monitoring setup recommendations

### [L2 Exit Mechanisms](./l2Exits/)

**Alternative withdrawal methods** - Fee-based exit systems:

- Discretionary exit fees and billing systems
- Gas burning mechanisms for spam prevention
- Complete flow analysis for all exit types
- Implementation examples and troubleshooting

## 🎯 Quick Start

### For Developers

1. Read the [Withdrawal Flow Guide](./boba-withdrawal-flow-guide.md) to understand the complete system
2. Review the [System Architecture](./boba-system-architecture.md) for component relationships
3. Study the code references in `packages/contracts/` and `packages/message-relayer/`

### For Operators

1. Use the [Troubleshooting Guide](./withdrawal-troubleshooting-guide.md) for immediate issues
2. Set up monitoring based on the [System Architecture](./boba-system-architecture.md) metrics
3. Keep the [Quick Reference Commands](./withdrawal-troubleshooting-guide.md#quick-reference-commands) handy

## 🔍 Current Issue: 17-Day Withdrawal Delays

If you're here because of the withdrawal delay issue, start with:

1. **[Troubleshooting Checklist](./withdrawal-troubleshooting-guide.md#quick-diagnosis-checklist)** - Systematic diagnosis
2. **[State Batch Check](./withdrawal-troubleshooting-guide.md#1-check-state-batch-submissions)** - Most likely issue
3. **[Message Relayer Status](./withdrawal-troubleshooting-guide.md#2-verify-message-relayer-status)** - Second most likely

## 📋 Key Information Summary

### Normal Operation

- **Expected withdrawal time**: ~7 days
- **Fraud proof window**: 604,800 seconds (exactly 7 days)
- **State batch frequency**: Every ~30 minutes
- **Message processing**: <1 hour after fraud window expires

### Critical Services (Boba BNB)

- **StateCommitmentChain**: `0xeF85fA550e6EC5486121313C895EDe1005e2397f`
- **L1CrossDomainMessenger**: `0x31338a7D5d123E18a9a71447136B54B6D28241ae`
- **L1StandardBridge**: `0x1E0f7f4b2656b14C161f1caDF3076C02908F9ACC`
- **L2StandardBridge**: `0x4200000000000000000000000000000000000010`

### Service Stack

```
User Withdrawal (L2)
    ↓
L2StandardBridge → L2CrossDomainMessenger → L2ToL1MessagePasser
    ↓
Data Transport Layer (monitors events)
    ↓
Sequencer → StateCommitmentChain (L1)
    ↓
[7-day fraud proof window]
    ↓
Message Relayer → L1CrossDomainMessenger → L1StandardBridge
    ↓
User Receives Tokens (L1)
```

## 🚨 Red Flags (Immediate Investigation Needed)

- No `StateBatchAppended` events for >2 hours
- Multiple withdrawals stuck at `READY_FOR_RELAY` status
- Message relayer service not running
- Relayer wallet balance <0.1 BNB
- > 5% transaction failure rate

## 🛠️ Common Fixes

### Sequencer Issues

```bash
systemctl restart boba-sequencer
tail -f /var/log/boba-sequencer.log
```

### Message Relayer Issues

```bash
systemctl restart message-relayer
# Check relayer wallet balance
# Verify BSC RPC connectivity
```

### Data Transport Layer Issues

```bash
systemctl restart data-transport-layer-l1
systemctl restart data-transport-layer-l2
```

## 📞 Emergency Contacts

- **System Administrator**: Check internal docs for on-call procedures
- **Boba Engineering**: Check internal escalation paths
- **Community Support**: For user-facing issues

## 🔗 Related Resources

### Code Repositories

- `packages/contracts/` - Smart contract implementations
- `packages/message-relayer/` - Message relayer service
- `packages/data-transport-layer/` - Event monitoring and sync
- `packages/sdk/` - TypeScript SDK for interacting with the system

### External Resources

- [Boba Network Documentation](https://docs.boba.network)
- [BSCScan](https://bscscan.com) - For L1 transaction monitoring
- [Boba BNB Explorer](https://blockexplorer.bnb.boba.network) - For L2 transaction monitoring

### Monitoring Dashboards

- State Commitment Monitor: Track `StateBatchAppended` events
- Message Relay Monitor: Track `RelayedMessage` events
- Service Health Dashboard: Monitor all critical services
- Gas Price Tracker: Monitor BSC gas costs

---

## 📝 Contributing to Documentation

If you find issues or want to improve this documentation:

1. Update the relevant `.md` files in this directory
2. Test any code examples or procedures
3. Update diagrams if system architecture changes
4. Keep troubleshooting procedures current with operational experience

## 🎯 Learning Path

**Beginner** → Start with [Withdrawal Flow Guide](./boba-withdrawal-flow-guide.md)
**Intermediate** → Study [System Architecture](./boba-system-architecture.md)
**Advanced** → Master [Troubleshooting Guide](./withdrawal-troubleshooting-guide.md)
**Expert** → Contribute improvements to monitoring and automation

Remember: The 7-day withdrawal period is a **security feature**, not a bug. If withdrawals are taking longer, there's an infrastructure issue that needs immediate attention.
