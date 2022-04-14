// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract TestSelfDestruct {
    receive() external payable {
    }

    function suicideMethod(address payable addr) public {
        selfdestruct(addr);
    }
}

contract Create2Deployer {
    TestSelfDestruct public t;

    function deploy() public {
        t = new TestSelfDestruct{salt: bytes32(0)}();
    }
}