// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

/* External Imports */
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 Note: This contract has not been audited, exercise caution when using this on mainnet
 */

/**
 * @title Teleportation
 *
 * Shout out to optimisim for providing the inspiration for this contract:
 * https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/L1/teleportr/TeleportrDeposit.sol
 * https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts/contracts/L2/teleportr/TeleportrDisburser.sol
 */
contract Teleportation is PausableUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**************
     *   Struct   *
     **************/
    struct Disbursement {
        uint256 amount;
        address addr;
        uint256 sourceChainId;
        uint256 depositId;
    }

    /*************
     * Variables *
     *************/

    address public disburser;
    address public owner;
    address public BobaTokenAddress;

    mapping(uint256 => bool) public supportedChains;

    // The minimum amount that be deposited in a receive.
    uint256 public minDepositAmount;
    // The maximum amount that be deposited in a receive.
    uint256 public maxDepositAmount;
    // The total number of successful deposits received.
    mapping (uint256 => uint256) public totalDeposits;
    /// The total number of disbursements processed.
    mapping (uint256 => uint256) public totalDisbursements;

    // set maximum amount of tokens can be transferred in 24 hours
    uint256 public maxTransferAmountPerDay;
    // The total amount of tokens transferred in 24 hours
    uint256 public transferredAmount;
    // The timestamp of the checkpoint
    uint256 public transferTimestampCheckPoint;

    /********************
     *       Events     *
     ********************/

    event MinDepositAmountSet(
        uint256 previousAmount,
        uint256 newAmount
    );

    event MaxDepositAmountSet(
        uint256 previousAmount,
        uint256 newAmount
    );

    event MaxTransferAmountPerDaySet(
        uint256 previousAmount,
        uint256 newAmount
    );

    event NativeBOBABalanceWithdrawn(
        address indexed owner,
        uint256 balance
    );

    event BOBABalanceWithdrawn(
        address indexed owner,
        uint256 balance
    );

    event BobaReceived(
        uint256 sourceChainId,
        uint256 indexed toChainId,
        uint256 indexed depositId,
        address indexed emitter,
        uint256 amount
    );

    event DisbursementSuccess(
        uint256 indexed depositId,
        address indexed to,
        uint256 amount,
        uint256 sourceChainId
    );

    event DisbursementFailed(
        uint256 indexed depositId,
        address indexed to,
        uint256 amount,
        uint256 sourceChainId
    );

    event DisburserTransferred(
        address newDisburser
    );

    event OwnershipTransferred(
        address newOwner
    );

    event ChainSupported(
        uint256 indexed chainId,
        bool supported
    );

    /**********************
     * Function Modifiers *
     **********************/

    modifier onlyDisburser() {
        require(msg.sender == disburser, 'Caller is not the disburser');
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'Caller is not the owner');
        _;
    }

    modifier onlyNotInitialized() {
        require(address(BobaTokenAddress) == address(0), "Contract has been initialized");
        _;
    }

    modifier onlyInitialized() {
        require(address(BobaTokenAddress) != address(0), "Contract has not yet been initialized");
        _;
    }

    modifier onlyAltL2s() {
        require(address(BobaTokenAddress) == 0x4200000000000000000000000000000000000006, "Only alt L2s can call this function");
        _;
    }

    modifier onlyNotAltL2s() {
        require(address(BobaTokenAddress) != 0x4200000000000000000000000000000000000006, "only non alt L2s");
        _;
    }

    /********************
     * Public Functions *
     ********************/

    /**
     * @dev Initialize this contract.
     *
     * @param _BobaTokenAddress BOBA token address
     * @param _minDepositAmount The initial minimum deposit amount.
     * @param _maxDepositAmount The initial maximum deposit amount.
     */
    function initialize(
        address _BobaTokenAddress,
        uint256 _minDepositAmount,
        uint256 _maxDepositAmount
    )
        external
        onlyNotInitialized()
        initializer()
    {
        require(_BobaTokenAddress != address(0), "zero address not allowed");
        minDepositAmount = _minDepositAmount;
        maxDepositAmount = _maxDepositAmount;
        BobaTokenAddress = _BobaTokenAddress;
        disburser = msg.sender;
        owner = msg.sender;

       // set maximum amount of tokens can be transferred in 24 hours
        transferTimestampCheckPoint = block.timestamp;
        maxTransferAmountPerDay = 100_000e18;

        __Context_init_unchained();
        __Pausable_init_unchained();

        emit MinDepositAmountSet(0, _minDepositAmount);
        emit MaxDepositAmountSet(0, _maxDepositAmount);
        emit MaxTransferAmountPerDaySet(0, maxTransferAmountPerDay);
        emit DisburserTransferred(owner);
        emit OwnershipTransferred(owner);
    }

    /**
     * @dev add the support between this chain and the given chain.
     *
     * @param _chainId The target chain Id to support.
     */
    function addSupportedChain(uint256 _chainId) external onlyOwner() onlyInitialized() {
        require(supportedChains[_chainId] == false, "Chain is already supported");
        supportedChains[_chainId] = true;

        emit ChainSupported(_chainId, true);
    }

    /**
     * @dev remove the support between this chain and the given chain.
     *
     * @param _chainId The target chain Id not to support.
     */
    function removeSupportedChain(uint256 _chainId) external onlyOwner() onlyInitialized() {
        require(supportedChains[_chainId] == true, "Chain is already not supported");
        supportedChains[_chainId] = false;

        emit ChainSupported(_chainId, false);
    }

    /**
     * @dev Accepts deposits that will be disbursed to the sender's address on target L2.
     * The method reverts if the amount is less than the current
     * minDepositAmount, the amount is greater than the current
     * maxDepositAmount.
     *
     * @param _amount The amount of BOBA to deposit.
     * @param _toChainId The destination chain ID.
     */
    function teleportBOBA(uint256 _amount, uint256 _toChainId)
        external
        onlyNotAltL2s()
        whenNotPaused()
    {
        require(_amount >= minDepositAmount, "Deposit amount is too small");
        require(_amount <= maxDepositAmount, "Deposit amount is too big");
        require(supportedChains[_toChainId], "Target chain is not supported");

        // check if the total amount transferred is smaller than the maximum amount of tokens can be transferred in 24 hours
        // if it's out of 24 hours, reset the transferred amount to 0 and set the transferTimestampCheckPoint to the current time
        if (block.timestamp < transferTimestampCheckPoint + 86400) {
            transferredAmount += _amount;
            require(transferredAmount <= maxTransferAmountPerDay, "max amount per day exceeded");
        } else {
            transferredAmount = _amount;
            require(transferredAmount <= maxTransferAmountPerDay, "max amount per day exceeded");
            transferTimestampCheckPoint = block.timestamp;
        }

        IERC20(BobaTokenAddress).safeTransferFrom(msg.sender, address(this), _amount);

        emit BobaReceived(block.chainid, _toChainId, totalDeposits[_toChainId], msg.sender, _amount);
        totalDeposits[_toChainId] += 1;
    }

    /**
     * @dev Accepts deposits that will be disbursed to the sender's address on target L2.
     * The method reverts if the amount is less than the current
     * minDepositAmount, the amount is greater than the current
     * maxDepositAmount.
     *
     * @param _toChainId The destination chain ID.
     */
    function teleportNativeBOBA(uint256 _toChainId)
        external
        payable
        onlyAltL2s()
        whenNotPaused()
    {
        require(msg.value >= minDepositAmount, "Deposit amount is too small");
        require(msg.value <= maxDepositAmount, "Deposit amount is too big");
        require(supportedChains[_toChainId], "Target chain is not supported");

        // check if the total amount transferred is smaller than the maximum amount of tokens can be transferred in 24 hours
        // if it's out of 24 hours, reset the transferred amount to 0 and set the transferTimestampCheckPoint to the current time
        if (block.timestamp < transferTimestampCheckPoint + 86400) {
            transferredAmount += msg.value;
            require(transferredAmount <= maxTransferAmountPerDay, "max amount per day exceeded");
        } else {
            transferredAmount = msg.value;
            require(transferredAmount <= maxTransferAmountPerDay, "max amount per day exceeded");
            transferTimestampCheckPoint = block.timestamp;
        }

        emit BobaReceived(block.chainid, _toChainId, totalDeposits[_toChainId], msg.sender, msg.value);
        totalDeposits[_toChainId] += 1;
    }

    /**
     * @dev Accepts a list of Disbursements and forwards the amount paid to
     * the contract to each recipient. The method reverts if there are zero
     * disbursements, the total amount to forward differs from the amount sent
     * in the transaction, or the _nextDepositId is unexpected. Failed
     * disbursements will not cause the method to revert, but will instead be
     * held by the contract and availabe for the owner to withdraw.
     *
     * @param _disbursements A list of Disbursements to process.
     */
    function disburseNativeBOBA(Disbursement[] calldata _disbursements)
        external
        payable
        onlyDisburser()
        onlyAltL2s()
        whenNotPaused()
    {
        // Ensure there are disbursements to process.
        uint256 _numDisbursements = _disbursements.length;
        require(_numDisbursements > 0, "No disbursements");

        // Ensure the amount sent in the transaction is equal to the sum of the
        // disbursements.
        uint256 _totalDisbursed = 0;
        for (uint256 i = 0; i < _numDisbursements; i++) {
            _totalDisbursed += _disbursements[i].amount;
        }

        // Ensure the balance is enough to cover the disbursements.
        require(_totalDisbursed == msg.value, "Disbursement total != amount sent");

        // Process disbursements.
        for (uint256 i = 0; i < _numDisbursements; i++) {
            uint256 _amount = _disbursements[i].amount;
            address _addr = _disbursements[i].addr;
            uint256 _sourceChainId = _disbursements[i].sourceChainId;
            uint256 _depositId = _disbursements[i].depositId;

            // Ensure the depositId matches our expected value.
            require(_depositId == totalDisbursements[_sourceChainId], "Unexpected next deposit id");
            require(supportedChains[_sourceChainId], "Source chain is not supported");
            totalDisbursements[_sourceChainId] += 1;

            // Deliver the disbursement amount to the receiver. If the
            // disbursement fails, the amount will be kept by the contract
            // rather than reverting to prevent blocking progress on other
            // disbursements.

            // slither-disable-next-line calls-loop,reentrancy-events
            (bool success, ) = _addr.call{ gas: 3000, value: _amount }("");
            if (success) emit DisbursementSuccess(_depositId, _addr, _amount, _sourceChainId);
            else emit DisbursementFailed(_depositId, _addr, _amount, _sourceChainId);
        }
    }

    /**
     * @dev Accepts a list of Disbursements and forwards the amount paid to
     * the contract to each recipient. The method reverts if there are zero
     * disbursements, the total amount to forward differs from the amount sent
     * in the transaction, or the _nextDepositId is unexpected. Failed
     * disbursements will not cause the method to revert, but will instead be
     * held by the contract and availabe for the owner to withdraw.
     *
     * @param _disbursements A list of Disbursements to process.
     */
    function disburseBOBA(Disbursement[] calldata _disbursements)
        external
        payable
        onlyDisburser()
        onlyNotAltL2s()
        whenNotPaused()
    {
        // Ensure there are disbursements to process.
        uint256 _numDisbursements = _disbursements.length;
        require(_numDisbursements > 0, "No disbursements");

        // Ensure the amount sent in the transaction is equal to the sum of the
        // disbursements.
        uint256 _totalDisbursed = 0;
        for (uint256 i = 0; i < _numDisbursements; i++) {
            _totalDisbursed += _disbursements[i].amount;
        }

        IERC20(BobaTokenAddress).safeTransferFrom(msg.sender, address(this), _totalDisbursed);

        // Process disbursements.
        for (uint256 i = 0; i < _numDisbursements; i++) {
            uint256 _amount = _disbursements[i].amount;
            address _addr = _disbursements[i].addr;
            uint256 _sourceChainId = _disbursements[i].sourceChainId;
            uint256 _depositId = _disbursements[i].depositId;

            // Ensure the depositId matches our expected value.
            require(_depositId == totalDisbursements[_sourceChainId], "Unexpected next deposit id");
            require(supportedChains[_sourceChainId], "Source chain is not supported");
            totalDisbursements[_sourceChainId] += 1;

            // Deliver the dispursement amount to the receiver. If the
            // disbursement fails, the amount will be kept by the contract
            // rather than reverting to prevent blocking progress on other
            // disbursements.

            // slither-disable-next-line calls-loop,reentrancy-events
            IERC20(BobaTokenAddress).safeTransfer(_addr, _amount);
            emit DisbursementSuccess(_depositId, _addr, _amount, _sourceChainId);
        }
    }

    /********************
     * Admin Functions *
     ********************/

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner() {
        _pause();
    }

    /**
     * @dev UnPause contract
     */
    function unpause() external onlyOwner() {
        _unpause();
    }

    /**
     * @dev Sends the contract's current balance to the owner.
     */
    function withdrawNativeBOBABalance()
        external
        onlyOwner()
        onlyInitialized()
        onlyAltL2s()
    {
        uint256 _balance = address(this).balance;
        payable(owner).transfer(_balance);
        emit NativeBOBABalanceWithdrawn(owner, _balance);
    }

    /**
     * @dev Sends the contract's current balance to the owner.
     */
    function withdrawBOBABalance()
        external
        onlyOwner()
        onlyInitialized()
        onlyNotAltL2s()
    {
        uint256 _balance = IERC20(BobaTokenAddress).balanceOf(address(this));
        IERC20(BobaTokenAddress).safeTransfer(owner, _balance);
        emit BOBABalanceWithdrawn(owner, _balance);
    }

    /**
     * @dev transfer disburser role to new address
     *
     * @param _newDisburser new disburser of this contract
     */
    function transferDisburser(
        address _newDisburser
    )
        external
        onlyOwner()
    {
        require(_newDisburser != address(0), 'New disburser cannot be the zero address');
        disburser = _newDisburser;
        emit DisburserTransferred(_newDisburser);
    }

    /**
     * @dev transfer ownership
     *
     * @param _newOwner new admin owner of this contract
     */
    function transferOwnership(
        address _newOwner
    )
        external
        onlyOwner()
    {
        require(_newOwner != address(0), 'New owner cannot be the zero address');
        owner = _newOwner;
        emit OwnershipTransferred(_newOwner);
    }


    /**
     * @notice Sets the minimum amount that can be deposited in a receive.
     *
     * @param _minDepositAmount The new minimum deposit amount.
     */
    function setMinAmount(uint256 _minDepositAmount) external onlyOwner() {
        uint256 pastMinDepositAmount = minDepositAmount;
        minDepositAmount = _minDepositAmount;
        emit MinDepositAmountSet(pastMinDepositAmount, minDepositAmount);
    }

    /**
     * @dev Sets the maximum amount that can be deposited in a receive.
     *
     * @param _maxDepositAmount The new maximum deposit amount.
     */
    function setMaxAmount(uint256 _maxDepositAmount) external onlyOwner() {
        uint256 pastMaxDepositAmount = maxDepositAmount;
        maxDepositAmount = _maxDepositAmount;
        emit MaxDepositAmountSet(pastMaxDepositAmount, maxDepositAmount);
    }

    /**
     * @dev Sets maximum amount of disbursements that can be processed in a day
     *
     * @param _maxTransferAmountPerDay The new maximum daily transfer amount.
     */
    function setMaxTransferAmountPerDay(uint256 _maxTransferAmountPerDay) external onlyOwner() {
        uint256 pastMaxTransferAmountPerDay = maxTransferAmountPerDay;
        maxTransferAmountPerDay = _maxTransferAmountPerDay;
        emit MaxDepositAmountSet(pastMaxTransferAmountPerDay, maxTransferAmountPerDay);
    }
}
