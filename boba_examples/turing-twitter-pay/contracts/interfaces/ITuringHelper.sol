// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

interface ITuringHelper {
    function TuringTx(string memory, bytes memory) external returns (bytes memory);
	
	function TuringRandom() external returns (uint256);
}
