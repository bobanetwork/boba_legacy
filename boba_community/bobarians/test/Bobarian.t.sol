// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../contracts/Bobarian.sol";

contract BobarianTest is Test {
    Bobarian bobarian;

    function testInit() public {
        assertEq(uint(1), uint(1), "Should always go through, 1=1");
    }
}
