/**
Modified to make use of timestamp based access permissions
 */
// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import "@chainlink/contracts/src/v0.6/Owned.sol";
import "../interfaces/AccessControllerInterface.sol";

/**
 * @title AccessController
 * @notice Has two access lists: a global list and a data-specific list.
 */
contract AccessController is AccessControllerInterface, Owned {
  bool private s_checkEnabled = true;
  // address to expiryTimestamp
  mapping(address => uint256) public s_globalAccessList;
  // address to data to expiryTimestamp
  mapping(address => mapping(bytes => uint256)) public s_localAccessList;

  event AccessAdded(address user, bytes data, address sender, uint256 updatedExpiryTime);
  event CheckAccessEnabled();
  event CheckAccessDisabled();

  function checkEnabled()
    public
    view
    returns (
      bool
    )
  {
    return s_checkEnabled;
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

/**
   * @notice Adds an address to the global access list
   * @param user The address to add
   * @param expiryTime The timestamp until which access is valid
   */
  function addGlobalAccess(
    address user,
    uint256 expiryTime
  )
    external
    onlyOwner()
  {
    _addGlobalAccess(user, expiryTime);
  }

  /**
   * @notice Adds an address+data to the local access list
   * @param user The address to add
   * @param data The calldata to add
   * @param expiryTime The timestamp until which access is valid
   */
  function addLocalAccess(
    address user,
    bytes calldata data,
    uint256 expiryTime
  )
    external
    onlyOwner()
  {
    _addLocalAccess(user, data, expiryTime);
  }

  /**
   * @notice makes the access check enforced
   */
  function enableAccessCheck()
    external
    onlyOwner()
  {
    _enableAccessCheck();
  }

  /**
   * @notice makes the access check unenforced
   */
  function disableAccessCheck()
    external
    onlyOwner()
  {
    _disableAccessCheck();
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

  function _enableAccessCheck() internal {
    if (!s_checkEnabled) {
      s_checkEnabled = true;
      emit CheckAccessEnabled();
    }
  }

  function _disableAccessCheck() internal {
    if (s_checkEnabled) {
      s_checkEnabled = false;
      emit CheckAccessDisabled();
    }
  }

  function _addGlobalAccess(address user, uint256 expiryTime) internal {
    if (expiryTime > s_globalAccessList[user]) {
      s_globalAccessList[user] = expiryTime;
      emit AccessAdded(user, "", msg.sender, expiryTime);
    }
  }

  function _addLocalAccess(address user, bytes memory data, uint256 expiryTime) internal {
    if (expiryTime > s_localAccessList[user][data]) {
      s_localAccessList[user][data] = expiryTime;
      emit AccessAdded(user, data, msg.sender, expiryTime);
    }
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