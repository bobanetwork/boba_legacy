// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@eth-optimism/contracts/contracts/libraries/constants/Lib_PredeployAddresses.sol";

import "@eth-optimism/contracts/contracts/L2/messaging/IL2ERC20Bridge.sol";
import "@eth-optimism/contracts/contracts/L2/predeploys/OVM_GasPriceOracle.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./L2BillingContract.sol";

contract DiscretionaryExitFeeAltL1 is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public l2Bridge;
    address public billingContractAddress;

    constructor(address _l2Bridge) {
        l2Bridge = _l2Bridge;
    }

    modifier onlyWithBillingContract() {
        require(billingContractAddress != address(0), "Billing contract address is not set");
        _;
    }

    function configureBillingContractAddress(
        address _billingContractAddress
    )
        public
        onlyOwner()
    {
        require(_billingContractAddress != address(0), "Billing contract address cannot be zero");
        billingContractAddress = _billingContractAddress;
    }

    function payAndWithdraw(
        address _l2Token,
        uint256 _amount,
        uint32 _l1Gas,
        bytes calldata _data
    ) external payable onlyWithBillingContract {
        // Load billingContract contract
        L2BillingContract billingContract = L2BillingContract(payable(billingContractAddress));
        // Check Boba amount
        require(msg.value >= billingContract.exitFee(), "Insufficient Boba amount");
        // Collect the exit fee
        (bool sent,) = billingContractAddress.call{value: billingContract.exitFee()}("");
        require(sent, "Failed to collect exit fee");

        // BOBA amount
        uint256 netBobaAmount = msg.value - billingContract.exitFee();

        require(netBobaAmount != 0 || _l2Token != Lib_PredeployAddresses.L2_BOBA_ALT_L1, "Either Amount Incorrect or Token Address Incorrect");
        require(!(netBobaAmount != 0 && _l2Token != Lib_PredeployAddresses.L2_BOBA_ALT_L1), "Either Amount Incorrect or Token Address Incorrect");

        if (netBobaAmount != 0) {
            // override the _amount and token address
            _amount = netBobaAmount;
            _l2Token = Lib_PredeployAddresses.L2_BOBA_ALT_L1;
        }

        // transfer funds if users deposit ERC20
        if (_l2Token != Lib_PredeployAddresses.L2_BOBA_ALT_L1) {
            IERC20(_l2Token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        // call withdrawTo on the l2Bridge
        IL2ERC20Bridge(l2Bridge).withdrawTo(_l2Token, msg.sender, _amount, _l1Gas, _data);
    }
}
