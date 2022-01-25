// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import "@chainlink/contracts/src/v0.6/vendor/SafeMathChainlink.sol";
import "./AccessController.sol";
import "../interfaces/AccessControllerInterface.sol";
import "../interfaces/BobaTokenInterface.sol";

contract Subscription is AccessController, AccessControllerInterface {
  using SafeMathChainlink for uint256;

  address public bobaTokenAddress;
  // BOBA per second cost
  uint256 public paymentPerSecondLocalAccess;
  uint256 public paymentPerSecondGlobalAccess;
  // time in seconds
  uint256 public minSubscriptionPeriod;

  event SubscriptionCostUpdated(uint256 paymentLocalAccess, uint256 paymentGlobalAccess, uint256 minSubscription);
  event OwnerWithdrawFunds(address recipient, uint256 amount);

  constructor(
    address _bobaTokenAddress,
    uint256 _paymentPerSecondLocalAccess,
    uint256 _paymentPerSecondGlobalAccess,
    uint256 _minSubscriptionPeriod
  ) public {
    require(_bobaTokenAddress != address(0), "zero address not allowed");
    require(_minSubscriptionPeriod != 0, "min subscription cannot be zero");
    bobaTokenAddress = _bobaTokenAddress;
    _updateSubscriptionCost(
      _paymentPerSecondLocalAccess,
      _paymentPerSecondGlobalAccess,
      _minSubscriptionPeriod
    );
  }

  /**
   * @notice Returns the access of an address to an base / quote pair
   * @param account The address to query
   * @param data The calldata to query (msg.data from FeedRegistry)
   */
  function hasAccess(
    address account,
    bytes calldata data
  )
    external
    view
    override
    returns (bool)
  {
    (
      address base,
      address quote
    ) = abi.decode(data[4:], (address, address));
    bytes memory pairData = abi.encode(base, quote);
    return _hasAccess(account, pairData) || _isEOA(account);
  }

  function subscribeLocalAccess(
    address user,
    bytes calldata data,
    uint256 subscriptionPeriod
  )
    external
  {
    require(subscriptionPeriod >= minSubscriptionPeriod, "Subscription period below minimum");
    uint256 requiredBOBA = paymentPerSecondLocalAccess.mul(subscriptionPeriod);
    require(BobaTokenInterface(bobaTokenAddress).transferFrom(msg.sender, address(this), requiredBOBA), "token transfer failed");

    // check current expiry
    uint256 currentExpiryTime = s_localAccessList[user][data];

    // if already active subscription add more credits
    uint256 newExpiryTime;
    if (currentExpiryTime >= block.timestamp) {
      newExpiryTime = currentExpiryTime.add(subscriptionPeriod);
    } else {
      // if not active subscription
      newExpiryTime = block.timestamp.add(subscriptionPeriod);
    }

    _addLocalAccess(user, data, newExpiryTime);
  }

  // simplify, reduce contract size
  function subscribeGlobalAccess(
    address user,
    uint256 subscriptionPeriod
  )
    external
  {
    require(subscriptionPeriod >= minSubscriptionPeriod, "Subscription period below minimum");
    uint256 requiredBOBA = paymentPerSecondGlobalAccess.mul(subscriptionPeriod);
    require(BobaTokenInterface(bobaTokenAddress).transferFrom(msg.sender, address(this), requiredBOBA), "token transfer failed");

    // check current expiry
    uint256 currentExpiryTime = s_globalAccessList[user];

    // if already active subscription add more credits
    uint256 newExpiryTime;
    if (currentExpiryTime >= block.timestamp) {
      newExpiryTime = currentExpiryTime.add(subscriptionPeriod);
    } else {
      // if not active subscription
      newExpiryTime = block.timestamp.add(subscriptionPeriod);
    }

    _addGlobalAccess(user, newExpiryTime);
  }

  function updateSubscriptionCost(
    uint256 _paymentPerSecondLocalAccess,
    uint256 _paymentPerSecondGlobalAccess,
    uint256 _minSubscriptionPeriod
  )
    external
    onlyOwner()
  {
    _updateSubscriptionCost(
      _paymentPerSecondLocalAccess,
      _paymentPerSecondGlobalAccess,
      _minSubscriptionPeriod
    );
  }

  function withdrawFunds(
    address recipient,
    uint256 amount
  )
    external
    onlyOwner()
  {
    require(BobaTokenInterface(bobaTokenAddress).transfer(recipient, amount), "token transfer failed");
    emit OwnerWithdrawFunds(recipient, amount);
  }

  function _updateSubscriptionCost(
    uint256 _paymentPerSecondLocalAccess,
    uint256 _paymentPerSecondGlobalAccess,
    uint256 _minSubscriptionPeriod
  ) internal {
    paymentPerSecondLocalAccess = _paymentPerSecondLocalAccess;
    paymentPerSecondGlobalAccess = _paymentPerSecondGlobalAccess;
    minSubscriptionPeriod = _minSubscriptionPeriod;

    emit SubscriptionCostUpdated(_paymentPerSecondLocalAccess, _paymentPerSecondGlobalAccess, _minSubscriptionPeriod);
  }

  function _hasAccess(
    address user,
    bytes memory data
  )
    internal
    view
    returns (bool)
  {
    return !s_checkEnabled || s_globalAccessList[user] >= block.timestamp || s_localAccessList[user][data] >= block.timestamp;
  }

  function _isEOA(
    address account
  )
    internal
    view
    returns (bool)
  {
    return account == tx.origin; // solhint-disable-line avoid-tx-origin
  }
}