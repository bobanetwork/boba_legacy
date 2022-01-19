// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title BobaTuringCredit
 * @dev The credit system for the boba turing
 */
contract BobaTuringCredit is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**********************
    * Contract Variables *
    **********************/

    mapping(address => uint256) public prepaidBalance;

    address public turingToken;
    uint256 public turingPrice;
    uint256 public ownerRevenue;

    /********************
     *       Events     *
     ********************/

    event AddBalance(
        address sender,
        uint256 balancetAmount
    );

    event AddBalanceTo(
        address sender,
        uint256 balanceAmount,
        address to
    );

    event WithdrawRevenue(
        address sender,
        uint256 withdrawAmount
    );

    /**********************
     * Function Modifiers *
     **********************/

    modifier onlyNotInitialized() {
        require(address(turingToken) == address(0), "Contract has been initialized");
        _;
    }

    modifier onlyInitialized() {
        require(address(turingToken) != address(0), "Contract has not yet been initialized");
        _;
    }

    /********************
     *    Constructor   *
     ********************/

    constructor(
        uint256 _turingPrice
    )
    {
        turingPrice = _turingPrice;
    }

    /********************
    * Public Functions *
    ********************/

    /**
     * @dev Update turing token
     *
     * @param _turingToken credit token address
     */
    function updateTuringToken(
        address _turingToken
    )
        public
        onlyOwner
        onlyNotInitialized
    {
        turingToken = _turingToken;
    }

    /**
     * @dev Update turing price
     *
     * @param _turingPrice turing price for each off-chain computation
     */
    function updateTuringPrice(
        uint256 _turingPrice
    )
        public
        onlyOwner
    {
        turingPrice = _turingPrice;
    }

    /**
     * @dev Add balance for msg.sender
     *
     * @param _addBalanceAmount the prepaid amount that the user want to add
     */
    function addBalance(
        uint256 _addBalanceAmount
    )
        public
        onlyInitialized
    {
        require(_addBalanceAmount != 0, "Invalid amount");

        prepaidBalance[msg.sender] += _addBalanceAmount;

        emit AddBalance(
            msg.sender,
            _addBalanceAmount
        );

        // Transfer token to this contract
        IERC20(turingToken).safeTransferFrom(msg.sender, address(this), _addBalanceAmount);
    }

    /**
     * @dev Add credit to another address
     *
     * @param _addBalanceAmount the prepaid amount that the user want to add
     * @param _to the target account
     */
    function addBalanceTo(
        uint256 _addBalanceAmount,
        address _to
    )
        public
        onlyInitialized
    {
        require(_addBalanceAmount != 0, "Invalid amount");
        prepaidBalance[_to] += _addBalanceAmount;

        emit AddBalanceTo(
            msg.sender,
            _addBalanceAmount,
            _to
        );

        // Transfer token to this contract
        IERC20(turingToken).safeTransferFrom(msg.sender, address(this), _addBalanceAmount);
    }

    /**
     * @dev Return the credit of one address
     */
    function getCreditAmount(
        address _address
    )
        public
        view
        returns (uint256)

    {
        require(turingPrice != 0, "Unlimited credit");
        return prepaidBalance[_address].div(turingPrice);
    }

    /**
     * @dev Owner withdraws revenue
     *
     * @param _withdrawAmount the revenue amount that the owner wants to withdraw
     */
    function withdrawRevenue(
        uint256 _withdrawAmount
    )
        public
        onlyOwner
        onlyInitialized
    {
        require(_withdrawAmount <= ownerRevenue, "Invalid Amount");

        ownerRevenue -= _withdrawAmount;

        emit WithdrawRevenue(
            msg.sender,
            _withdrawAmount
        );

        IERC20(turingToken).safeTransfer(owner(), _withdrawAmount);
    }
}
