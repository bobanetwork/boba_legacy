// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;
/* Interface Imports */
import { ICrossDomainMessenger } from "@eth-optimism/contracts/contracts/libraries/bridge/ICrossDomainMessenger.sol";

/**
 * @title CrossDomainEnabledFast
 * @dev Helper contract for contracts performing cross-domain communications
 *
 * Compiler used: defined by inheriting contract
 * Runtime target: defined by inheriting contract
 * If this contract is inherited by an upgradeable contract, do not add new storage slots to this contract
 * this contract does not include a reserved storage field (__gap)
 */
contract CrossDomainEnabledFast {

    // Messenger contract used to send and receive messages from the other domain.
    address public senderMessenger;
    address public relayerMessenger;

    /***************
     * Constructor *
     ***************/
    constructor(
        address _senderMessenger,
        address _relayerMessenger
    ) {
        senderMessenger = _senderMessenger;
        relayerMessenger = _relayerMessenger;
    }

    /**********************
     * Function Modifiers *
     **********************/

    /**
     * @notice Enforces that the modified function is only callable by a specific cross-domain account.
     * @param _sourceDomainAccount The only account on the originating domain which is authenticated to call this function.
     */
    modifier onlyFromCrossDomainAccount(
        address _sourceDomainAccount
    ) {
        require(
            msg.sender == address(getCrossDomainRelayerMessenger()),
            "XCHAIN: messenger contract unauthenticated"
        );

        require(
            getCrossDomainRelayerMessenger().xDomainMessageSender() == _sourceDomainAccount,
            "XCHAIN: wrong sender of cross-domain message"
        );

        _;
    }

    /**********************
     * Internal Functions *
     **********************/

    /**
     * @notice Gets the messenger, usually from storage.  This function is exposed in case a child contract needs to override.
     * @return The address of the cross-domain messenger contract which should be used.
     */
    function getCrossDomainSenderMessenger()
        internal
        virtual
        returns(
            ICrossDomainMessenger
        )
    {
        return ICrossDomainMessenger(senderMessenger);
    }

    /**
     * @notice Gets the messenger, usually from storage.  This function is exposed in case a child contract needs to override.
     * @return The address of the cross-domain messenger contract which should be used.
     */
    function getCrossDomainRelayerMessenger()
        internal
        virtual
        returns(
            ICrossDomainMessenger
        )
    {
        return ICrossDomainMessenger(relayerMessenger);
    }

    /**
     * @notice Sends a message to an account on another domain
     * @param _crossDomainTarget The intended recipient on the destination domain
     * @param _data The data to send to the target (usually calldata to a function with `onlyFromCrossDomainAccount()`)
     * @param _gasLimit The gasLimit for the receipt of the message on the target domain.
     */
    function sendCrossDomainMessage(
        address _crossDomainTarget,
        uint32 _gasLimit,
        bytes memory _data
    ) internal {
        getCrossDomainSenderMessenger().sendMessage(_crossDomainTarget, _data, _gasLimit);
    }
}
