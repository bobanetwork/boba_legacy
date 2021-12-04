// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;
pragma experimental ABIEncoderV2;

/**
 * @title iL1LiquidityPool
 */
interface iL1LiquidityPool {

    /********************
     *       Events     *
     ********************/

    event AddLiquidity(
        address sender,
        uint256 amount,
        address tokenAddress
    );

    event OwnerRecoverFee(
        address sender,
        address receiver,
        uint256 amount,
        address tokenAddress
    );

    event ClientDepositL1(
        address sender,
        uint256 receivedAmount,
        address tokenAddress
    );

    event ClientPayL1(
        address sender,
        uint256 amount,
        uint256 userRewardFee,
        uint256 ownerRewardFee,
        uint256 totalFee,
        address tokenAddress
    );

    event ClientPayL1Settlement(
        address sender,
        uint256 amount,
        uint256 userRewardFee,
        uint256 ownerRewardFee,
        uint256 totalFee,
        address tokenAddress
    );

    event WithdrawLiquidity(
        address sender,
        address receiver,
        uint256 amount,
        address tokenAddress
    );

    event WithdrawReward(
        address sender,
        address receiver,
        uint256 amount,
        address tokenAddress
    );

    /*************************
     * Cross-chain Functions *
     *************************/

    function clientPayL1(
        address payable _to,
        uint256 _amount,
        address _tokenAddress
    )
        external;

    function clientPayL1Settlement(
        address payable _to,
        uint256 _amount,
        address _tokenAddress
    )
        external;

    function configureFee(
        uint256 _userRewardMinFeeRate,
        uint256 _userRewardMaxFeeRate,
        uint256 _ownerRewardFeeRate
    )
        external;
}
