// Credit - Based on Chainlink's FeedRegistry
// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV2V3Interface.sol";
// add an interface to this contract
/**
 * @notice This contract implements a registry without phases
 * which means if a aggregator contract address is updated, the round details
 * from older contract will not be obtainable
 * If this is a requirement, use the PriceFeedRegistry contract instead
 */
contract SimplePriceFeedRegistry {

  address public owner;

  modifier onlyOwner() {
    require(msg.sender == owner, "Caller is not the owner");
    _;
  }

  // mapping (base, quote) to aggregator contract
  // base is token address, quote is the currency denomination or token
  // for fiat currencies, use currency codes for address https://en.wikipedia.org/wiki/ISO_4217
  mapping(address => mapping(address => AggregatorV2V3Interface)) private currentAggregators;
  mapping(address => mapping(address => AggregatorV2V3Interface)) private proposedAggregators;

  constructor() public {
    owner = msg.sender;
  }

  /**
   * @notice represents the number of decimals the aggregator responses represent.
   */
  function decimals(
    address base,
    address quote
  )
    external
    view
    returns (
      uint8
    )
  {
    AggregatorV2V3Interface aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
    return aggregator.decimals();
  }

  /**
   * @notice returns the description of the aggregator.
   */
  function description(
    address base,
    address quote
  )
    external
    view
    returns (
      string memory
    )
  {
    AggregatorV2V3Interface aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
    return aggregator.description();
  }

  /**
   * @notice returns the latestRoundData from the aggregator.
   */
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
    )
  {
    AggregatorV2V3Interface aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
    return aggregator.latestRoundData();
  }

  /**
   * @notice returns the queried roundData from the aggregator.
   */
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
    )
  {
    AggregatorV2V3Interface aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
    return aggregator.getRoundData(_roundId);
  }

  /**
   * @notice Reads the current answer for an base / quote pair's aggregator.
   */
  function latestAnswer(
    address base,
    address quote
  )
    external
    view
    returns (
      int256 answer
    )
  {
    AggregatorV2V3Interface aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
    return aggregator.latestAnswer();
  }

  /**
   * @notice Reads the latest completed timestamp for an base / quote pair's aggregator.
   */
  function latestTimestamp(
    address base,
    address quote
  )
    external
    view
    returns (
      uint256 timestamp
    )
  {
    AggregatorV2V3Interface aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
    return aggregator.latestTimestamp();
  }

  /**
   * @notice get the latest completed round where the answer was updated
   */
  function latestRound(
    address base,
    address quote
  )
    external
    view
    returns (
      uint256 roundId
    )
  {
    AggregatorV2V3Interface aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
    return aggregator.latestRound();
  }

  /**
   * @notice get past rounds answers
   */
  function getAnswer(
    address base,
    address quote,
    uint256 roundId
  )
    external
    view
    returns (
      int256 answer
    )
  {
    AggregatorV2V3Interface aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
    return aggregator.getAnswer(roundId);
  }

  /**
   * @notice get block timestamp when an answer was last updated
   */
  function getTimestamp(
    address base,
    address quote,
    uint256 roundId
  )
    external
    view
    returns (
      uint256 timestamp
    )
  {
    AggregatorV2V3Interface aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
    return aggregator.getTimestamp(roundId);
  }

  /**
   * @notice Retrieve the aggregator of an base / quote pair
   * @param base base asset address
   * @param quote quote asset address
   * @return aggregator
   */
  function getFeed(
    address base,
    address quote
  )
    external
    view
    returns (
      AggregatorV2V3Interface aggregator
    )
  {
    aggregator = currentAggregators[base][quote];
    require(address(aggregator) != address(0), "Feed not found");
  }

  /**
   * @notice Allows the owner to propose a new address for the aggregator
   * @param base base asset address
   * @param quote quote asset address
   * @param aggregator The new aggregator contract address
   */
  function proposeFeed(
    address base,
    address quote,
    address aggregator
  )
    external
    onlyOwner
  {
    // for now, avoid setting zero address for the aggregator
    require(aggregator != address(0), "Zero address not allowed");
    AggregatorV2V3Interface currentAggregator = currentAggregators[base][quote];
    require(aggregator != address(currentAggregator), "Cannot propose current aggregator");
    AggregatorV2V3Interface proposedAggregator = proposedAggregators[base][quote];
    if (address(proposedAggregator) != aggregator) {
      proposedAggregators[base][quote] = AggregatorV2V3Interface(aggregator);
    }
  }

  /**
   * @notice Allows the owner to confirm and change the address
   * to the proposed aggregator
   * @dev Reverts if the given address doesn't match what was previously
   * proposed
   * @param base base asset address
   * @param quote quote asset address
   * @param aggregator The new aggregator contract address
   */
  function confirmFeed(
    address base,
    address quote,
    address aggregator
  )
    external
    onlyOwner
  {
    require(aggregator != address(0), "Zero address not allowed");
    require(aggregator == address(proposedAggregators[base][quote]), "Invalid proposed aggregator");
    currentAggregators[base][quote] = AggregatorV2V3Interface(aggregator);
    delete proposedAggregators[base][quote];
  }

  /**
   * @notice Returns the proposed aggregator for an base / quote pair
   * returns a zero address if there is no proposed aggregator for the pair
   * @param base base asset address
   * @param quote quote asset address
   * @return proposedAggregator
  */
  function getProposedFeed(
    address base,
    address quote
  )
    external
    view
    returns (
      AggregatorV2V3Interface proposedAggregator
    )
  {
    return proposedAggregators[base][quote];
  }

  function transferOwnership(
    address _newOwner
  )
    public
    onlyOwner
  {
    require(_newOwner != address(0), "New owner cannot be the zero address");
    owner = _newOwner;
  }
}