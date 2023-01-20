// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
pragma experimental ABIEncoderV2;

import "../../samples/IBobaGasPriceOracle.sol";

contract MockGasPriceOracle is IBobaGasPriceOracle {
  uint256 public fixedReturnValue = 45;
  uint256 public decimalsOverride = 8;

  function decimals() external view returns (uint256) {
    return decimalsOverride;
  }

  function priceRatio() external view returns (uint256) {
    return fixedReturnValue;
  }

  function updateFixedRetunValue(uint256 newValue) external {
        fixedReturnValue = newValue;
    }

  function updateDecimals(uint256 newDecimals) external {
        decimalsOverride = newDecimals;
    }
}