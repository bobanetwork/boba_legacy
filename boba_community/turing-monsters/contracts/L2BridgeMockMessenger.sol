// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/** Contract mock for testing the bridging functionality */
contract L2BridgeMockMessenger  {
    function sendMessage(
        address _target,
        bytes calldata _message,
        uint32 _gasLimit
    ) external {
        // do nothing
    }
}
