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

contract TestDeleteSlot {
    uint256 public testInt;
    uint256[5] public testArray;

    function deleteIntSlot() public {
        delete testInt;
    }
    function deleteArraySlot(uint256 _index) public {
        delete testArray[_index];
    }
    function setArray(uint256[5] memory _array) public {
        testArray = _array;
    }
    function setInt(uint256 _testInt) public {
        testInt = _testInt;
    }
}
