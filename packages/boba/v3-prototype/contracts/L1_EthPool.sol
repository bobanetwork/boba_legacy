//SPDX-License-Identifier: UNLICENSED

pragma solidity >0.7.5;

import "./L1_BobaPortal.sol";

contract L1_EthPool {
  L1_BobaPortal L1_Portal;
  address L2_PoolAddr;

  uint256 public safeL2Balance;
  uint256 public availL1Balance; // Amount available for swaps

  mapping(address => uint) public staked;
  mapping(address => address payable) removalPending;  // Users may only have one withdrawal request in flight at a time.

  constructor() public { }

  function Initialize(address portal, address l2pool) public {
    L1_Portal = L1_BobaPortal(portal);
    L2_PoolAddr = l2pool;
  }

  function stats() public view returns (uint256, uint256)
  {
    return (availL1Balance, safeL2Balance);
  }

  /* Emulate current L1LiquidityPool functionality. ETH only for now. */
  event ClientDepositL1(
        address sender,
        uint256 receivedAmount,
        address tokenAddress
  );
  function clientDepositL1(uint256 _amount, address _tokenAddress)
    external payable
  {
    require (_tokenAddress == address(0), "Only native ETH is supported for now");
    require (msg.value != 0, "Value must be non-zero");

    require (_amount == 0 || _amount == msg.value, "Amount != msg.value");
    _amount = msg.value;

    uint convert = 0;
    uint swap = msg.value;

    if (swap > safeL2Balance) {
      // Can't satisfy request from pooled funds, so we need to convert
      // some ETH into oETH through the Portal.
      convert = swap - safeL2Balance;
      swap = safeL2Balance;
    }

    safeL2Balance -= swap;
    availL1Balance += swap;

    bytes4 sel = bytes4(keccak256("PaySwap(address,uint256,uint256)"));

    bytes memory m2 = abi.encodeWithSelector(sel, msg.sender, _amount, swap);

    L1_Portal.SysMsg{value:convert}(L2_PoolAddr, m2);
  }

  event PoolPaidL1(
    address indexed _to,
    uint256 indexed amount
  );

  function PayFastExit(address target, uint256 amount) public
  {
    // Called by L1 Portal to complete a Fast Swap.
    require(amount <= availL1Balance);  // Must never fail
    availL1Balance -= amount;
    safeL2Balance += amount; // We know that the exiting client put this much into the L2 pool

    (bool success,) = target.call{value:amount}("");
    if (success) {
      emit PoolPaidL1(target,amount);

    } else {
      /* FIXME e.g. ran out of gas trying to send to a contract address. Need to
         kick it back to L2 and let sender reclaim the funds.
      */
    }
  }

  /* Adds L1 liquidity, which is available for fast exits as soon as the L2
     side receives the notice that it has been added. User may withdraw some
     or all from L1 at a later time, but this will be processed through the
     Slow channel. Rewards are calculated and paid on L2
  */
  function addLiquidity(uint amount, address tokenAddr) public payable
  {
    require(tokenAddr==address(0), "Only native ETH is supported for now");
    require(msg.value > 0, "Value must be positive");
    require(amount == msg.value, "amount must match msg.value");

    // FIXME - maybe this is safe, but for now we don't allow stacking of operations
    require(removalPending[msg.sender] == address(0), "withdrawal is in progress");

    staked[msg.sender] += msg.value;
    availL1Balance += msg.value;

    bytes memory m2 = abi.encodeWithSignature(
      "LiquidityAdded(address,uint256)",
      msg.sender,
      amount
    );

    L1_Portal.SysMsg(L2_PoolAddr, m2);
    // emit event
  }
    /* Removes L1 liquidity. This function registers the request and then
       messages the L2 pool to continue the process. Completion occurs in
       the ReleaseLiquidity() handler.
    */

    function withdrawLiquidity(
      uint256 _amount,
      address _tokenAddress,
      address payable _to
    )
      public
    {
      require(_amount <= staked[msg.sender], "_amount exceeds amount staked");
      require(removalPending[msg.sender] == address(0), "withdrawal already in progress");

      removalPending[msg.sender] = _to;

      bytes memory m2 = abi.encodeWithSignature(
        "RemoveLiquidity(address,uint256)",
        msg.sender,
        _amount
      );
      L1_Portal.SysMsg(L2_PoolAddr, m2);
    }

  /* Cross-chain message to finalize a liquidity removal. Sent via the
     Slow channel along with an L2->L1 funds transfer if required. */

  function ReleaseLiquidity(address user, uint256 amount)
    public payable
  {
    require(amount <= staked[user]);

    require(amount <= address(this).balance, "Insufficient L1 Balance"); // must not happen
    require(removalPending[user] != address(0), "Unexpected releaseLiquidity message"); // must not happen

    staked[user] -= amount;

    availL1Balance += msg.value;
    require(amount <= availL1Balance);
    availL1Balance -= amount;

    address payable target = removalPending[user]; // the "_to" from the withdrawal request
    removalPending[user] = payable(address(0));
    target.transfer(amount);

    //emit event - FIXME customize?
    emit PoolPaidL1(target, amount);
  }

  /* LEGACY - emulates depositETH from OVM_L1StandardBridge contract */

  function depositETH(uint32 _l2Gas, bytes calldata _data)
     public payable /* onlyEOA() */ {
    /* _initiateETHDeposit(msg.sender,msg.sender,_l2Gas,_data) */
    require (1 == 0, "Not implemented");
  }
}
