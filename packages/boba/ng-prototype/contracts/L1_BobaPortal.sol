//SPDX-License-Identifier: UNLICENSED

pragma solidity >0.7.5;


struct ChainBatchHeader {
  uint256 batchIndex;
  bytes32 batchRoot;
  uint256 batchSize;
  uint256 prevTotalElements;
  bytes extraData;
}

struct ChainInclusionProof {
  uint256 index;
  bytes32[] siblings;
}

struct L2MessageInclusionProof {
  bytes32 stateRoot;
  ChainBatchHeader stateRootBatchHeader;
  ChainInclusionProof stateRootProof;
  bytes stateTrieWitness;
  bytes storageTrieWitness;
}

interface XDM {
  function relayMessage(
      address _target,
      address _sender,
      bytes memory _message,
      uint256 _messageNonce,
      L2MessageInclusionProof memory _proof
  ) external;
}

contract L1_BobaPortal {
  bool isLocked;
  uint64 seq;

  uint64 public lastSeqIn;      // Highest sequence count of any type which has been received
  uint64 public lastSlowNotify; // Seq of highest Slow msg we know about
  uint64 public lastSlowIn;     // Seq of highest Slow msg which has been processed
  uint64 public scanFromL2;     // Block number from which there may be pending Slow messages

  uint64 slowSkippedCount;
  mapping(uint64 => uint256) pendingPayouts;
  mapping(bytes32 => uint256) public slowValidTime; // could pack other fields along with timestamp

  mapping(address=>bool) sysWhitelist;

  uint256 public chainValue;    // Represents ETH value locked in the L2 chain

  uint32 fraud_window = 120;

  uint256 pendingPayoutTotal;
  uint64 public highestL2Block;
  bytes32 highestL2SR;

  uint256 userRelayFee = 100000;
  uint256 healthCheckFee = 100000;
  
  address healthCheckAddress;
  uint256 public healthCheckDeadline;
  bytes32 healthCheckHash;
  
  address owner;
  XDM myXDM;
  XDM fastXDM;

  // The constructor allows the operator to post a bond which is available to support
  // fraud / uptime challenges. For testing it also allows client processes to Exit more
  // funds than have been deposited into the portal (e.g. using oETH from the Optimism
  // standard bridge).
  uint256 operator_bond;
  
  // Rolling hashes
  bytes32 hashOut;
  bytes32 hashIn;
  
  // This is expensive but may be necessary to protect against 51% attacks on the fast-bridge system.
  // Each FastBatchIn must provide a hash value which was previously sent down from L1 to L2. There is
  // presently no way to prune old hashes which are no longer needed, however there is also no way to 
  // control how many messages are in flight L1->L2->L1. 
  mapping (bytes32 => uint256) sentHashes;

  event SysPaid(address, uint);
  event UserRelayedDown(address, address, uint, uint);
  event BobaMsgDown(bytes32 indexed header, bytes32 indexed msg_hash, bytes payload);
  event BobaMsgUp(bytes32 indexed header, bytes32 indexed msg_hash);

  function stats() public view returns (uint64, uint64, uint256, uint64, bytes32)
  {
    return (lastSeqIn, seq, pendingPayoutTotal, highestL2Block, highestL2SR);
  }

  constructor(address L1_CrossDomainAddr, address L1_FastCrossDomainAddr, uint64 l2Deploy)
   payable
 {
    owner = msg.sender;
    highestL2Block = l2Deploy-1; // Hint to where the agent needs to start scanning for Fast L2 events.
    scanFromL2 = l2Deploy - 1;   // Hint for Slow scanner (FIXME - is there a cleaner way to do this?)

    myXDM = XDM(L1_CrossDomainAddr);
    fastXDM = XDM(L1_FastCrossDomainAddr);

    // FIXME - needs a way for operator to reclaim the bond upon some sort of final shutdown
    // of this chain (e.g. if a regenesis deploys a new, incompatible Portal contract).

    operator_bond = msg.value;
    isLocked = false;

    chainValue = msg.value; // FIXME - Remove for production. Hacked to account for oETH minted by legacy Optimism bridge.
    
    hashIn = keccak256("");
    hashOut = keccak256("");
    sentHashes[hashOut] = type(uint256).max; // Avoids an assertion failure when bringing a new system up.
    
    healthCheckDeadline = type(uint256).max;
  }

  function IsActive() public view returns (bool) {
    return (! isLocked);
  }

  function SysMsg(address target, bytes memory payload)
     public payable
  {
    require(block.timestamp < healthCheckDeadline, "System health check failed");
    
    // FIXME - not implemented yet.
    require(true || sysWhitelist[msg.sender], "Not authorized to call SysMsg");

    emit SysPaid(target, msg.value);
    bytes memory sysMsg = abi.encode(target, msg.sender, payload);

    sendDown(1, msg.value, sysMsg);
    chainValue += msg.value;
  }

  function sendDown(uint32 msgType, uint256 L1Value, bytes memory payload)
    internal
  {
    require(L1Value < type(uint160).max, "L1Value too large");
    seq  += 1;

    uint256 mh = (uint256(seq) << 192) | (uint256(msgType) << 160) | L1Value;
    bytes32 msgHash = keccak256(abi.encodePacked(mh,payload));
    hashOut = keccak256(abi.encodePacked(hashOut, msgHash));

    emit BobaMsgDown(bytes32(mh), hashOut, payload);
    sentHashes[hashOut] = mh;
  }

  // "refund" = L2 address who can claim undeliverable messages, possibly recover oETH (?)
  function UserRelayDown(address target, uint l2_gas, address refund, bytes calldata payload)
     public payable
  {
    require(block.timestamp < healthCheckDeadline, "System health check failed");
    
    require (msg.value > userRelayFee, "Insufficient value for userRelayFee");

    emit UserRelayedDown(target, refund, l2_gas, msg.value - userRelayFee);

    chainValue += msg.value - userRelayFee;

    bytes memory userMsg = abi.encode(target, msg.sender, refund, payload);
    sendDown(2, msg.value - userRelayFee, userMsg);
  }

  // Tunnel an Optimism message, bypassing CTC
  function TunnelMsg(bytes memory payload) public {
    require(block.timestamp < healthCheckDeadline, "System health check failed");
    
    sendDown(3, 0, payload);
  }

  function GetSeq() public view returns(uint64) {
    return seq;
  }

  /* Emulate the Optimism standard bridge. */
  function depositETH(uint32 _l2Gas, bytes calldata _data)
     public payable /* onlyEOA() */ {
    require(block.timestamp < healthCheckDeadline, "System health check failed");
    

    require (1 == 0, "Not implemented");
  }

  function FastMsgIn(bytes32 header, uint64 msgSequence, uint32 msgType, uint256 L1Value, bytes calldata payload, bytes memory proofBytes)
    internal
  {
    require(msgSequence == lastSeqIn + 1, "Invalid sequence number");
    lastSeqIn = msgSequence;

    // Used to decode message payloads, when applicable.
    address _target;
    address _sender;
    bytes memory _message;
    uint256 _messageNonce;

    if (msgType == 0x80000001) {
      // System fast message (trusted contracts). FIXME - add _sender validation as in Optimism

      (_target, _sender, _message) = abi.decode(payload,(address,address,bytes));

      (bool ret,) = _target.call(_message);
      require (ret, "FastMsgIn call failed");
    } else if (msgType == 0x80000003) {
      // relay of legacy Optimism msg

      L2MessageInclusionProof memory proof = abi.decode(proofBytes,(L2MessageInclusionProof));

      (_target, _sender, _message, _messageNonce) = abi.decode(payload[4:],(address,address,bytes,uint256));

        fastXDM.relayMessage(_target,_sender,_message,_messageNonce,proof);
    } else if (msgType == 0x80000004) {
      // Health check response

      bytes32 responseHash = abi.decode(payload,(bytes32));
      
      if (responseHash == healthCheckHash) {
        // Success
        healthCheckDeadline = type(uint256).max;
        healthCheckAddress = address(0);
      } else {
        // Debugging
        require(responseHash == healthCheckHash, "healthCheck hash failure");
      }
      
    } else {
      require(false,"Unknown msgType");
    }
    emit BobaMsgUp(header, keccak256(abi.encodePacked(header,payload)));
  }

  /* This is called on the "fast" path with information of a message which will be
     processed after the fraud proof window has passed.
  */
  function SlowMsgNotify(bytes32 header, uint64 msgSequence, uint32 msgType, uint256 L1Value, bytes32 mh)
    internal
  {
    require(msgSequence == lastSeqIn + 1, "Invalid sequence number");
    lastSeqIn = msgSequence;

    // Used to decode message payloads, when applicable.
    address _target;
    address _sender;
    bytes memory _message;
    uint256 _messageNonce;

    // FIXME For a Slow message, record its payout info?

    require(slowValidTime[mh] == 0, "msgHash already registered");
    slowValidTime[mh] = block.timestamp + fraud_window;

    // Calculate the # of fast messages between the last Slow msg and this one. Will be used
    // later to enforce correct ordering when Slow messages are processed.
    uint64 slowSkip = msgSequence - (lastSlowNotify + 1);
    lastSlowNotify = msgSequence;
  }
  event MMDBG_SlowIn1 (uint64 indexed, uint32 indexed, uint256 indexed, address);
  event MMDBG_SlowIn2 (uint256 indexed, bytes);
  event MMDBG_SlowIn3 (uint256 indexed, bytes);

  event MMDBG_L1P (bool indexed, bytes);
  event MMDBG_UserPayResult(uint256 indexed, bool indexed);

  // from OVM_L1StandardBridge
    event ETHDepositInitiated (
      address indexed _from,
      address indexed _to,
      uint256 _amount,
      bytes _data
  );

  event ETHWithdrawalFinalized (
      address indexed _from,
      address indexed _to,
      uint256 _amount,
      bytes _data
  );

  /* This is called to finalize a message after it has gone through the fraud window.  */
  function SlowMsgIn(bytes32 header, uint64 msgSequence, uint32 msgType, uint256 L1Value, bytes calldata payload, bytes memory proofBytes)
    internal
  {
    //emit MMDBG_SlowIn1(msgSequence, msgType, L1Pay, target);

      // Used where applicable to unpack incoming messages
      address _target;
      address _sender;
      address _refund;
      bytes memory _message;
      uint256 _messageNonce;
      uint256 _amount;

    // Validate it by looking up hash & checking sequence gaps.
      require (msgSequence <= lastSeqIn, "Unexpected slowSequenceNumber");
      require (msgSequence > lastSlowIn, "Invalid slowSequenceNumber"); // Can probably remove; should be redundant after other checks.

      lastSlowIn = msgSequence;

    require(L1Value <= chainValue, "L1Value exceeds chainValue");
    chainValue -= L1Value;

    if(msgType == 1 && payload.length > 0) {
      // System message
      (_target, _sender, _amount, _message) = abi.decode(payload,(address,address,uint256,bytes));
      require(_amount <= L1Value, "_amount exceeds L1Value");

      (bool success, ) = _target.call{value: _amount}(_message);

      require (success, "System call failed");
    } else if(msgType == 0x02) {
      // user message w. payment
      (_target, _refund, _amount, _message) = abi.decode(payload,(address,address,uint256,bytes));
      require(_amount <= L1Value, "_amount exceeds L1Value");

      (bool success, ) = _target.call{value: _amount}(_message);
      emit MMDBG_UserPayResult(msgSequence, success);

      if (!success) {
        // FIXME - bounce something back to "refund" address on L2
      }

    } else if(msgType == 3) {
      // relay of legacy Optimism msg
      L2MessageInclusionProof memory proof = abi.decode(proofBytes,(L2MessageInclusionProof));

      bytes memory pX = payload[4:];
      (_target, _sender, _message, _messageNonce) = abi.decode(pX,(address,address,bytes,uint256));

      myXDM.relayMessage(_target,_sender,_message,_messageNonce,proof);

    } else if (msgType == 0x04) {	// FIXME - give this a "payable" flag
      // Emulated SlowExit; pay user and emit message.

      bytes memory _data;
      (_target, _amount, _data) = abi.decode(payload, (address,uint256,bytes));
      require(_amount <= L1Value, "_amount exceeds L1Value");
      require(_amount <= address(this).balance, "_amount exceeds contract balance");
      (bool success, ) = _target.call{value: _amount}("");
      require(success, "ETH transfer failed");
      emit ETHWithdrawalFinalized(_target, _target, _amount, _data);
    }
    uint256 feeCollected = L1Value - _amount; // FIXME - track this
    emit BobaMsgUp(header, keccak256(abi.encodePacked(header,payload)));
  }

  event MMDBG_Batch(uint64 indexed, uint256 indexed, uint32 indexed, bytes);

  function FastBatchIn(uint64 prevBlock, bytes32 prevSR, bytes32 rHash1, bytes32 rHash2, bytes32[] calldata headers, bytes[] calldata bodies, bytes[] calldata proofs)
    public
  {
    require(block.timestamp < healthCheckDeadline, "System health check failed");
    
    require (prevBlock >= highestL2Block, "L2 block number must not decrease");
    if (prevBlock == highestL2Block && highestL2SR != 0) {
      require(prevSR == highestL2SR, "Previous StateRoot does not match");
    }
    
    // Guards against chain rewrites which alter the L1->L2 message sequence.
    require(sentHashes[rHash1] != 0, "Invalid rHash1");

    require (headers.length == bodies.length, "Batch sizes do not match");

    for (uint256 i = 0; i < headers.length; i++) {
      uint256 h2 = uint256(headers[i]);

      uint64 msgSequence = uint64(h2 >> 192);
      uint32 msgType = uint32((h2 >> 160) & 0xFFFFFFFF);
      uint160 L1Value = uint160(h2 & type(uint160).max);

      if(msgType & 0x80000000 != 0) {
        bytes32 msgHash = keccak256(abi.encodePacked(h2,bodies[i]));
        hashIn = keccak256(abi.encodePacked(hashIn,msgHash));
      
        FastMsgIn(headers[i], msgSequence,msgType,L1Value,bodies[i], proofs[i]);
      } else {
        hashIn = keccak256(abi.encodePacked(hashIn,bodies[i]));
        
        bytes memory payload = bodies[i];
        require(payload.length == 32, "Invalid msgHash");
        bytes32 mh;
        assembly {
          mh := mload(add(payload,32))
        }
        SlowMsgNotify(headers[i], msgSequence,msgType,L1Value,mh);
      }
      //emit MMDBG_Batch(msgSequence, i, msgType, bodies[i]);
    }
    if (headers.length > 0) {
      // If any intermediate rHash fails then the final values will differ
      require(hashIn == rHash2, "Invalid rHash2");
    }

    highestL2Block = prevBlock;
    highestL2SR = prevSR;
  }

  function SlowBatchIn(uint64 _scanFromL2, bytes32[] calldata headers, bytes[] calldata bodies, bytes[] calldata proofs)
    public
  {
    require(block.timestamp < healthCheckDeadline, "System health check failed");
    
    // scanFromL2 tells the agent where to start scanning for Slow messages. Can remove it from
    // this contract if the agent is given its own state.

    require(bodies.length == headers.length, "SlowBatch has incorrect bodies.length");
    require(proofs.length == headers.length, "SlowBatch has incorrect proofs.length");

    for (uint256 i = 0; i < headers.length; i++) {
      uint256 h2 = uint256(headers[i]);

      // FIXME - refactor, put this stuff into SlowMsgIn
      bytes32 mh = keccak256(abi.encodePacked(h2, bodies[i]));
      require (slowValidTime[mh] != 0, "Message hash is not registered");
      require (slowValidTime[mh] < block.timestamp, "Message is not yet valid");

      uint64 msgSequence = uint64(h2 >> 192);
      uint32 msgType = uint32((h2 >> 160) & 0xFFFFFFFF);
      uint160 L1Value = uint160(h2 & type(uint160).max);

      SlowMsgIn(headers[i], msgSequence,msgType,L1Value,bodies[i],proofs[i]); // Could save a bit of space by not indexing empty proofs
      //emit MMDBG_Batch(msgSequence, i, msgType, bodies[i]);
      slowValidTime[mh] = 0;
    }
    scanFromL2 = _scanFromL2;
  }
  
  // A user can challenge the system to complete a round-trip message cycle within a fixed time window. It
  // costs ETH to do this. If the system is unable to respond in time then the user may claim a larger amount of ETH.
  // A failed challenge will pause all other cross-chain messaging until the underlying condition is resolved (TBD).
  
  function HealthCheckStart ()
    public payable
  {
    require(msg.value == healthCheckFee, "Incorrect healthCheckFee");
    require(healthCheckDeadline == type(uint256).max, "Health check is already active");

    // Health check is not supported until at least one regular L2 msg has been processed
    require(lastSeqIn >= 1, "No previous message found");
    healthCheckAddress = msg.sender;
    
    healthCheckDeadline = block.timestamp + 300;
    healthCheckHash = keccak256(abi.encodePacked(hashIn,lastSeqIn));

    bytes memory checkMsg = abi.encode(hashIn);

    sendDown(4, 0, checkMsg);
 }
  
  function HealthCheckClaim ()
    public
  {
    require(healthCheckDeadline < type(uint256).max, "Health check not active");
    require(block.timestamp > healthCheckDeadline, "Health check is running");
    require(healthCheckAddress != address(0), "Already paid");
    address payable tmpAddress = payable(healthCheckAddress);
    healthCheckAddress = address(0);
    
    (bool success, ) = tmpAddress.call{value: healthCheckFee * 2}(""); // Actual amount TBD
  }
  
  function HealthCheckReset ()
    public
  {
    // *** DEVELOPMENT ONLY ***
    require(healthCheckDeadline < type(uint256).max, "Health check not active");
    require(healthCheckAddress == address(0), "Not claimed");
    healthCheckDeadline = type(uint256).max;
  }
    
  // Helper / debug functions

  function CheckBatch (uint256 idx, bytes[] calldata batch)
    public pure returns (uint64 msgSequence, uint32 msgType, uint256 L1Value, bytes memory payload)
  {
    require(idx < batch.length, "Index is beyond batch.length");
    return abi.decode(batch[idx], (uint64,uint32,uint256,bytes));
  }

  function PackProof (L2MessageInclusionProof calldata proof)
    public pure returns (bytes memory, L2MessageInclusionProof memory)
  {
    bytes memory pp = abi.encode(proof);
    L2MessageInclusionProof memory readback = abi.decode(pp,(L2MessageInclusionProof));
    return (pp,readback);
  }
}
