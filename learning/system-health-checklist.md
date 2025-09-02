# Boba Network System Health Checklist

## 🔍 Daily Health Checks

Use this checklist to verify the Boba Network withdrawal system is operating normally.

### ✅ 1. State Batch Submissions (Critical)

**Check**: Recent `StateBatchAppended` events on StateCommitmentChain

```bash
# Query last 24 hours of state batches
CONTRACT=0xeF85fA550e6EC5486121313C895EDe1005e2397f
TOPIC=0x16be4c5129a4e03cf3350262e181dc02ddfb4a6008d925368c0899fcd97ca9c5

curl -s "https://api.bscscan.com/api?module=logs&action=getLogs&address=$CONTRACT&topic0=$TOPIC&fromBlock=latest-2880" | jq '.result | length'
```

**Expected**: 40-50 events per day (~every 30 minutes)
- ✅ **Good**: >30 events/day
- ⚠️ **Warning**: 15-30 events/day
- 🔴 **Critical**: <15 events/day

### ✅ 2. Message Relayer Activity

**Check**: Recent `RelayedMessage` events on L1CrossDomainMessenger

```bash
# Check for recent message relays
CONTRACT=0x31338a7D5d123E18a9a71447136B54B6D28241ae
TOPIC=0x4641df4a962071e12719d8c8c8e5ac7fc4d97b927346a3d7a335b1f7517e133c

curl -s "https://api.bscscan.com/api?module=logs&action=getLogs&address=$CONTRACT&topic0=$TOPIC&fromBlock=latest-1440" | jq '.result | length'
```

**Expected**: Varies based on withdrawal volume
- ✅ **Good**: Any recent activity if withdrawals pending
- 🔴 **Critical**: No activity with known pending withdrawals >7 days old

### ✅ 3. Service Status

**Check**: All critical services are running

```bash
# System services
systemctl is-active boba-sequencer
systemctl is-active message-relayer
systemctl is-active data-transport-layer-l1
systemctl is-active data-transport-layer-l2

# Process check
ps aux | grep -E "(sequencer|message-relayer|data-transport)" | grep -v grep
```

**Expected**: All services showing `active (running)`

### ✅ 4. Relayer Wallet Balance

**Check**: Message relayer has sufficient gas funds

```bash
# Check relayer balance (replace with actual relayer address)
RELAYER_ADDRESS=0x...
curl -s -X POST https://bsc-dataseed.binance.org \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$RELAYER_ADDRESS\",\"latest\"],\"id\":1}" \
  | jq -r '.result' | xargs printf "%d\n" | awk '{printf "%.4f BNB\n", $1/1e18}'
```

**Expected**: >0.1 BNB
- ✅ **Good**: >0.5 BNB
- ⚠️ **Warning**: 0.1-0.5 BNB
- 🔴 **Critical**: <0.1 BNB

### ✅ 5. RPC Connectivity

**Check**: Both L1 and L2 RPC endpoints responding

```bash
# Test L2 RPC (Boba BNB)
curl -s -X POST https://bnb.boba.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq -r '.result'

# Test L1 RPC (BSC)
curl -s -X POST https://bsc-dataseed.binance.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq -r '.result'
```

**Expected**: Both return hex block numbers

## 📊 Weekly Health Report

### Metrics to Track

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Average Withdrawal Time | ~7 days | _____ | _____ |
| State Batch Frequency | ~30 min | _____ | _____ |
| Message Relay Success Rate | >99% | _____ | _____ |
| Service Uptime | >99.9% | _____ | _____ |
| Failed Transaction Rate | <1% | _____ | _____ |

### Performance Queries

**Average Withdrawal Time**:
```sql
-- Query your monitoring database
SELECT AVG(completion_time - initiation_time) as avg_withdrawal_time
FROM withdrawals
WHERE completed_at > NOW() - INTERVAL '7 days';
```

**State Batch Frequency**:
```bash
# Get average time between state batches
curl -s "https://api.bscscan.com/api?module=logs&action=getLogs&address=0xeF85fA550e6EC5486121313C895EDe1005e2397f&topic0=0x16be4c5129a4e03cf3350262e181dc02ddfb4a6008d925368c0899fcd97ca9c5&fromBlock=latest-10080" \
  | jq '.result | length'
# Should be ~336 events (1 per 30 min for 7 days)
```

## 🚨 Alert Thresholds

### Critical Alerts (Page Immediately)

- **No state batches for >2 hours**
- **Message relayer service down**
- **Relayer balance <0.05 BNB**
- **>10% transaction failure rate**
- **Multiple services down simultaneously**

### Warning Alerts (Investigate Within 4 Hours)

- **State batch frequency <1 per hour**
- **Relayer balance <0.2 BNB**
- **Service restart required**
- **RPC latency >5 seconds**
- **Withdrawal queue backlog growing**

### Info Alerts (Monitor Trends)

- **Average withdrawal time >7.5 days**
- **Gas price spikes**
- **Network congestion indicators**
- **Database size growth**

## 🛠️ Quick Fixes Reference

### Common Issues & Immediate Actions

**Issue**: No recent state batches
```bash
# Check sequencer status
systemctl status boba-sequencer
journalctl -u boba-sequencer -f

# Restart if needed
systemctl restart boba-sequencer
```

**Issue**: Messages not being relayed
```bash
# Check message relayer
systemctl status message-relayer
journalctl -u message-relayer -f

# Check configuration
cat /etc/message-relayer/config.json

# Restart if needed
systemctl restart message-relayer
```

**Issue**: Low gas balance
```bash
# Fund relayer wallet immediately
# Send 1+ BNB to relayer address
# Monitor transaction confirmation
```

**Issue**: Service crashes
```bash
# Check logs for errors
journalctl -u <service-name> --since "1 hour ago"

# Check disk space
df -h

# Check memory usage
free -h

# Restart service
systemctl restart <service-name>
```

## 📈 Monitoring Setup

### Essential Dashboards

1. **System Overview**
   - Service status lights
   - Current withdrawal queue size
   - Average processing times
   - Error rates

2. **Blockchain Metrics**
   - State batch frequency
   - Message relay rate
   - Gas price trends
   - Block confirmation times

3. **Infrastructure Health**
   - Service uptime
   - Resource utilization
   - Network connectivity
   - Database performance

### Key Alerts Configuration

```yaml
# Example Prometheus alerts
groups:
- name: boba_withdrawal_system
  rules:
  - alert: NoStateBatches
    expr: time() - last_state_batch_timestamp > 7200  # 2 hours
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: "No state batches submitted for 2+ hours"

  - alert: MessageRelayerDown
    expr: up{job="message-relayer"} == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Message relayer service is down"

  - alert: LowRelayerBalance
    expr: relayer_balance_bnb < 0.1
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: "Relayer wallet balance critically low"
```

## 📋 Incident Response Playbook

### 1. Initial Response (0-5 minutes)
- [ ] Confirm alert accuracy
- [ ] Check system health dashboard
- [ ] Identify affected components
- [ ] Notify relevant team members

### 2. Assessment (5-15 minutes)
- [ ] Run health checklist
- [ ] Check service logs
- [ ] Identify root cause
- [ ] Estimate impact and timeline

### 3. Mitigation (15+ minutes)
- [ ] Apply immediate fixes
- [ ] Monitor recovery progress
- [ ] Update stakeholders
- [ ] Document actions taken

### 4. Recovery Verification
- [ ] Confirm all services healthy
- [ ] Verify withdrawals processing
- [ ] Check for any backlog
- [ ] Update monitoring

### 5. Post-Incident
- [ ] Document lessons learned
- [ ] Update procedures if needed
- [ ] Implement preventive measures
- [ ] Schedule follow-up review

---

## 📝 Health Check Log Template

```
Date: ___________
Operator: ___________

[ ] State batches: _____ events in last 24h
[ ] Message relays: _____ events in last 12h
[ ] All services: _____ active
[ ] Relayer balance: _____ BNB
[ ] RPC connectivity: _____ L1/L2 responding
[ ] Average withdrawal time: _____ days
[ ] Current queue size: _____ pending

Issues identified:
_________________________________

Actions taken:
_________________________________

Next check due: ___________
```

Use this checklist as part of daily operational procedures to maintain system health and catch issues early.
