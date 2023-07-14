/**
 * Credit - DepositPaymaster.sol from https://github.com/eth-infinitism/account-abstraction
 */

// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable reason-string */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../core/BasePaymaster.sol";
import "./IBobaStraw.sol";

/**
 * A token-based paymaster that accepts token deposits
 * The deposit is only a safeguard: the user pays with his token balance.
 *  only if the user didn't approve() the paymaster, or if the token balance is not enough, the deposit will be used.
 *  thus the required deposit is to cover just one method call.
 * The deposit is locked for the current block: the user must issue unlockTokenDeposit() to be allowed to withdraw
 *  (but can't use the deposit for this or further operations)
 *
 * paymasterAndData holds the paymaster address followed by the token address to use.
 * @notice This paymaster will be rejected by the standard rules of EIP4337, as it uses an external oracle.
 * (the standard rules ban accessing data of an external contract)
 * It can only be used if it is "whitelisted" by the bundler.
 * (technically, it can be used by an "oracle" which returns a static value, without accessing any storage)
 * If you do not have bundler permissions, consider deploying a paymaster that accesses a stored 'ratio' value
 * on validation and asynchronously update the ratio
 */
contract BobaDepositPaymaster is BasePaymaster {

    using UserOperationLib for UserOperation;
    using SafeERC20 for IERC20;

    struct Oracle {
        IBobaStraw feedRegistry;
        address tokenBase;
        uint8 tokenDecimals;
    }

    /** @dev Max age of token/eth price returned by latestRoundData() */
    uint256 public constant MAX_AGE_ASSET_PRICE = 10800; // default 3h TBD

    //calculated cost of the postOp
    uint256 public constant COST_OF_POST = 35000;
    address public constant QUOTE_USD = 0x0000000000000000000000000000000000000348;

    // for alt-l1, treat this as the native token
    address public constant L2_ETH_ADDRESS = 0x4200000000000000000000000000000000000006;
    IERC20 public constant L2_ETH = IERC20(L2_ETH_ADDRESS);

    IBobaStraw private constant NULL_ORACLE = IBobaStraw(address(0));

    mapping(IERC20 => Oracle) public oracles;
    mapping(IERC20 => mapping(address => uint256)) public balances;
    mapping(address => uint256) public unlockBlock;

    constructor(IEntryPoint _entryPoint, IBobaStraw ethPriceOracle) BasePaymaster(_entryPoint) {
        require(ethPriceOracle != NULL_ORACLE, "DepositPaymaster: Incorrect eth oracle");
        //owner account is unblocked, to allow withdraw of paid tokens;
        unlockTokenDeposit();
        // set native token base
        oracles[L2_ETH] = Oracle(ethPriceOracle, L2_ETH_ADDRESS, 18);
    }

    /**
     * owner of the paymaster should add supported tokens
     */
    function addToken(IERC20 token, IBobaStraw tokenPriceOracle, address base, uint8 tokenDecimals) external onlyOwner {
        require(tokenPriceOracle != NULL_ORACLE, "DepositPaymaster: Incorrect token oracle");
        require(oracles[token].feedRegistry == NULL_ORACLE);
        oracles[token] = Oracle(tokenPriceOracle, base, tokenDecimals);
    }

    /**
     * deposit tokens that a specific account can use to pay for gas.
     * The sender must first approve this paymaster to withdraw these tokens (they are only withdrawn in this method).
     * Note depositing the tokens is equivalent to transferring them to the "account" - only the account can later
     *  use them - either as gas, or using withdrawTo()
     *
     * @param token the token to deposit.
     * @param account the account to deposit for.
     * @param amount the amount of token to deposit.
     */
    function addDepositFor(IERC20 token, address account, uint256 amount) external {
        //(sender must have approval for the paymaster)
        // native tokens will fail here
        token.safeTransferFrom(msg.sender, address(this), amount);
        require(oracles[token].feedRegistry != NULL_ORACLE, "DepositPaymaster: unsupported token");
        balances[token][account] += amount;
        if (msg.sender == account) {
            lockTokenDeposit();
        }
    }

    /**
     * @return amount - the amount of given token deposited to the Paymaster.
     * @return _unlockBlock - the block height at which the deposit can be withdrawn.
     */
    function depositInfo(IERC20 token, address account) public view returns (uint256 amount, uint256 _unlockBlock) {
        amount = balances[token][account];
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
     * @param token the token deposit to withdraw
     * @param target address to send to
     * @param amount amount to withdraw
     */
    function withdrawTokensTo(IERC20 token, address target, uint256 amount) public {
        require(unlockBlock[msg.sender] != 0 && block.number > unlockBlock[msg.sender], "DepositPaymaster: must unlockTokenDeposit");
        balances[token][msg.sender] -= amount;
        token.safeTransfer(target, amount);
    }

    /**
     * translate the given eth value to token amount
     * @param token the token to use
     * @param ethBought the required eth value we want to "buy"
     * @return requiredTokens the amount of tokens required to get this amount of eth
     */
    function getTokenValueOfEth(IERC20 token, uint256 ethBought) internal view virtual returns (uint256 requiredTokens) {
        Oracle memory oracleInfo = oracles[token];
        require(oracleInfo.feedRegistry != NULL_ORACLE, "DepositPaymaster: unsupported token");
        address base = oracleInfo.tokenBase;

        uint256 currTimestamp = block.timestamp;
        (uint80 roundId, int256 price,,uint256 priceUpdatedAt,) = oracles[L2_ETH].feedRegistry.latestRoundData(oracles[L2_ETH].tokenBase, QUOTE_USD);
        require(roundId != 0 && price > 0 && priceUpdatedAt != 0 && priceUpdatedAt <= currTimestamp, "ETH round failed");
        require((currTimestamp - priceUpdatedAt) < MAX_AGE_ASSET_PRICE, "ETH price expired");
        uint256 ethPrice = uint256(price);

        (roundId, price,, priceUpdatedAt,) = oracleInfo.feedRegistry.latestRoundData(base, QUOTE_USD);
        require(roundId != 0 && price > 0 && priceUpdatedAt != 0 && priceUpdatedAt <= currTimestamp, "Token round failed");
        require((currTimestamp - priceUpdatedAt) < MAX_AGE_ASSET_PRICE, "Token price expired");
        uint256 tokenPrice = uint256(price);

        uint256 ethPriceDecimals = uint256(oracles[L2_ETH].feedRegistry.decimals(oracles[L2_ETH].tokenBase, QUOTE_USD));
        uint256 tokenPriceDecimals = uint256(oracleInfo.feedRegistry.decimals(base, QUOTE_USD));
        uint256 requiredAmount = (ethBought * ethPrice * (10**tokenPriceDecimals)) / (tokenPrice * (10**ethPriceDecimals));
        require(requiredAmount != 0, "Required amount zero"); // Since decimal oracle feeds could return different decimals that ruins assumption requiredAmount cannot be 0
        return ((requiredAmount * (10**oracleInfo.tokenDecimals)) / (10**oracles[L2_ETH].tokenDecimals));
    }

    /**
     * Validate the request:
     * The sender should have enough deposit to pay the max possible cost.
     * Note that the sender's balance is not checked. If it fails to pay from its balance,
     * this deposit will be used to compensate the paymaster for the transaction.
     */
    function _validatePaymasterUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost)
    internal view override returns (bytes memory context, uint256 validationData) {

        (userOpHash);
        // verificationGasLimit is dual-purposed, as gas limit for postOp. make sure it is high enough
        require(userOp.verificationGasLimit > COST_OF_POST, "DepositPaymaster: gas too low for postOp");

        bytes calldata paymasterAndData = userOp.paymasterAndData;
        require(paymasterAndData.length == 20+20, "DepositPaymaster: paymasterAndData must specify token");
        IERC20 token = IERC20(address(bytes20(paymasterAndData[20:])));
        address account = userOp.getSender();
        uint256 maxTokenCost = getTokenValueOfEth(token, maxCost);
        uint256 gasPriceUserOp = userOp.gasPrice();
        require(unlockBlock[account] == 0, "DepositPaymaster: deposit not locked");
        require(balances[token][account] >= maxTokenCost, "DepositPaymaster: deposit too low");
        return (abi.encode(account, token, gasPriceUserOp, maxTokenCost, maxCost),0);
    }

    /**
     * perform the post-operation to charge the sender for the gas.
     * in normal mode, use transferFrom to withdraw enough tokens from the sender's balance.
     * in case the transferFrom fails, the _postOp reverts and the entryPoint will call it again,
     * this time in *postOpReverted* mode.
     * In this mode, we use the deposit to pay (which we validated to be large enough)
     */
    function _postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) internal override {

        (address account, IERC20 token, uint256 gasPricePostOp, uint256 maxTokenCost, uint256 maxCost) = abi.decode(context, (address, IERC20, uint256, uint256, uint256));
        //use same conversion rate as used for validation.
        uint256 actualTokenCost = (actualGasCost + COST_OF_POST * gasPricePostOp) * maxTokenCost / maxCost;
        if (mode != PostOpMode.postOpReverted) {
            // attempt to pay with tokens:
            token.safeTransferFrom(account, address(this), actualTokenCost);
        } else {
            //in case above transferFrom failed, pay with deposit:
            balances[token][account] -= actualTokenCost;
        }
        balances[token][owner()] += actualTokenCost;
    }
}
