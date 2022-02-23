//SPDX-License-Identifier: UNLICENSED

pragma solidity >0.7.5;

import "./L2_BobaPortal.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract L2_EthPool {
  L2_BobaPortal L2_Portal;
  address L1_PoolAddr;
  ERC20 oETH;
  bool allowDeprecated = true;
  mapping(address => uint) staked;

  uint256 public safeL1Balance;
  uint256 public availL2Balance;

  constructor()
    payable  // FIXME - "payable" for testing only, to preload a balance
  {
    availL2Balance += msg.value;
    oETH = ERC20(0x4200000000000000000000000000000000000006);
  }

  function Initialize(address portal, address l1pool) public {
    L2_Portal = L2_BobaPortal(portal);
    L1_PoolAddr = l1pool;
  }

  function stats() public view returns (uint256, uint256)
  {
    return (safeL1Balance, availL2Balance);
  }

  /* Pays out a swap initiated on L1. The user gets "totalAmount", with
     "swapAmount" being deducted from the liquidity pool. The balance is
     supplied by the L2_BobaPortal contract minting the necessary oETH
     to our contract just before calling this function.
  */
     event PoolPaidL2(
        address indexed _to,
        uint256 indexed amount,
        uint256 indexed swapAmount
    );

  function PaySwap(address target, uint256 totalAmount, uint256 swapAmount)
    public payable
  {
    require( totalAmount == msg.value + swapAmount, "msg.value does not match requested amount");

    require(swapAmount <= availL2Balance, "INTERNAL ERROR: L2 pool underflow"); // Must ensure this can't happen

    availL2Balance -= swapAmount;
    safeL1Balance += swapAmount;

    //oETH.transfer(target, totalAmount);
    (bool success, ) = target.call{value:totalAmount}("");
    // FIXME - handle failures?

    emit PoolPaidL2(target, totalAmount, swapAmount);
  }

  /* This is triggered from the L1 side when L1 liquidity has been added. This
     updates the "safe L1" state in the L2 contract and allows fast exits
     until it has been depleted.
  */
  function LiquidityAdded(address source, uint256 amount) public
  {
    staked[source] += amount;  // Tracked here to allocate rewards
    safeL1Balance += amount;
    // event?
  }

  /* This is triggered from L1 when a user wishes to withdraw liquidity.
     It is deducted from "available" right away, but the actual funds will
     not be released until the response message has gone through the Slow
     channel. L2 ETH is burned if necessary to satisfy this request.
  */
  function RemoveLiquidity(address source, uint256 amount) public
  {
    require(staked[source] >= amount, "RemoveLiquidity request is greater than amount staked"); // Redundant here; must be enforced on L1 side
    staked[source] -= amount;

    uint256 burnAmount = 0;

    if (safeL1Balance >= amount) {
      safeL1Balance -= amount;
    } else {
      burnAmount = amount - safeL1Balance;
      require(availL2Balance >= burnAmount, "Insufficient L2 balance"); // Must not fail
      safeL1Balance = 0;
    }

    bytes memory m2 = abi.encodeWithSignature(
      "ReleaseLiquidity(address,uint256)",
      source,
      amount
    );
    availL2Balance -= burnAmount;
    L2_Portal.SysSlowUp(L1_PoolAddr, burnAmount, m2);
  }

  function clientDepositL2(uint amount, address tokenAddr)
    public payable
  {
    require(tokenAddr == 0x4200000000000000000000000000000000000006, "Only oETH is supported");
    require(allowDeprecated, "Deprecated function has been disabled");

    amount = msg.value;

    uint poolFee = amount / 100; // FIXME use proper math; allocate rewards to Stakers
    uint userAmount = amount - poolFee;
    require(userAmount <= safeL1Balance, "Insufficient L1 liquidity");
    safeL1Balance -= userAmount;
    availL2Balance += userAmount;

    // Send a Fast message up to L1
    bytes4 sel = bytes4(keccak256("PayFastExit(address,uint256)"));

    bytes memory m2 = abi.encodeWithSelector(sel, msg.sender, userAmount);

    L2_Portal.SysFastUp(L1_PoolAddr, m2);
    // Emit an event
  }

   function withdraw(
      address _l2Token,
      uint256 _amount,
      uint32 _l1Gas,
      bytes calldata _data
  )
      public payable
  {
    require(false, "Not implemented in EthPool; use L2 Portal");
  }
}
