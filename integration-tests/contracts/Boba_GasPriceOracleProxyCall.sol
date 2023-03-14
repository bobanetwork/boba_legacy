// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Boba_GasPriceOracleProxyCall {
    address public gasPriceOracleAddress;

    constructor(address _gasPriceOracleAddress) {
        gasPriceOracleAddress = _gasPriceOracleAddress;
    }

    /**
     * Add the users that want to use BOBA as the fee token
     */
    function useBobaAsFeeToken() public {
        Boba_GasPriceOracle(gasPriceOracleAddress).useBobaAsFeeToken();
    }

    /**
     * Add the users that want to use ETH as the fee token
     */
    function useETHAsFeeToken() public {
        Boba_GasPriceOracle(gasPriceOracleAddress).useETHAsFeeToken();
    }
}


interface Boba_GasPriceOracle {
  function useBobaAsFeeToken() external;
  function useETHAsFeeToken() external;
}
