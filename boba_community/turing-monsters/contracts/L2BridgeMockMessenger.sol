// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/** Contract mock for testing the bridging functionality */
contract L2BridgeMockMessenger {
    function sendCrossDomainMessage(
        address _crossDomainTarget,
        uint32 _gasLimit,
        bytes memory _message
    ) internal {
        // do nothing
    }
}
