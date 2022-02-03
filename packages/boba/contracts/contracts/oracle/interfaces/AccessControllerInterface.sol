// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

interface AccessControllerInterface {
  function hasAccess(address user, bytes calldata data) external view returns (bool);
}