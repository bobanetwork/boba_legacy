// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "../samples/GPODepositPaymaster.sol";

contract TestTokenValueGPODepositPaymaster is GPODepositPaymaster {

    constructor(IEntryPoint _entryPoint, address _supportedToken, uint8 _supportedTokenDecimals, address _gasPriceOracle) GPODepositPaymaster(_entryPoint, _supportedToken, _supportedTokenDecimals, _gasPriceOracle) {
    }

    function getTokenValueOfEthTest(uint256 ethBought) public view returns (uint256) {
        return GPODepositPaymaster.getTokenValueOfEth(ethBought);
    }
}
