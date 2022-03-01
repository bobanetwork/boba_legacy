//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface Helper {
  function TuringTx(string memory, bytes memory) external returns (bytes memory);
  function TuringRandom() external returns (uint256);
  function Turing42() external returns (uint256);
}

contract HelloTuring {

  address public helperAddr;
  Helper myHelper;

  event MultFloatNumbers(uint256);
  event GetRandom(uint256);
  event Get42(uint256);

  constructor(
    address _helper
  ) public {
    helperAddr = _helper;
    myHelper = Helper(helperAddr);
  }

  function multFloatNumbers(string memory _url, string memory a)
    public returns (uint256) {

    bytes memory encRequest = abi.encode(a);

    bytes memory encResponse = myHelper.TuringTx(_url, encRequest);

    uint256 product = abi.decode(encResponse,(uint256));

    // Test case to ensure revert string is reported to client
    require (product != 0, "Multiply by zero error");

    emit MultFloatNumbers(product);

    return product;
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




