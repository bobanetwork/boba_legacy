//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.12;

import "hardhat/console.sol";

contract TuringHelper {

  TuringHelper Self;

  event OffchainResponse(uint version, bytes responseData);

  constructor () public {
    Self = TuringHelper(address(this));
  }

  /* This is the interface to the off-chain mechanism. Although
     marked as "public", it is only to be called by TuringCall() 
     or TuringTX().
     The _slot parameter is overloaded to represent either the
     request parameters or the off-chain response, with the rType
     parameter indicating which is which. 
     When called as a request (rType == 1), it reverts with 
     an encoded TURING string. 
     The modified l2geth intercepts this special revert, 
     performs the off-chain interaction, then rewrites the parameters 
     and calls the method again in "response" mode (rType == 2). 
     This response is then passed back to the caller.
  */
  //GetResponse(uint32,uint32,bytes) = 638740c4f
  function GetResponse(uint32 rType, string memory _url, bytes memory _payload)
    public returns (bytes memory) {

    require (msg.sender == address(this), "Turing:GetResponse:msg.sender != address(this)");
    require (rType == 1 || rType == 2, "Turing:GetResponse:rType != 1 || 2"); // l2geth can pass 0 here to indicate an error
    require (_payload.length > 0, "Turing:GetResponse:no payload");
    
    if (rType == 1) {
      // knock knock - wake up the L2Geth
      // force a revert via 1 == 2
      // the if() avoids calling genRequestRLP unnecessarily
      require (1 == 2, "TURING_");
    }
    //if (rType == 2) -> the L2Geth has obtained fresh data for us
    return _payload;
  }

  /* This is called from the external contract. It takes a method
     selector and an abi-encoded request payload. The URL and the
     list of allowed methods are supplied when the contract is
     created. In the future some of this registration might be moved
     into l2geth, allowing for security measures such as TLS client
     certificates. A configurable timeout could also be added.

     Logs the offchain response so that a future verifier or fraud prover 
     can replay the transaction and ensure that it results in the same state 
     root as during the initial execution. Note - a future version might 
     need to include a timestamp and/or more details about the 
     offchain interaction.
  */
  function TuringTx(string memory _url, bytes memory _payload)
    public returns (bytes memory) {
      //require (method_idx < methods.length, "Turing:TuringTx:method not registered");
      require (_payload.length > 0, "Turing:TuringTx:no payload");

      /* Initiate the request. This can't be a local function call
         because that would stay inside the EVM and not give l2geth
         a place to intercept and re-write the call.
      */
      bytes memory response = Self.GetResponse(1, _url, _payload);
      emit OffchainResponse(0x01, response);
      return response;
  }

  /* Similar to TuringTx, but a "view" function and may be used from eth_call.
  */
  // function TuringCall(uint32 method_idx, bytes memory _payload)
  //   public view returns (bytes memory) {
  //     require (method_idx < methods.length, "Turing:TuringCall:method not registered");
  //     require (_payload.length > 0, "Turing:TuringCall:payload length == 0");

  //      Initiate the request. This can't be a local function call
  //        because that would stay inside the EVM and not give l2geth
  //        a place to intercept and re-write the call.
      
  //     bytes memory response = Self.GetResponse(method_idx, 1, _payload);
  //     return response;
  // }
}

