//SPDX-License-Identifier: UNLICENSED

pragma solidity >0.7.5;

interface OVM_L2StandardBridge {
    function finalizeDeposit(
        address _l1Token,
        address _l2Token,
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _data
    ) external;

}
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface L2StandardERC20 {
  function burn(address _from, uint256 _amount) external;
  function mint(address _from, uint256 _amount) external;
}

interface LegacyXDM {
    function relayMessage(
        address _target,
        address _sender,
        bytes memory _message,
        uint256 _messageNonce
    ) external;
}

/*
interface OVM_L2CrossDomainMessenger{
    function relayMessage(
        address _target,
        address _sender,
        bytes memory _message,
        uint256 _messageNonce
    ) external;
}
*/

contract L2_BobaPortal {

  uint userL2RelayFee = 101010;
  uint64 sequence;
  uint64 public lastSeqIn;
  uint64 public lastL1Block;
  uint64 public lastL1Timestamp;

  OVM_L2StandardBridge SB2;
  //ERC20 oETH;
  L2StandardERC20 oETH;
  address LegacyXDMaddr;
  LegacyXDM legacyXDM;

  // Specifies contracts which are allowed to send a Fast message. For the new interface
  // it's a permission check. For a tunnel of a legacy Optimism message it will automatically
  // set the Fast flag.

  mapping (address => bool) fastList;

  constructor(uint64 deployL1) public {
    SB2 = OVM_L2StandardBridge(0x4200000000000000000000000000000000000010);
    oETH = L2StandardERC20(0x4200000000000000000000000000000000000006);
    LegacyXDMaddr = 0x4200000000000000000000000000000000000007;
    legacyXDM = LegacyXDM(LegacyXDMaddr);

    //fastList[0x5FbDB2315678afecb367f032d93F642f64180aa3] = true; // L2LiquidityPool
    fastList[0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512] = true; // Proxy__L2LiquidityPool

    lastL1Block = deployL1; // FIXME - L1 block at which the other portal was deployed
  }

  function stats() public view returns (uint64, uint64, uint64, uint64)
  {
    return (lastSeqIn, sequence, 0, 0); // Placeholder for L1 context
  }
  event BobaMsgIn(bytes32 indexed header, bytes32 indexed msg_hash, uint64 L1Block, uint64 L1Timestamp);
  event MMDBG (bool indexed, bytes);
  event MMDBG_OptRelay (bool indexed);

  event BobaMsgOut(bytes32 indexed header, bytes32 indexed msg_hash, bytes payload);

  event MMDBG_MintXfer(address indexed, uint256 indexed, bool indexed, bytes);

  /* Called by L2 Agent to process a message from the L1 chain. */

  function L1MessageIn(
    uint64 L1Block,
    uint64 L1Timestamp,
    bytes32 _header,
    bytes memory payload
  )
     public
  {
    uint256 header = uint256(_header);
    uint64 msgSequence = uint64(header >> 192);
    uint32 msgType = uint32((header >> 160) & 0xFFFFFFFF);
    uint160 L1Deposit = uint160(header & type(uint160).max);

    require(msgSequence == lastSeqIn + 1, "Unexpected sequence count");
    lastSeqIn += 1;

    require(L1Block >= lastL1Block, "L1Block must not decrease");
    lastL1Block = L1Block;
    require(L1Timestamp >= lastL1Timestamp, "L1Timestamp must not decrease");
    lastL1Timestamp = L1Timestamp;

    emit BobaMsgIn(_header, keccak256(abi.encodePacked(header,payload)), L1Block, L1Timestamp);

    address l1Sender;
    address target;
    address refund;
    bytes memory msgPayload;

    if(msgType == 1) {
      // System message
      (target, l1Sender, msgPayload) = abi.decode(payload,(address,address,bytes));
      oETH.mint(address(this), L1Deposit);

      (bool success, ) = target.call{value:L1Deposit}(msgPayload);

      emit MMDBG_MintXfer(target, L1Deposit, success, msgPayload);
      require (success, "System call failed");
    } else if (msgType == 2) {
      // User message, may fail. FIXME - currently no mechanism to handle this.
       (target, l1Sender, refund, msgPayload) = abi.decode(payload,(address,address,address,bytes));

      oETH.mint(address(this), L1Deposit);
      (bool success, ) = target.call{value:L1Deposit}(payload);

      emit MMDBG_MintXfer(target, L1Deposit, success, msgPayload);
    } else if(msgType == 3) {
      // tunnel of legacy Optimism msg
      //(bool success, ) = LegacyXDMaddr.call(payload);
      //emit MMDBG_OptRelay(success);
      uint256 msgNonce;

      (target,l1Sender,msgPayload,msgNonce) = abi.decode(payload,(address,address,bytes,uint256));
      legacyXDM.relayMessage(target,l1Sender,msgPayload,msgNonce);

    } else {
      require(false,"Unknown msgType");
    }
  }

  function sendOut(uint32 msgType, uint256 L1Value, bytes memory payload)
    internal
  {
    require(L1Value < type(uint160).max, "L1Value is too large");
    sequence  += 1;

    uint256 mh = (uint256(sequence) << 192) | (uint256(msgType) << 160) | L1Value;

    emit BobaMsgOut(bytes32(mh), keccak256(abi.encodePacked(mh,payload)), payload);
  }

  // Tunnel an Optimism message
  event MMDBG_TunnelIn(uint64 indexed, uint32 indexed, address indexed);

  function TunnelMsg(bytes calldata payload) public {
    uint32 msgType;

    /* Hack to check the upstream caller against the OMGX Fast list. Can remove once those
       contracts are re-written to use the native Portal interface
     */

    address _target;
    address _sender;
    bytes memory _message;
    uint256 _messageNonce;

    (,_sender,,) = abi.decode(payload[4:],(address,address,bytes,uint256));

    if (fastList[_sender]) {
      msgType = 0x80000003;
    } else {
      msgType = 3;
    }

    sendOut(msgType, 0, payload);
    emit MMDBG_TunnelIn (sequence, msgType, _sender);
    //emit BobaMsgOut(sequence, msgType, 0, payload); // strip the selector relayMessage(address,address,bytes,uint256)"
  }

  function UserRelayUp(address target, address refund, bytes calldata payload)
     public payable
  {
    uint256 amount = msg.value;

    require (amount > userL2RelayFee, "insufficient value for userL2RelayFee");

   //emit UserRelayedUp(target, refund, l2_gas, amount - userL2RelayFee);

    uint256 userAmount = amount - userL2RelayFee;
    oETH.burn(address(this), amount);

    bytes memory m2 = abi.encode(target, refund, userAmount, payload);

    sendOut(0x02, amount, m2);
  }

  /* Sends a Fast message up to the L1 chain. Fast messages don't presently support
     any direct fund transfers FIXME - allow for errors / undeliverable messages?
  */

  function SysFastUp(address target, bytes memory payload)
    public
  {
    bytes memory m2 = abi.encode(target, msg.sender, payload);

    sendOut(0x80000001, 0, m2);
  }

  function SysSlowUp(address target, uint256 L2Burn, bytes memory payload)
    public
  {
    oETH.burn(msg.sender, L2Burn);
    bytes memory m2 = abi.encode(target, msg.sender, L2Burn, payload);

    sendOut(0x01, L2Burn, m2);
  }

   /* Emulate a Slow exit from the OVM_L2StandardBridge contract. */
   function withdraw(
      address _l2Token,
      uint256 _amount,
      uint32 _l1Gas,
      bytes calldata _data
  )
      public payable
  {
    require(_l2Token == 0x4200000000000000000000000000000000000006, "Only oETH is supported");
    //require(allowDeprecated, "Deprecated function has been disabled");
    require (_amount < type(uint160).max, "_amount exceeds maximum limit");

    //require(oETH.balanceOf(msg.sender) >= _amount, "Insufficient balance");
    //require (msg.value == _amount, "msg.value must match withdrawal amount");

    //oETH.burn(address(this), msg.value); // No fee for this one
    oETH.burn(msg.sender, _amount); // No fee for this one

    bytes memory m2 = abi.encode(msg.sender, _amount, _data);

    sendOut(0x04, _amount, m2);
  }
}
