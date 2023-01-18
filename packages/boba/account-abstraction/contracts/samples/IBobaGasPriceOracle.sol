// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
pragma experimental ABIEncoderV2;

interface IBobaGasPriceOracle {
  function decimals() external view returns (uint256);

  function priceRatio() external view returns (uint256);
}
