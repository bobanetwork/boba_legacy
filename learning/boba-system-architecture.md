# Boba Network System Architecture

## System Component Diagram

```mermaid
graph TB
    subgraph "Layer 2 (Boba Network)"
        User[👤 User]
        L2Bridge[L2StandardBridge<br/>0x4200...0010]
        L2CDM[L2CrossDomainMessenger<br/>0x4200...0007]
        L2MP[L2ToL1MessagePasser<br/>0x4200...0000]
        L2Events[L2 Event Logs]

        User --> L2Bridge
        L2Bridge --> L2CDM
        L2CDM --> L2MP
        L2Bridge --> L2Events
        L2CDM --> L2Events
    end

    subgraph "Off-Chain Services"
        DTL[Data Transport Layer]
        L2Ing[L2IngestionService]
        L1Ing[L1IngestionService]
        MsgRelay[MessageRelayerService]
        Subgraph[Subgraph Indexers]

        DTL --> L2Ing
        DTL --> L1Ing
        L2Events --> L2Ing
        L1Events --> L1Ing
        L2Ing --> MsgRelay
        L1Ing --> MsgRelay
        L2Events --> Subgraph
        L1Events --> Subgraph
    end

    subgraph "Layer 1 (BSC)"
        Sequencer[Sequencer Service]
        SCC[StateCommitmentChain<br/>0xeF85...97f]
        L1CDM[L1CrossDomainMessenger<br/>0x3133...1ae]
        L1Bridge[L1StandardBridge<br/>0x1E0f...ACC]
        L1MMR[L1MultiMessageRelayerFast]
        L1Events[L1 Event Logs]

        Sequencer --> SCC
        SCC --> L1Events
        MsgRelay --> L1CDM
        MsgRelay --> L1MMR
        L1MMR --> L1CDM
        L1CDM --> L1Bridge
        L1CDM --> L1Events
        L1Bridge --> User
    end

    classDef l2Contract fill:#e1f5fe
    classDef l1Contract fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef user fill:#fff3e0

    class L2Bridge,L2CDM,L2MP l2Contract
    class SCC,L1CDM,L1Bridge,L1MMR l1Contract
    class DTL,L2Ing,L1Ing,MsgRelay,Subgraph,Sequencer service
    class User user
```

## Service Dependencies

```mermaid
graph LR
    subgraph "Critical Path Dependencies"
        Seq[Sequencer] --> SCC[StateCommitmentChain]
        SCC --> FPW[7-Day Fraud Proof Window]
        FPW --> MR[Message Relayer]
        MR --> L1CDM[L1CrossDomainMessenger]
        L1CDM --> L1B[L1StandardBridge]
        L1B --> Complete[Withdrawal Complete]
    end

    subgraph "Supporting Services"
        DTL[Data Transport Layer] --> MR
        Sub[Subgraph] --> Monitor[Monitoring]
        RPC1[L2 RPC] --> MR
        RPC2[L1 RPC BSC] --> MR
        Gas[Gas Funds] --> MR
    end

    classDef critical fill:#ffcdd2
    classDef support fill:#c8e6c9

    class Seq,SCC,FPW,MR,L1CDM,L1B critical
    class DTL,Sub,RPC1,RPC2,Gas support
```

## Data Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant L2B as L2StandardBridge
    participant L2C as L2CrossDomainMessenger
    participant L2M as L2ToL1MessagePasser
    participant DTL as Data Transport Layer
    participant SEQ as Sequencer
    participant SCC as StateCommitmentChain
    participant REL as Message Relayer
    participant L1C as L1CrossDomainMessenger
    participant L1B as L1StandardBridge

    Note over U,L1B: Phase 1: L2 Withdrawal Initiation
    U->>L2B: withdraw(token, amount)
    L2B->>L2B: burn tokens
    L2B->>L2C: sendCrossDomainMessage()
    L2C->>L2M: passMessageToL1()
    L2B-->>DTL: WithdrawalInitiated event

    Note over U,L1B: Phase 2: State Commitment
    SEQ->>SCC: appendStateBatch()
    SCC-->>DTL: StateBatchAppended event
    Note over SCC: Start 7-day fraud proof window

    Note over U,L1B: Phase 3: Wait Period (7 days)
    DTL->>REL: Monitor withdrawal status
    REL->>REL: Wait for fraud proof window

    Note over U,L1B: Phase 4: Message Relay & Finalization
    REL->>L1C: relayMessage(proof)
    L1C->>SCC: verify fraud window expired
    L1C->>SCC: verify state commitment
    L1C->>L1B: finalizeERC20Withdrawal()
    L1B->>U: transfer tokens
```

## Component Responsibilities

| Component                  | Primary Responsibility               | Failure Impact                   |
| -------------------------- | ------------------------------------ | -------------------------------- |
| **L2StandardBridge**       | Initiate withdrawals, burn tokens    | Users can't start withdrawals    |
| **L2CrossDomainMessenger** | Encode cross-domain messages         | Message format errors            |
| **L2ToL1MessagePasser**    | Store message hashes                 | Withdrawal proofs fail           |
| **Sequencer**              | Submit state batches to L1           | No withdrawals can progress      |
| **StateCommitmentChain**   | Store L2 state, enforce fraud window | Withdrawals can't be proven      |
| **Data Transport Layer**   | Sync L1/L2 events                    | Services lose visibility         |
| **Message Relayer**        | Process withdrawals after window     | Withdrawals stuck at ready state |
| **L1CrossDomainMessenger** | Verify and execute withdrawals       | Final step fails                 |
| **L1StandardBridge**       | Release tokens to users              | Users don't receive funds        |

## Monitoring Points

### Critical Health Checks

1. **State Batch Frequency**
   
   - Monitor: `StateBatchAppended` events on StateCommitmentChain
   - Alert: No batches for > 1 hour
   - Contract: `0xeF85fA550e6EC5486121313C895EDe1005e2397f`

2. **Message Relayer Activity**
   
   - Monitor: `RelayedMessage` events on L1CrossDomainMessenger
   - Alert: No relays for ready messages
   - Contract: `0x31338a7D5d123E18a9a71447136B54B6D28241ae`

3. **Service Uptime**
   
   - Monitor: DTL L1/L2 ingestion services
   - Monitor: Message relayer service
   - Alert: Process not running

### Performance Metrics

- **Average Withdrawal Time**: Should be ~7 days
- **State Batch Interval**: Should be ~30 minutes
- **Message Processing Lag**: Should be <1 hour after fraud window
- **Failed Relay Rate**: Should be <1%

## Configuration Overview

### Boba BNB Network Settings

```yaml
Network: Boba BNB (Chain ID: 56288)
L1 Network: BSC (Chain ID: 56)
Fraud Proof Window: 604800 seconds (7 days)
Sequencer Publish Window: 1800 seconds (30 minutes)

Key Contracts:
  L2StandardBridge: 0x4200000000000000000000000000000000000010
  L1StandardBridge: 0x1E0f7f4b2656b14C161f1caDF3076C02908F9ACC
  StateCommitmentChain: 0xeF85fA550e6EC5486121313C895EDe1005e2397f
  L1CrossDomainMessenger: 0x31338a7D5d123E18a9a71447136B54B6D28241ae
```

## Troubleshooting Decision Tree

```mermaid
flowchart TD
    Start[Withdrawal Taking >7 Days] --> Check1{Recent StateBatchAppended events?}

    Check1 -->|No| Seq[Sequencer Issue<br/>Check sequencer service]
    Check1 -->|Yes| Check2{Message status READY_FOR_RELAY?}

    Check2 -->|No| State[State not committed yet<br/>Wait for next batch]
    Check2 -->|Yes| Check3{Recent RelayedMessage events?}

    Check3 -->|No| Relay[Message Relayer Issue<br/>Check relayer service]
    Check3 -->|Yes| Check4{Transaction successful?}

    Check4 -->|No| Gas[Gas/RPC Issue<br/>Check funds & connectivity]
    Check4 -->|Yes| Complete[Check user received tokens<br/>May be display issue]

    Seq --> Fix1[Restart sequencer<br/>Check BSC connectivity]
    Relay --> Fix2[Restart message relayer<br/>Check configuration]
    Gas --> Fix3[Fund relayer wallet<br/>Check BSC RPC]
```

---

This architecture documentation provides a complete technical overview of how all the components work together in the Boba Network withdrawal system.
