// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "../samples/ManualDepositPaymaster.sol";

contract TestTokenValueManualDepositPaymaster is ManualDepositPaymaster {

    constructor(IEntryPoint _entryPoint) ManualDepositPaymaster(_entryPoint) {
    }

    function getTokenValueOfEthTest(IERC20 token, uint256 ethBought) public view returns (uint256) {
        return ManualDepositPaymaster.getTokenValueOfEth(token, ethBought);
    }
}
