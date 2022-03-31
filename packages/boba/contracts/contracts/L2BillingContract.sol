// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract L2BillingContract {
    using SafeERC20 for IERC20;

    /*************
     * Variables *
     *************/

    address public owner;
    address public feeTokenAddress;
    address public l2FeeWallet;
    uint256 public exitFee;

    /*************
     *   Events  *
     *************/

    event TransferOwnership(address, address);
    event UpdateExitFee(uint256);
    event CollectFee(address, uint256);
    event Withdraw(address, uint256);

    /*************
     * Modifiers *
     *************/

    modifier onlyNotInitiator() {
        require(feeTokenAddress == address(0), "Contract has been initialized");
        _;
    }

    modifier onlyInitiator() {
        require(feeTokenAddress != address(0), "Contract has not been initialized");
        _;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Caller is not the owner");
        _;
    }

    /*************
     * Functions *
     *************/

    function initialize(address _feeTokenAddress, address _l2FeeWallet, uint256 _exitFee) public onlyNotInitiator {
        feeTokenAddress = _feeTokenAddress;
        l2FeeWallet = _l2FeeWallet;
        exitFee = _exitFee;
        owner = msg.sender;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Ownable: new owner is the zero address");
        address oldOwner = owner;
        owner = _newOwner;
        emit TransferOwnership(oldOwner, _newOwner);
    }

      function updateExitFee(uint256 _exitFee)
        public
        onlyOwner()
    {
        require(_exitFee > 0, "exit fee cannot be zero");
        exitFee = _exitFee;

        emit UpdateExitFee(_exitFee);
    }

    function collectFeeFrom(address _account) external onlyInitiator {
        require(_account != address(0), "Account cannot be zero");
        IERC20(feeTokenAddress).safeTransferFrom(_account, address(this), exitFee);

        emit CollectFee(_account, exitFee);
    }

    function collectFee() external onlyInitiator {
        IERC20(feeTokenAddress).safeTransferFrom(msg.sender, address(this), exitFee);

        emit CollectFee(msg.sender, exitFee);
    }

    function withdraw() external onlyInitiator {
        uint256 balance = IERC20(feeTokenAddress).balanceOf(address(this));
        require(balance >= 150e18, "Balance is too low");
        IERC20(feeTokenAddress).safeTransfer(l2FeeWallet, balance);

        emit Withdraw(l2FeeWallet, balance);
    }
}
