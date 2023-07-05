// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/* External Imports */
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import '@openzeppelin/contracts/utils/Address.sol';

/**
 * @title Teleportation
 *
 * Bridge the native asset or whitelisted ERC20 tokens between whitelisted networks (L2's/L1's).
 *
 * @notice The contract itself emits events and locks the funds to be bridged/teleported. These events are then picked up by a backend service that releases the corresponding token or native asset on the destination network. Withdrawal periods (e.g. for optimistic rollups) are not handled by the contract itself, but would be handled on the Teleportation service if deemed necessary.
 * @dev Implementation of the Teleportation service can be found at https://github.com/bobanetwork/boba within /packages/boba/teleportation if not moved.
 */
contract Teleportation is PausableUpgradeable, MulticallUpgradeable {
    using Address for address;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**************
     *   Struct   *
     **************/
    struct Disbursement {
        address token;
        uint256 amount;
        address addr;
        uint256 sourceChainId;
        uint256 depositId;
    }

    struct FailedNativeDisbursement {
        bool failed;
        Disbursement disbursement;
    }

    struct SupportedToken {
        bool supported;
        // The minimum amount that needs to be deposited in a receive.
        uint256 minDepositAmount;
        // The maximum amount that can be deposited in a receive.
        uint256 maxDepositAmount;
        // set maximum amount of tokens that can be transferred in 24 hours
        uint256 maxTransferAmountPerDay;
        // The total amount of tokens transferred in 24 hours
        uint256 transferredAmount;
        // The timestamp of the checkpoint
        uint256 transferTimestampCheckPoint;
    }

    /*************
     * Variables *
     *************/

    /// @dev Wallet that is being used to release teleported assets on the destination network.
    address public disburser;

    /// @dev General owner wallet to change configurations.
    address public owner;

    /// @dev Assets and networks to be supported. ZeroAddress for native asset
    /// {assetAddress} => {targetChainId} => {tokenConfig}
    mapping(address => mapping(uint256 => SupportedToken)) public supportedTokens;

    /// @dev The total number of successful deposits received.
    mapping(uint256 => uint256) public totalDeposits;

    /// @dev The total number of disbursements processed.
    mapping(uint256 => uint256) public totalDisbursements;

    // @dev depositId to failed status and disbursement info
    mapping(uint256 => FailedNativeDisbursement) public failedNativeDisbursements;

    /********************
     *       Events     *
     ********************/

    event MinDepositAmountSet(
    /* @dev Zero Address = native asset **/
        address token,
        uint256 toChainId,
        uint256 previousAmount,
        uint256 newAmount
    );

    event MaxDepositAmountSet(
    /* @dev Zero Address = native asset **/
        address token,
        uint256 toChainId,
        uint256 previousAmount,
        uint256 newAmount
    );

    event MaxTransferAmountPerDaySet(
        address token,
        uint256 toChainId,
        uint256 previousAmount,
        uint256 newAmount
    );

    event AssetBalanceWithdrawn(
        address indexed token,
        address indexed owner,
        uint256 balance
    );

    event AssetReceived(
    /** @dev Must be ZeroAddress for nativeAsset */
        address token,
        uint256 sourceChainId,
        uint256 indexed toChainId,
        uint256 indexed depositId,
        address indexed emitter,
        uint256 amount
    );

    event DisbursementSuccess(
        uint256 indexed depositId,
        address indexed to,
        address indexed token,
        uint256 amount,
        uint256 sourceChainId
    );

    /** @dev only for native assets */
    event DisbursementFailed(
        uint256 indexed depositId,
        address indexed to,
        uint256 amount,
        uint256 sourceChainId
    );

    /** @dev Only for native assets */
    event DisbursementRetrySuccess(
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

    event TokenSupported(
        address indexed token,
        uint256 indexed toChainId,
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
        require(address(disburser) == address(0), "Contract has been initialized");
        _;
    }

    modifier onlyInitialized() {
        require(address(disburser) != address(0), "Contract has not yet been initialized");
        _;
    }

    /********************
     * Public Functions *
     ********************/

    /// @dev Initialize this contract
    function initialize() external onlyNotInitialized() initializer() {
        disburser = msg.sender;
        owner = msg.sender;

        __Context_init_unchained();
        __Pausable_init_unchained();
        __Multicall_init_unchained();

        emit DisburserTransferred(owner);
        emit OwnershipTransferred(owner);
    }

    /**
    * @dev Add support of a specific ERC20 token on this network.
    *
    * @param _token Token address to support or ZeroAddress for native
    */
    function addSupportedToken(address _token, uint256 _toChainId, uint256 _minDepositAmount, uint256 _maxDepositAmount, uint256 _maxTransferAmountPerDay) public onlyOwner() onlyInitialized() {
        require(supportedTokens[_token][_toChainId].supported == false, "Already supported");
        // Not added ERC165 as implemented for L1 ERC20
        require(address(0) == _token || Address.isContract(_token), "Not contract or native");
        // doesn't ensure it's ERC20

        require(_minDepositAmount > 0 && _minDepositAmount <= _maxDepositAmount, "incorrect min/max deposit");
        // set maximum amount of tokens that can be transferred in 24 hours
        require(_maxDepositAmount <= _maxTransferAmountPerDay, "max deposit amount more than daily limit");

        supportedTokens[_token][_toChainId] = SupportedToken(true, _minDepositAmount, _maxDepositAmount, _maxTransferAmountPerDay, 0, block.timestamp);

        emit TokenSupported(_token, _toChainId, true);
        emit MinDepositAmountSet(_token, _toChainId, 0, _minDepositAmount);
        emit MaxDepositAmountSet(_token, _toChainId, 0, _maxDepositAmount);
        emit MaxTransferAmountPerDaySet(_token, _toChainId, 0, _maxTransferAmountPerDay);
    }

    /**
     * @dev remove the support for a specific token.
     *
     * @param _token The token not to support.
     */
    function removeSupportedToken(address _token, uint256 _toChainId) external onlyOwner() onlyInitialized() {
        require(supportedTokens[_token][_toChainId].supported == true, "Already not supported");
        delete supportedTokens[_token][_toChainId].supported;
        delete supportedTokens[_token][_toChainId].minDepositAmount;
        delete supportedTokens[_token][_toChainId].maxDepositAmount;
        delete supportedTokens[_token][_toChainId].maxTransferAmountPerDay;
        // we might want to keep transferredAmount & lastTimestamp in case it is being added (shortly) after again

        emit TokenSupported(_token, _toChainId, false);
    }

    /**
     * @dev Accepts deposits that will be disbursed to the sender's address on target L2.
     * The method reverts if the amount is less than the current
     * minDepositAmount, the amount is greater than the current
     * maxDepositAmount.
     *
     * @param _token ERC20 address of the token to deposit.
     * @param _amount The amount of token or native asset to deposit (must be the same as msg.value if native asset)
     * @param _toChainId The destination chain ID.
     */
    function teleportAsset(address _token, uint256 _amount, uint256 _toChainId)
    external
    payable
    whenNotPaused()
    {
        SupportedToken memory supToken = supportedTokens[_token][_toChainId];
        require(supToken.supported == true, "Token or chain not supported");
        require(_amount >= supToken.minDepositAmount, "Deposit amount too small");
        require(_amount <= supToken.maxDepositAmount, "Deposit amount too big");
        // minimal workaround to keep logic concise
        require((address(0) != _token && msg.value == 0) || (address(0) == _token && _amount == msg.value), "Native amount invalid");

        // check if the total amount transferred is smaller than the maximum amount of tokens can be transferred in 24 hours
        // if it's out of 24 hours, reset the transferred amount to 0 and set the transferTimestampCheckPoint to the current time
        if (block.timestamp < supToken.transferTimestampCheckPoint + 86400) {
            supToken.transferredAmount += _amount;
            require(supToken.transferredAmount <= supToken.maxTransferAmountPerDay, "max amount per day exceeded");
        } else {
            supToken.transferredAmount = _amount;
            require(supToken.transferredAmount <= supToken.maxTransferAmountPerDay, "max amount per day exceeded");
            supToken.transferTimestampCheckPoint = block.timestamp;
        }

        supportedTokens[_token][_toChainId] = supToken;
        if (_token != address(0)) {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        emit AssetReceived(_token, block.chainid, _toChainId, totalDeposits[_toChainId], msg.sender, _amount);
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
    function disburseAsset(Disbursement[] calldata _disbursements)
    external
    payable
    onlyDisburser()
    whenNotPaused()
    {
        // Ensure there are disbursements to process.
        uint256 _numDisbursements = _disbursements.length;
        require(_numDisbursements > 0, "No disbursements");

        // Process disbursements.
        uint remainingValue = msg.value;
        for (uint256 i = 0; i < _numDisbursements; i++) {

            uint256 _amount = _disbursements[i].amount;
            address _addr = _disbursements[i].addr;
            uint256 _sourceChainId = _disbursements[i].sourceChainId;
            uint256 _depositId = _disbursements[i].depositId;
            address _token = _disbursements[i].token;

            // Bidirectional support expected
            require(supportedTokens[_token][_sourceChainId].supported, "Token or chain not supported");

            // Ensure the depositId matches our expected value.
            require(_depositId == totalDisbursements[_sourceChainId], "Unexpected next deposit id");
            totalDisbursements[_sourceChainId] += 1;

            // ensure amount sent in the tx is equal to disbursement (moved into loop to ensure token flexibility)
            if (_token == address(0)) {
                require(_amount <= remainingValue, "Disbursement total != amount sent");
                remainingValue -= _amount;
            } else {
                IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
            }

            if (_token == address(0)) {
                // Deliver the disbursement amount to the receiver. If the
                // disbursement fails, the amount will be kept by the contract
                // rather than reverting to prevent blocking progress on other
                // disbursements.

                // slither-disable-next-line calls-loop,reentrancy-events
                (bool success,) = _addr.call{gas: 3000, value: _amount}("");
                if (success) emit DisbursementSuccess(_depositId, _addr, _token, _amount, _sourceChainId);
                else {
                    failedNativeDisbursements[_depositId] = FailedNativeDisbursement(true, _disbursements[i]);
                    emit DisbursementFailed(_depositId, _addr, _amount, _sourceChainId);
                }
            } else {
                // slither-disable-next-line calls-loop,reentrancy-events
                IERC20(_token).safeTransfer(_addr, _amount);
            }
            emit DisbursementSuccess(_depositId, _addr, _token, _amount, _sourceChainId);
        }
    }

    /**
     * @dev Retry native disbursement if it failed previously. Only applies to native disbursements bc. of low-level call.
     *
     * @param _depositIds A list of DepositIds to process.
     */
    function retryDisburseNative(uint256[] memory _depositIds)
    external
    payable
    onlyDisburser()
    whenNotPaused()
    {
        // Ensure there are disbursements to process.
        uint256 _numDisbursements = _depositIds.length;
        require(_numDisbursements > 0, "No disbursements");

        // Failed Disbursement amounts should remain in the contract

        // Process disbursements.
        for (uint256 i = 0; i < _numDisbursements; i++) {
            FailedNativeDisbursement storage failedDisbursement = failedNativeDisbursements[_depositIds[i]];
            require(failedDisbursement.failed, "DepositId not failed disbursement");
            uint256 _amount = failedDisbursement.disbursement.amount;
            address _addr = failedDisbursement.disbursement.addr;
            uint256 _sourceChainId = failedDisbursement.disbursement.sourceChainId;

            // slither-disable-next-line calls-loop,reentrancy-events
            (bool success,) = _addr.call{gas: 3000, value: _amount}("");
            if (success) {
                failedNativeDisbursements[_depositIds[i]].failed = false;
                emit DisbursementRetrySuccess(_depositIds[i], _addr, _amount, _sourceChainId);
            }
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
    function withdrawBalance(address _token)
    external
    onlyOwner()
    onlyInitialized()
    {
        if (address(0) == _token) {
            uint256 _balance = address(this).balance;
            (bool sent,) = owner.call{gas: 2300, value: _balance}("");
            require(sent, "Failed to send Ether");
            emit AssetBalanceWithdrawn(_token, owner, _balance);
        } else {
            // no supportedToken check in case of generally lost tokens
            uint256 _balance = IERC20(_token).balanceOf(address(this));
            IERC20(_token).safeTransfer(owner, _balance);
            emit AssetBalanceWithdrawn(_token, owner, _balance);
        }
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
     * @param _token configure for which token or ZeroAddress for native
     * @param _minDepositAmount The new minimum deposit amount.
     */
    function setMinAmount(address _token, uint256 _toChainId, uint256 _minDepositAmount) external onlyOwner() {
        SupportedToken memory supToken = supportedTokens[_token][_toChainId];
        require(supToken.supported, "Token or chain not supported");
        require(_minDepositAmount > 0 && _minDepositAmount <= supToken.maxDepositAmount, "incorrect min deposit amount");

        uint256 pastMinDepositAmount = supToken.minDepositAmount;
        supportedTokens[_token][_toChainId].minDepositAmount = _minDepositAmount;

        emit MinDepositAmountSet(_token, _toChainId, pastMinDepositAmount, _minDepositAmount);
    }

    /**
     * @dev Sets the maximum amount that can be deposited in a receive.
     *
     * @param _token configure for which token or ZeroAddr for native asset
     * @param _toChainId target chain id to set configuration for
     * @param _maxDepositAmount The new maximum deposit amount.
     */
    function setMaxAmount(address _token, uint256 _toChainId, uint256 _maxDepositAmount) external onlyOwner() {
        SupportedToken memory supToken = supportedTokens[_token][_toChainId];
        require(supToken.supported, "Token or chain not supported");
        require(_maxDepositAmount <= supToken.maxTransferAmountPerDay, "max deposit amount more than daily limit");
        require(_maxDepositAmount > 0 && _maxDepositAmount >= supToken.minDepositAmount, "incorrect max deposit amount");
        uint256 pastMaxDepositAmount = supToken.maxDepositAmount;

        supportedTokens[_token][_toChainId].maxDepositAmount = _maxDepositAmount;
        emit MaxDepositAmountSet(_token, _toChainId, pastMaxDepositAmount, _maxDepositAmount);
    }

    /**
     * @dev Sets maximum amount of disbursements that can be processed in a day
     *
     * @param _token Token or native asset (ZeroAddr) to set value for
     * @param _maxTransferAmountPerDay The new maximum daily transfer amount.
     */
    function setMaxTransferAmountPerDay(address _token, uint256 _toChainId, uint256 _maxTransferAmountPerDay) external onlyOwner() {

        SupportedToken memory supToken = supportedTokens[_token][_toChainId];
        require(supToken.supported, "Token or chain not supported");
        require(_maxTransferAmountPerDay > 0 && _maxTransferAmountPerDay >= supToken.maxDepositAmount, "incorrect daily limit");
        uint256 pastMaxTransferAmountPerDay = supToken.maxTransferAmountPerDay;

        supportedTokens[_token][_toChainId].maxTransferAmountPerDay = _maxTransferAmountPerDay;

        emit MaxTransferAmountPerDaySet(_token, _toChainId, pastMaxTransferAmountPerDay, _maxTransferAmountPerDay);
    }
}
