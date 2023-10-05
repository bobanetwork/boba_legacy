// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

/* Library Imports */
import { CrossDomainEnabled } from "@bobanetwork/core_contracts/contracts/libraries/bridge/CrossDomainEnabled.sol";
import { L1Message } from "./L1Message.sol";

contract L2Message is CrossDomainEnabled {

    address L1MessageAddress;
    string crossDomainMessage;

    event ReceiveL1Message (
        string _message
    );

    /********************
     *    Constructor   *
     ********************/
    /**
     * @param _l2CrossDomainMessenger L2 Messenger address being used for sending the cross-chain message.
     */
    constructor (
        address _l2CrossDomainMessenger
    )
        CrossDomainEnabled(_l2CrossDomainMessenger)
    {}

    function init (
       address _L1MessageAddress
    )
       public
    {
       L1MessageAddress = _L1MessageAddress;
    }

    function sendMessageL2ToL1 () public {
        bytes memory data = abi.encodeWithSelector(
            L1Message.receiveL2Message.selector,
            "messageFromL2"
        );

        // Send calldata into L1
        sendCrossDomainMessage(
            address(L1MessageAddress),
            100000,
            data
        );
    }

    /*************************
     * Cross-chain Functions *
     *************************/

    /**
     * Receive message from L1
     * @param _message message
     */
    function receiveL1Message(
      string memory _message
    )
        external
        onlyFromCrossDomainAccount(address(L1MessageAddress))
    {
        crossDomainMessage = _message;
        emit ReceiveL1Message(_message);
    }
}
