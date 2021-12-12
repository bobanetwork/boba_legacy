//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.12;

import "hardhat/console.sol";

interface Helper {
  function TuringTx(uint32 method_idx, bytes memory) external returns (bytes memory);
  //function TuringCall(uint32 method_idx, bytes memory) view external returns (bytes memory);
}

contract HelloTuring {

  address public helperAddr;
  Helper myHelper;

  mapping (address => string) locales;
  mapping (address => string) cachedGreetings;

  uint256 public addResult;

  constructor(address _helper) public {
    console.log("HelloTuring.sol: Deploying a contract with helper address:", _helper);
    helperAddr = _helper;
    myHelper = Helper(helperAddr);
    addResult = 0;
  }

  /* Tests the eth_call pathway by returning a customized
     greeting for the specified locale. This only requires a
     passthrough call to the helper contract.
  */
  //CustomGreetingFor(string) = 530f8fcf
  function CustomGreetingFor(string memory locale)
    public returns (string memory) {

    bytes memory encoded = abi.encode(locale);
    bytes memory response = myHelper.TuringTx(0, encoded);
    return abi.decode(response,(string));
  }

  /* Tests the eth_sendRawTransaction pathway by fetching
     a personalized greeting string for the user's chosen locale
     and storing it for later reference.

     As a future enhancement, this method could send the resulting
     greeting string in an Event rather than requiring the user to
     query for it later.
  */
  function SetMyLocale(string memory locale) public {
      
    locales[msg.sender] = locale;
    bytes memory encoded = abi.encode(locale);
    bytes memory response = myHelper.TuringTx(0, encoded);
    cachedGreetings[msg.sender] = abi.decode(response,(string));
  }

  /* Return the value set by a previous call to SetMyLocale() */
  function PersonalGreeting()
    public view returns (string memory) {
    
    string memory greeting = cachedGreetings[msg.sender];
    require (bytes(greeting).length > 0, "No cached greeting string for this user");
    return greeting;
  }

  /* Examples of performing off-chain calculations on numeric data */
  function AddNumbers(uint112 a, uint112 b) 
    public returns (uint256) {
    
    bytes memory encRequest = abi.encode(a, b);
    bytes memory encResponse = myHelper.TuringTx(0, abi.encode(a, b));
    addResult = abi.decode(encResponse,(uint256));
    return addResult;
  }

  function MultNumbers(uint112 a, uint112 b) 
    public returns (uint256) {
    
    bytes memory encRequest = abi.encode(a, b);
    bytes memory encResponse = myHelper.TuringTx(1, encRequest);
    return abi.decode(encResponse,(uint256));
  }

  function MultFloatNumbers(string memory a, string memory b, uint32 methodID) 
    public returns (string memory) {
    
    bytes memory encRequest = abi.encode(a, b);
    bytes memory encResponse = myHelper.TuringTx(methodID, encRequest);
    return abi.decode(encResponse,(string));
  }

  // function isCatOrDog(string memory url) public view returns (string memory) {
  //   string memory result;
  //   bytes memory encRequest = abi.encode(url);
  //   bytes memory encResponse = myHelper.TuringCall(3, encRequest);
  //   result = abi.decode(encResponse, (string));
  //   return result;
  // }
}
