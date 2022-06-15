//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import "./interfaces/ITuringHelper.sol";

contract TuringHelper is ITuringHelper, Ownable {

  TuringHelper Self;

  // This protects your own credits for this helper contract
  mapping(address => bool) public permittedCaller;

  event AddPermittedCaller(address _callerAddress);
  event RemovePermittedCaller(address _callerAddress);
  event CheckPermittedCaller(address _callerAddress, bool permitted);
  event OffchainResponse(uint version, bytes responseData);
  event OffchainRandom(uint version, uint256 random);

  modifier onlyPermittedCaller() {
    require(
      permittedCaller[msg.sender],
      'Invalid Caller Address'
    );
    _;
  }

  constructor () public {
    Self = TuringHelper(address(this));
  }

  function addPermittedCaller(address _callerAddress)
    public onlyOwner {
      permittedCaller[_callerAddress] = true;
      emit AddPermittedCaller(_callerAddress);
  }

  function removePermittedCaller(address _callerAddress)
    public onlyOwner {
      permittedCaller[_callerAddress] = false;
      emit RemovePermittedCaller(_callerAddress);
  }

  function checkPermittedCaller(address _callerAddress)
    public returns (bool) {
      bool permitted = permittedCaller[_callerAddress];
      emit CheckPermittedCaller(_callerAddress, permitted);
      return permitted;
  }

  function GetErrorCode(uint32 rType)
    internal view returns (string memory) {
      if(rType ==  1) return "TURING: Geth intercept failure";
      if(rType == 10) return "TURING: Incorrect input state";
      if(rType == 11) return "TURING: Calldata too short";
      if(rType == 12) return "TURING: URL >64 bytes";
      if(rType == 13) return "TURING: Server error";
      if(rType == 14) return "TURING: Could not decode server response";
      if(rType == 15) return "TURING: Could not create rpc client";
      if(rType == 16) return "TURING: RNG failure";
      if(rType == 17) return "TURING: API Response >322 chars";
      if(rType == 18) return "TURING: API Response >160 bytes";
      if(rType == 19) return "TURING: Insufficient credit";
      if(rType == 20) return "TURING: Missing cache entry";
  }

  /* This is the interface to the off-chain mechanism. Although
     marked as "public", it is only to be called by TuringCall()
     or TuringTX().
     The _payload parameter is overloaded to represent either the
     request parameters or the off-chain response, with the rType
     parameter indicating which is which.
     When called as a request (rType == 1), it starts the offchain call,
     which, if all all goes well, results in the rType changing to 2.
     This response is then passed back to the caller.
  */
  function GetResponse(uint32 rType, string memory _url, bytes memory _payload)
    public returns (bytes memory) {

    require (msg.sender == address(this), "Turing:GetResponse:msg.sender != address(this)");
    require (_payload.length > 0, "Turing:GetResponse:no payload");
    require (rType == 2, string(GetErrorCode(rType))); // l2geth can pass values here to provide debug information
    return _payload;
  }

  function GetRandom(uint32 rType, uint256 _random)
    public returns (uint256) {

    require (msg.sender == address(this), "Turing:GetResponse:msg.sender != address(this)");
    require (rType == 2, string(GetErrorCode(rType)));
    return _random;
  }

  /* Called from the external contract. It takes an api endponit URL
     and an abi-encoded request payload. The URL and the list of allowed
     methods are supplied when the contract is created. In the future
     some of this registration might be moved into l2geth, allowing for
     security measures such as TLS client certificates. A configurable timeout
     could also be added.

     Logs the offchain response so that a future verifier or fraud prover
     can replay the transaction and ensure that it results in the same state
     root as during the initial execution. Note - a future version might
     need to include a timestamp and/or more details about the
     offchain interaction.
  */
  function TuringTx(string memory _url, bytes memory _payload)
    public onlyPermittedCaller override returns (bytes memory) {
      require (_payload.length > 0, "Turing:TuringTx:no payload");

      /* Initiate the request. This can't be a local function call
         because that would stay inside the EVM and not give l2geth
         a place to intercept and re-write the call.
      */
      bytes memory response = Self.GetResponse(1, _url, _payload);
      emit OffchainResponse(0x01, response);
      return response;
  }

  function TuringRandom()
    public onlyPermittedCaller returns (uint256) {

      uint256 response = Self.GetRandom(1, 0);
      emit OffchainRandom(0x01, response);
      return response;
  }

    // ERC165 check interface
    function supportsInterface(bytes4 _interfaceId) public pure returns (bool) {
        bytes4 firstSupportedInterface = bytes4(keccak256("supportsInterface(bytes4)")); // ERC165
        bytes4 secondSupportedInterface = ITuringHelper.TuringTx.selector;
        return _interfaceId == firstSupportedInterface || _interfaceId == secondSupportedInterface;
    }
}
