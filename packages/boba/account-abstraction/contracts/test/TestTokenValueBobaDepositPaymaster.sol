// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "../samples/BobaDepositPaymaster.sol";

contract TestTokenValueBobaDepositPaymaster is BobaDepositPaymaster {

    constructor(IEntryPoint _entryPoint, IBobaStraw ethPriceOracle) BobaDepositPaymaster(_entryPoint, ethPriceOracle) {
    }

    function getTokenValueOfEthTest(IERC20 token, uint256 ethBought) public view returns (uint256) {
        return BobaDepositPaymaster.getTokenValueOfEth(token, ethBought);
    }
}
