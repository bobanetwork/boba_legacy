// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable reason-string */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "../core/BasePaymaster.sol";
import "./IBobaGasPriceOracle.sol";

/**
 * Intended to be used for Boba Alt-L1 deployments
 * This contract works with the BobaGasPriceOracle to provide an option to pay for txs using the
 * secondary (or native token)
 */
contract GPODepositPaymaster is BasePaymaster {

    using UserOperationLib for UserOperation;
    using SafeERC20 for IERC20;

    //calculated cost of the postOp
    uint256 constant public COST_OF_POST = 35000;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public unlockBlock;

    IERC20 public supportedToken;
    uint8 public supportedTokenDecimals;
    IBobaGasPriceOracle public gasPriceOracle;

    constructor(IEntryPoint _entryPoint, address _supportedToken, uint8 _supportedTokenDecimals, address _gasPriceOracle) BasePaymaster(_entryPoint) {
        supportedToken = IERC20(_supportedToken);
        supportedTokenDecimals = _supportedTokenDecimals;
        gasPriceOracle = IBobaGasPriceOracle(_gasPriceOracle);
        //owner account is unblocked, to allow withdraw of paid tokens;
        unlockTokenDeposit();
    }

    /**
     * deposit tokens that a specific account can use to pay for gas.
     * The sender must first approve this paymaster to withdraw these tokens (they are only withdrawn in this method).
     * Note depositing the tokens is equivalent to transferring them to the "account" - only the account can later
     *  use them - either as gas, or using withdrawTo()
     *
     * @param account the account to deposit for.
     * @param amount the amount of token to deposit.
     */
    function addDepositFor(address account, uint256 amount) external {
        //(sender must have approval for the paymaster)
        supportedToken.safeTransferFrom(msg.sender, address(this), amount);
        balances[account] += amount;
        if (msg.sender == account) {
            lockTokenDeposit();
        }
    }

    function depositInfo(address account) public view returns (uint256 amount, uint256 _unlockBlock) {
        amount = balances[account];
        _unlockBlock = unlockBlock[account];
    }

    /**
     * unlock deposit, so that it can be withdrawn.
     * can't be called in the same block as withdrawTo()
     */
    function unlockTokenDeposit() public {
        unlockBlock[msg.sender] = block.number;
    }

    /**
     * lock the tokens deposited for this account so they can be used to pay for gas.
     * after calling unlockTokenDeposit(), the account can't use this paymaster until the deposit is locked.
     */
    function lockTokenDeposit() public {
        unlockBlock[msg.sender] = 0;
    }

    /**
     * withdraw tokens.
     * can only be called after unlock() is called in a previous block.
     * @param target address to send to
     * @param amount amount to withdraw
     */
    function withdrawTokensTo(address target, uint256 amount) public {
        require(unlockBlock[msg.sender] != 0 && block.number > unlockBlock[msg.sender], "DepositPaymaster: must unlockTokenDeposit");
        balances[msg.sender] -= amount;
        supportedToken.safeTransfer(target, amount);
    }

    /**
     * translate the given eth value to token amount
     * @param ethBought the required eth value we want to "buy"
     * @return requiredTokens the amount of tokens required to get this amount of eth
     */
    function getTokenValueOfEth(uint256 ethBought) internal view virtual returns (uint256 requiredTokens) {
        uint256 priceRatioDecimals = gasPriceOracle.decimals();
        uint256 priceRatio = gasPriceOracle.priceRatio();
        uint256 requiredAmount = (ethBought * priceRatio) / (10**priceRatioDecimals);
        return (requiredAmount / (10**(18 - supportedTokenDecimals)));
    }

    /**
     * Validate the request:
     * The sender should have enough deposit to pay the max possible cost.
     * Note that the sender's balance is not checked. If it fails to pay from its balance,
     * this deposit will be used to compensate the paymaster for the transaction.
     */
    function validatePaymasterUserOp(UserOperation calldata userOp, bytes32 requestId, uint256 maxCost)
    external view override returns (bytes memory context, uint256 deadline) {

        (requestId);
        // verificationGasLimit is dual-purposed, as gas limit for postOp. make sure it is high enough
        require(userOp.verificationGasLimit > COST_OF_POST, "DepositPaymaster: gas too low for postOp");

        address account = userOp.getSender();
        uint256 maxTokenCost = getTokenValueOfEth(maxCost);
        require(unlockBlock[account] == 0, "DepositPaymaster: deposit not locked");
        require(balances[account] >= maxTokenCost, "DepositPaymaster: deposit too low");
        return (abi.encode(account, maxTokenCost, maxCost),0);
    }

    /**
     * perform the post-operation to charge the sender for the gas.
     * in normal mode, use transferFrom to withdraw enough tokens from the sender's balance.
     * in case the transferFrom fails, the _postOp reverts and the entryPoint will call it again,
     * this time in *postOpReverted* mode.
     * In this mode, we use the deposit to pay (which we validated to be large enough)
     */
    function _postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) internal override {

        (address account, uint256 maxTokenCost, uint256 maxCost) = abi.decode(context, (address, uint256, uint256));
        //use same conversion rate as used for validation.
        uint256 actualTokenCost = (actualGasCost + COST_OF_POST) * maxTokenCost / maxCost;
        if (mode != PostOpMode.postOpReverted) {
            // attempt to pay with tokens:
            supportedToken.safeTransferFrom(account, address(this), actualTokenCost);
        } else {
            //in case above transferFrom failed, pay with deposit:
            balances[account] -= actualTokenCost;
        }
        balances[owner()] += actualTokenCost;
    }
}
