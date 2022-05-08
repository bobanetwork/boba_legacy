// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

/// @dev "Owns" gas for calls on AuthenticatedFaucet.sol
contract AuthenticatedFaucetMeta is MinimalForwarder {
    /// @dev Add gas (GSN) for meta transactions
    receive() external payable {}
}
