//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.12;

contract TuringHelper {

  TuringHelper Self;

  event OffchainResponse(uint version, bytes responseData);
  event OffchainRandom(uint version, uint256 random);
  event Offchain42(uint version, uint256 random);

  constructor () public {
    Self = TuringHelper(address(this));
  }

  function GetErrorCode(uint32 rType) 
    internal view returns (string memory) {
      if(rType ==  1) return "TURING: Geth intercept failure";
      if(rType == 10) return "TURING: Incorrect input state (rType==1)";
      if(rType == 11) return "TURING: Calldata too short";
      if(rType == 12) return "TURING: URL too long (>64)";
      if(rType == 13) return "TURING: Server error";
      if(rType == 14) return "TURING: Could not decode server response";
      if(rType == 15) return "TURING: Could not create rpc client";
      if(rType == 16) return "TURING: Random number generation failure";
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

  function Get42(uint32 rType, uint256 _random)
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
    public returns (bytes memory) {
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
    public returns (uint256) {

      uint256 response = Self.GetRandom(1, 0);
      emit OffchainRandom(0x01, response);
      return response;
  }

  function Turing42()
    public returns (uint256) {

      uint256 response = Self.Get42(2, 42);
      emit Offchain42(0x01, response);
      return response;
  }

}