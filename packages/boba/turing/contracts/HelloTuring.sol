//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.12;

import "hardhat/console.sol";

interface Helper {
  function TuringCallDryRun(uint32 method_idx, bytes memory) view external returns (bytes memory);
  function TuringCall(uint32 method_idx, bytes memory) view external returns (bytes memory);
  function TuringTx(uint32 method_idx, bytes memory) external returns (bytes memory);
}

contract HelloTuring {

  address public helperAddr;
  Helper myHelper;

  mapping (address => string) locales;
  mapping (address => string) cachedGreetings;

  event RegisteringLocale(address sender, string locale);
  event LocaleBytes(bytes localeBytes);

  constructor(address _helper) public {
    console.log("HelloTuring.sol: Deploying a contract with helper address:", _helper);
    helperAddr = _helper;
    myHelper = Helper(helperAddr);
  }

  /* This tests the eth_call pathway by returning a customized
     greeting for the specified locale. This only requires a
     passthrough call to the helper contract.
  */

  //CustomGreetingFor(string)
  //530f8fcf
  //CustomGreetingFor(string,uint32)
  //bf62d557
  
  /*
  0x
  530f8fcf
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 20 //32?
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 05 //string length
  45 4e 5f 55 53 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 //EN_US string

  0x
  bf62d557
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 40 //64?
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2a //42
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 05 //string length
  45 4e 5f 55 53 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00

  0x
  4f9d6d19
  0000000000000000000000000000000000000000000000000000000000000060 //96 - length of inputs
  000000000000000000000000000000000000000000000000000000000000002a //value 1 = 42
  00000000000000000000000000000000000000000000000000000000000004d2 //value 2 = 1234
  0000000000000000000000000000000000000000000000000000000000000003 //string length
  454e5f0000000000000000000000000000000000000000000000000000000000 //the string
  uint32
  unit32
  string
  */

  //CustomGreetingFor(string)
  //530f8fcf
  function CustomGreetingFor(string memory locale)
    public view returns (string memory) {

    bytes memory encode = abi.encode(locale);
    bytes memory response = myHelper.TuringCall(0, encode);
    string memory decoded = abi.decode(response,(string));
    //return abi.decode(myHelper.TuringCall(0, abi.encode(locale)),(string));
    return response;
  }

  /* This tests the eth_call payload by returning it directly
  */
  function CustomGreetingForDryRun(string memory locale)
    public view returns (bytes memory) {

    bytes memory encode = abi.encode(locale);
    bytes memory response = myHelper.TuringCallDryRun(0, encode);
    //string memory decoded = abi.decode(response,(string));
    return response;
  }

  function CustomGreetingMinimal(string memory locale)
    public view returns (string memory) {

    //bytes memory response = myHelper.TuringCallDryRun(0, abi.encode(locale));
    string memory response = "TURING_";
    return response;
  }

  function CustomGreetingABIcycle(string memory locale)
    public view returns (string memory) {

    //bytes memory response = myHelper.TuringCallDryRun(0, abi.encode(locale));
    bytes memory response = abi.encode(locale);
    string memory decoded = abi.decode(response,(string));
    return decoded;
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
    emit RegisteringLocale(msg.sender, locale);
    
    bytes memory localebytes = bytes(locale);
    emit LocaleBytes(localebytes);
    
    require(localebytes.length <= 5 && localebytes.length > 0,"Invalid Locale"); // Example uses "EN_US" etc
    require(abi.encode(locale).length > 0, "abi.encode broken");
    
    locales[msg.sender] = locale;
    
    bytes memory response = myHelper.TuringTx(0, abi.encode(locale));
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
