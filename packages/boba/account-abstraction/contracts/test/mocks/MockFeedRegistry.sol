// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
pragma experimental ABIEncoderV2;

import "../../samples/IBobaStraw.sol";

contract MockFeedRegistry is IBobaStraw {

  int256 public fixedReturnValue = 45;
  uint8 public decimalsOverride = 8;

  function latestRoundData(
    address base,
    address quote
  )
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ) {
      return (0,0,0,0,0);
    }

  function getRoundData(
    address base,
    address quote,
    uint80 _roundId
  )
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ) {
      return (0,0,0,0,0);
    }

  // V2 AggregatorInterface

  function latestAnswer(
    address base,
    address quote
  )
    external
    view
    returns (
      int256 answer
    ) {
        return fixedReturnValue;
    }

  function latestTimestamp(
    address base,
    address quote
  )
    external
    view
    returns (
      uint256 timestamp
    ) {
      return 0;
    }

  function decimals(
    address base,
    address quote
  )
    external
    view
    returns (
      uint8
    ) {
      return decimalsOverride;
    }

    function updateFixedRetunValue(
      int256 newValue
    )
     external
    {
        fixedReturnValue = newValue;
    }

    function updateDecimals(
      uint8 newDecimals
    )
     external
    {
        decimalsOverride = newDecimals;
    }
}
