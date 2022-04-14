// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

contract SimpleStorage {

    uint256 public storedData;

    constructor(
        uint256 _storedData
    )
        public
    {
        storedData = _storedData;
    }

    function set(uint256 x) public {
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}