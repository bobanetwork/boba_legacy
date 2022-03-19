// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract L2BillingContract is Ownable {
    using SafeERC20 for IERC20;

    address public feeTokenAddress;
    address public treasuryAddress;
    uint256 public transactionFee;

    event NFTExitFee (
        address _account,
        uint256 _amount
    );

    constructor(address _feeTokenAddress, address _treasuryAddress, uint256 _transactionFee) {
        feeTokenAddress = _feeTokenAddress;
        treasuryAddress = _treasuryAddress;
        transactionFee = _transactionFee;
    }


    function updateFeeTokenAddress(address _feeTokenAddress)
        public
        onlyOwner()
    {
        require(_feeTokenAddress != address(0), "fee token address cannot be zero");
        feeTokenAddress = _feeTokenAddress;
    }

    function updateTreasuryAddress(address _treasuryAddress)
        public
        onlyOwner()
    {
        require(_treasuryAddress != address(0), "treasury address cannot be zero");
        treasuryAddress = _treasuryAddress;
    }

      function updateTransactionFee(uint256 _transactionFee)
        public
        onlyOwner()
    {
        require(_transactionFee > 0, "transaction fee cannot be zero");
        transactionFee = _transactionFee;
    }



    function collectFeeFrom(address _account) external {
        require(_account != address(0), "account cannot be zero");
        IERC20(feeTokenAddress).safeTransferFrom(_account, treasuryAddress, transactionFee);

        emit NFTExitFee(_account, transactionFee);
    }

    function collectFee() external {
        IERC20(feeTokenAddress).safeTransferFrom(msg.sender, treasuryAddress, transactionFee);

        emit NFTExitFee(msg.sender, transactionFee);
    }
}
