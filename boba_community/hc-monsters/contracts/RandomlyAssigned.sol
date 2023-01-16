// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AddLimitedSupply.sol";
import "./TuringHelper.sol";

/// @title Randomly assign tokenIDs from a given set of tokens.
abstract contract RandomlyAssigned is AddLimitedSupply {
    // Used for random index assignment
    mapping(uint256 => uint256) private tokenMatrix;

    // The initial token ID
    uint256 private startFrom;
    TuringHelper private turingHelper;

    /// Instanciate the contract
    /// @param _totalSupply how many tokens this collection should hold
    /// @param _startFrom the tokenID with which to start counting
    constructor (uint256 _totalSupply, uint256 _startFrom, address turingHelperAddress)
    AddLimitedSupply(_totalSupply)
    {
        startFrom = _startFrom;
        turingHelper = TuringHelper(turingHelperAddress);
    }

    /// Get the next token ID
    /// @dev Randomly gets a new token ID and keeps track of the ones that are still available.
    /// @return the next token ID
    function nextToken() internal override ensureAvailability returns (uint256) {
        uint256 maxIndex = totalSupply() - tokenCount();
        uint256 initialRandom = turingHelper.TuringRandom() + block.number + tokenCount();
        uint256 random = initialRandom % maxIndex;

        uint256 value = 0;
        if (tokenMatrix[random] == 0) {
            // If this matrix position is empty, set the value to the generated random number.
            value = random;
        } else {
            // Otherwise, use the previously stored number from the matrix.
            value = tokenMatrix[random];
        }

        // If the last available tokenID is still unused...
        if (tokenMatrix[maxIndex - 1] == 0) {
            // ...store that ID in the current matrix position.
            tokenMatrix[random] = maxIndex - 1;
        } else {
            // ...otherwise copy over the stored number to the current matrix position.
            tokenMatrix[random] = tokenMatrix[maxIndex - 1];
        }

        // Increment counts
        super.nextToken();

        return value + startFrom;
    }
}
