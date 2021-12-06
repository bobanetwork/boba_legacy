//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.12;

import "hardhat/console.sol";

interface Helper {
  function TuringCall(uint32 method_idx, bytes memory) view external returns (bytes memory);
  function TuringTx(uint32 method_idx, bytes memory) external returns (bytes memory);
}

contract HelloTuring {
  address helperAddr;
  Helper myHelper;

  mapping (address => string) locales;
  mapping (address => string) cachedGreetings;

  constructor(address _helper) public {
    console.log("Deploying a contract with helper address:", _helper);
    helperAddr = _helper;
    myHelper = Helper(helperAddr);
  }

  /* This tests the eth_call pathway by returning a customized
     greeting for the specified locale. This only requires a
     passthrough call to the helper contract.
  */
  function CustomGreetingFor(string memory locale)
    public view returns (string memory) {

    bytes memory response = myHelper.TuringCall(0, abi.encode(locale));
    return abi.decode(response,(string));
  }

  /* This tests the eth_sendRawTransaction pathway by fetching
     a personalized greeting string for the user's chosen locale
     and storing it for later reference.

     As a future enhancement, this method could send the resulting
     greeting string in an Event rather than requiring the user to
     query for it later.
  */
  function SetMyLocale(string memory locale) public {
    console.log("Registering locale for user:", msg.sender, locale);
    bytes memory localebytes = bytes(locale);
    require(localebytes.length <= 5 && localebytes.length > 0,
       "Invalid Locale"); // Example uses "EN_US" etc

    locales[msg.sender] = locale;
    bytes memory response =  myHelper.TuringTx(0, abi.encode(locale));
    cachedGreetings[msg.sender] = abi.decode(response,(string));
  }

  /* Return the value set by a previous call to SetMyLocale() */
  function PersonalGreeting()
    public view returns (string memory) {
    string memory greeting = cachedGreetings[msg.sender];
    require (bytes(greeting).length > 0, "No cached greeting string for this user");

    return greeting;
  }

  /* Example of performing off-chain calculations on numeric data types */
  function AddNumbers(uint112 a, uint112 b) public view returns (uint256) {
    uint256 c;
    bytes memory encRequest = abi.encode(a, b);
    bytes memory encResponse = myHelper.TuringCall(1, encRequest);
    c = abi.decode(encResponse,(uint256));
    return c;
  }

  function MultNumbers(uint112 a, uint112 b) public view returns (uint256) {
    uint256 c;
    bytes memory encRequest = abi.encode(a, b);
    bytes memory encResponse = myHelper.TuringCall(2, encRequest);
    c = abi.decode(encResponse,(uint256));
    return c;
  }

  function isCatOrDog(string memory url) public view returns (string memory) {
    string memory result;
    bytes memory encRequest = abi.encode(url);
    bytes memory encResponse = myHelper.TuringCall(3, encRequest);
    result = abi.decode(encResponse, (string));
    return result;
  }
}
