// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "../samples/AsyncDepositPaymaster.sol";

contract TestTokenValueAsyncDepositPaymaster is AsyncDepositPaymaster {

    constructor(IEntryPoint _entryPoint) AsyncDepositPaymaster(_entryPoint) {
    }

    function getTokenValueOfEthTest(IERC20 token, uint256 ethBought) public view returns (uint256) {
        return AsyncDepositPaymaster.getTokenValueOfEth(token, ethBought);
    }
}
