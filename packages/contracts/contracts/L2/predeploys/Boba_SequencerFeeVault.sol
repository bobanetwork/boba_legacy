// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* Library Imports */
import { Lib_PredeployAddresses } from "../../libraries/constants/Lib_PredeployAddresses.sol";

/* Contract Imports */
import { L2StandardBridge } from "../messaging/L2StandardBridge.sol";
import { L2GovernanceERC20 } from "../../standards/L2GovernanceERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Boba_SequencerFeeVault
 * @dev Simple holding contract for fees paid to the Sequencer. Likely to be replaced in the future
 * but "good enough for now".
 */
contract Boba_SequencerFeeVault is Ownable {
    /*************
     * Constants *
     *************/

    // Minimum ETH balance that can be withdrawn in a single withdrawal.
    uint256 public constant MIN_WITHDRAWAL_AMOUNT = 15e18;

    /*************
     * Variables *
     *************/

    // Address on L1 that will hold the fees once withdrawn. Dynamically initialized within l2geth.
    address public l1FeeWallet;

    // L2 Boba token address
    address public l2BobaAddress;

    /***************
     * Constructor *
     ***************/

    /**
     * @param _l1FeeWallet Initial address for the L1 wallet that will hold fees once withdrawn.
     * @param _l2BobaAddress L2 Boba Token address
     */
    constructor(
        address _l1FeeWallet,
        address _l2BobaAddress
    ) {
        l1FeeWallet = _l1FeeWallet;
        l2BobaAddress = _l2BobaAddress;
    }

    /********************
     * Public Functions *
     ********************/

    function withdraw() public {
        require(
            L2GovernanceERC20(l2BobaAddress).balanceOf(address(this)) >= MIN_WITHDRAWAL_AMOUNT,
            // solhint-disable-next-line max-line-length
            "Boba_SequencerFeeVault: withdrawal amount must be greater than minimum withdrawal amount"
        );

        L2StandardBridge(Lib_PredeployAddresses.L2_STANDARD_BRIDGE).withdrawTo(
            l2BobaAddress,
            l1FeeWallet,
            L2GovernanceERC20(l2BobaAddress).balanceOf(address(this)),
            0,
            bytes("")
        );
    }
}
