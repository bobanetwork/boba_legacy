//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./ITuringHelper.sol";

contract HelloTuring {

    address public helperAddr;
    ITuringHelper myHelper;

    event MultFloatNumbers(uint256);
    event MultArray(uint256);
    event GetRandom(uint256);
    event Get42(uint256);

    constructor(
        address _helper
    ) public {
        helperAddr = _helper;
        myHelper = ITuringHelper(helperAddr);
    }

    function multFloatNumbers(string memory _url, string memory a)
    public returns (uint256) {

        bytes memory encRequest = abi.encode(a);

        bytes memory encResponse = myHelper.TuringTxV1(_url, encRequest);

        uint256 product = abi.decode(encResponse, (uint256));

        // Test case to ensure revert string is reported to client
        require(product != 0, "Multiply by zero error");

        emit MultFloatNumbers(product);

        return product;
    }

    // Tests a Turing method which returns a variable-length array.
    // The parameters 'a' and 'b' are passed in the request, returing
    // an array of 'b' elements each with value 'a'. This function
    // adds all of the returned values and returns a total of (a*b)
    function multArray(string memory _url, uint256 a, uint256 b)
      public {
      uint256 sum = 0;

      bytes memory encRequest = abi.encode(a,b);
      bytes memory encResponse = myHelper.TuringTxV1(_url, encRequest);

      uint256[] memory ary = abi.decode(encResponse, (uint256[]));

      uint256 i = 0;
      for (i = 0; i<ary.length; i++)
      {
        sum += ary[i];
      }

      emit MultArray(sum);
    }

    function getRandom()
    public returns (uint256) {

        uint256 result = myHelper.TuringRandom();

        emit GetRandom(result);

        return result;
    }

    function get42()
    public returns (uint256) {

        uint256 result = myHelper.Turing42();

        emit Get42(result);

        return result;
    }

}




