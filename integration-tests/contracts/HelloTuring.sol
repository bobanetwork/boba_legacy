//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./ITuringHelper.sol";

contract HelloTuring {

    address public helperAddr;
    ITuringHelper myHelper;
    HelloTuring Self;

    event MultFloatNumbers(uint256);
    event GetRandom(uint256);
    event Get42(uint256);

    constructor(
        address _helper
    ) public {
        helperAddr = _helper;
        myHelper = ITuringHelper(helperAddr);
        Self = HelloTuring(address(this));
    }

    function multFloatNumbers(string memory _url, string memory a)
        public returns (uint256)
    {
        bytes memory encRequest = abi.encode(a);

        bytes memory encResponse = myHelper.TuringTx(_url, encRequest);

        uint256 product = abi.decode(encResponse, (uint256));

        // Test case to ensure revert string is reported to client
        require(product != 0, "Multiply by zero error");

        emit MultFloatNumbers(product);

        return product;
    }

    function getRandom()
        public returns (uint256)
    {
        uint256 result = myHelper.TuringRandom();

        emit GetRandom(result);

        return result;
    }

    function get42()
        public returns (uint256)
    {
        uint256 result = myHelper.Turing42();

        emit Get42(result);

        return result;
    }

    // Although we document that a transaction may only perform one Turing operation,
    // some applications do it anyway. The following function tests the mode which we
    // continue to support
    function MultiRandom()
        public returns (uint256)
    {
 	    uint256 first = myHelper.TuringRandom();
 	    uint256 result = myHelper.TuringRandom();
 	    emit GetRandom(result);
 	    return result;
     }

    // This function is now expected to fail
    function NestedRandom(uint256 level)
        public returns (uint256)
    {
        uint256 result;
 	    if (level == 0) {
            result = myHelper.TuringRandom();
 	        emit GetRandom(result);
 	    } else {
            uint256 dummy = myHelper.TuringRandom();
            result = Self.NestedRandom(level - 1);
 	    }
 	    return result;
     }

    // This function is expected to fail if n1 != n2. Previously the
    // second call would succeed but would receive the saved result from
    // the prior off-chain call.
    function MixedInput(string memory url, uint256 n1, uint256 n2)
        public returns (uint256)
    {
 	    uint256 result;
 	    bytes memory r1 = myHelper.TuringTx(url, abi.encode(n1));
 	    bytes memory r2 = myHelper.TuringTx(url, abi.encode(n2));
 	    result = abi.decode(r2, (uint256));
 	    emit GetRandom(result);
 	    return result;
     }

}




