// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* Library Imports */
import { Lib_PredeployAddresses } from "../../libraries/constants/Lib_PredeployAddresses.sol";

/* Contract Imports */
import { L2StandardBridge } from "../messaging/L2StandardBridge.sol";
import { L2GovernanceERC20 } from "../../standards/L2GovernanceERC20.sol";
import { OVM_GasPriceOracle } from "./OVM_GasPriceOracle.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/* Contract Imports */
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title Boba_GasPriceOracle
 */
contract Boba_GasPriceOracle is Ownable {
    using SafeERC20 for IERC20;

    /*************
     * Constants *
     *************/

    // Minimum BOBA balance that can be withdrawn in a single withdrawal.
    uint256 public constant MIN_WITHDRAWAL_AMOUNT = 150e18;

    /*************
     * Variables *
     *************/

    // Address on L1 that will hold the fees once withdrawn. Dynamically initialized within l2geth.
    address public l1FeeWallet;

    // L2 Boba token address
    address public l2BobaAddress;

    // The maximum value of ETH and BOBA
    uint256 public maxPriceRatio = 5000;

    // The minimum value of ETH and BOBA
    uint256 public minPriceRatio = 500;

    // The price ratio of ETH and BOBA
    uint256 public priceRatio;

    // Gas price oracle address
    address public gasPriceOracleAddress = 0x420000000000000000000000000000000000000F;

    // Record the wallet address that wants to use boba as fee token
    mapping(address => bool) public bobaFeeTokenUsers;

    // Boba fee for the meta transaction
    uint256 public metaTransactionFee = 3e18;

    /*************
     *  Events   *
     *************/

    event UseBobaAsFeeToken(address);
    event UseBobaAsFeeTokenMetaTransaction(address);
    event UseETHAsFeeToken(address);
    event UpdatePriceRatio(address, uint256);
    event UpdateMaxPriceRatio(address, uint256);
    event UpdateMinPriceRatio(address, uint256);
    event UpdateGasPriceOracleAddress(address, address);
    event UpdateMetaTransactionFee(address, uint256);
    event Withdraw(address, address);

    /***************
     * Constructor *
     ***************/

    /**
     * @param _l1FeeWallet Initial address for the L1 wallet that will hold fees once withdrawn.
     * @param _l2BobaAddress L2 Boba Token address
     */
    constructor(address _l1FeeWallet, address _l2BobaAddress) {
        require(_l1FeeWallet != address(0) && _l2BobaAddress != address(0));
        l1FeeWallet = _l1FeeWallet;
        l2BobaAddress = _l2BobaAddress;
    }

    /********************
     * Public Functions *
     ********************/

    /**
     * Add the users that want to use BOBA as the fee token
     */
    function useBobaAsFeeToken() public {
        require(!Address.isContract(msg.sender), "Account not EOA");
        bobaFeeTokenUsers[msg.sender] = true;
        emit UseBobaAsFeeToken(msg.sender);
    }

    /**
     * Add the users that want to use BOBA as the fee token
     * using the Meta Transaction
     * NOTE: Only works for the mainnet and local testnet
     */
    function useBobaAsFeeTokenMetaTransaction(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(!Address.isContract(owner), "Account not EOA");
        require(spender == address(this), "Spender is not this contract");
        require(value >= metaTransactionFee, "Value is not enough");
        L2GovernanceERC20 bobaToken = L2GovernanceERC20(l2BobaAddress);
        bobaToken.permit(owner, spender, value, deadline, v, r, s);
        IERC20(l2BobaAddress).safeTransferFrom(owner, address(this), metaTransactionFee);
        bobaFeeTokenUsers[owner] = true;
        emit UseBobaAsFeeTokenMetaTransaction(owner);
    }

    /**
     * Add the users that want to use ETH as the fee token
     */
    function useETHAsFeeToken() public {
        require(!Address.isContract(msg.sender), "Account not EOA");
        bobaFeeTokenUsers[msg.sender] = false;
        emit UseETHAsFeeToken(msg.sender);
    }

    /**
     * Update the price ratio of ETH and BOBA
     * @param _priceRatio the price ratio of ETH and BOBA
     */
    function updatePriceRatio(uint256 _priceRatio) public onlyOwner {
        require(_priceRatio <= maxPriceRatio && _priceRatio >= minPriceRatio);
        priceRatio = _priceRatio;
        emit UpdatePriceRatio(owner(), _priceRatio);
    }

    /**
     * Update the maximum price ratio of ETH and BOBA
     * @param _maxPriceRatio the maximum price ratio of ETH and BOBA
     */
    function updateMaxPriceRatio(uint256 _maxPriceRatio) public onlyOwner {
        require(_maxPriceRatio >= minPriceRatio && _maxPriceRatio > 0);
        maxPriceRatio = _maxPriceRatio;
        emit UpdateMaxPriceRatio(owner(), _maxPriceRatio);
    }

    /**
     * Update the minimum price ratio of ETH and BOBA
     * @param _minPriceRatio the minimum price ratio of ETH and BOBA
     */
    function updateMinPriceRatio(uint256 _minPriceRatio) public onlyOwner {
        require(_minPriceRatio <= maxPriceRatio && _minPriceRatio > 0);
        minPriceRatio = _minPriceRatio;
        emit UpdateMinPriceRatio(owner(), _minPriceRatio);
    }

    /**
     * Update the gas oracle address
     * @param _gasPriceOracleAddress gas oracle address
     */
    function updateGasPriceOracleAddress(address _gasPriceOracleAddress) public onlyOwner {
        require(Address.isContract(_gasPriceOracleAddress), "Account is EOA");
        require(_gasPriceOracleAddress != address(0));
        gasPriceOracleAddress = _gasPriceOracleAddress;
        emit UpdateGasPriceOracleAddress(owner(), _gasPriceOracleAddress);
    }

    /**
     * Update the fee for the meta transaction
     * @param _metaTransactionFee the fee for the meta transaction
     */
    function updateMetaTransactionFee(uint256 _metaTransactionFee) public onlyOwner {
        require(_metaTransactionFee > 0);
        metaTransactionFee = _metaTransactionFee;
        emit UpdateMetaTransactionFee(owner(), _metaTransactionFee);
    }

    /**
     * Get L1 Boba fee for fee estimation
     * @param _txData the data payload
     */
    function getL1BobaFee(bytes memory _txData) public view returns (uint256) {
        OVM_GasPriceOracle gasPriceOracleContract = OVM_GasPriceOracle(gasPriceOracleAddress);
        return gasPriceOracleContract.getL1Fee(_txData) * priceRatio;
    }

    /**
     * withdraw BOBA tokens to l1 fee wallet
     */
    function withdraw() public {
        require(
            L2GovernanceERC20(l2BobaAddress).balanceOf(address(this)) >= MIN_WITHDRAWAL_AMOUNT,
            // solhint-disable-next-line max-line-length
            "Boba_GasPriceOracle: withdrawal amount must be greater than minimum withdrawal amount"
        );

        L2StandardBridge(Lib_PredeployAddresses.L2_STANDARD_BRIDGE).withdrawTo(
            l2BobaAddress,
            l1FeeWallet,
            L2GovernanceERC20(l2BobaAddress).balanceOf(address(this)),
            0,
            bytes("")
        );
        emit Withdraw(owner(), l1FeeWallet);
    }
}
