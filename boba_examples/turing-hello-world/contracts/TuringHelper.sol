//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';

import "./ITuringHelper.sol";

contract TuringHelper is ITuringHelper, Ownable {

  TuringHelper Self;

  // This protects your own credits for this helper contract
  mapping(address => bool) public permittedCaller;

  event AddPermittedCaller(address _callerAddress);
  event RemovePermittedCaller(address _callerAddress);
  event CheckPermittedCaller(address _callerAddress, bool permitted);
  event OffchainResponse(uint version, bytes responseData);
  event OffchainRandom(uint version, uint256 random);
  event Offchain42(uint version, uint256 random);

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
      rType = rType & 0x00ffffff; // Remove the 'version' field
      if(rType ==  1) return "TURING: Geth intercept failure";
      if(rType == 10) return "TURING: Incorrect input state";
      if(rType == 11) return "TURING: Calldata too short";
      if(rType == 12) return "TURING: URL >64 bytes";
      if(rType == 13) return "TURING: Server error";
      if(rType == 14) return "TURING: Could not decode server response";
      if(rType == 15) return "TURING: Could not create rpc client";
      if(rType == 16) return "TURING: RNG failure";
      if(rType == 17) return "TURING: API Response too long";
      if(rType == 18) return "TURING: Calldata too long";
      if(rType == 19) return "TURING: Insufficient credit";
      if(rType == 20) return "TURING: Missing cache entry";
      return "TURING: Unknown error";
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
    require ((rType & 0x00ffffff) == 2, string(GetErrorCode(rType))); // l2geth can pass values here to provide debug information
    return _payload;
  }

  function GetRandom(uint32 rType, uint256 _random)
    public returns (uint256) {

    require (msg.sender == address(this), "Turing:GetResponse:msg.sender != address(this)");
    require (rType == 2, string(GetErrorCode(rType)));
    return _random;
  }

  function GetRandomV2(uint32 rType, bytes32 _session, uint256 _num, bytes32 _nextHash)
    public returns (uint256, bytes32) {

    require (msg.sender == address(this), "Turing:GetResponse:msg.sender != address(this)");
    require ((rType & 0x00ffffff) == 2, string(GetErrorCode(rType)));
    return (_num, _nextHash);
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
  function TuringTxV2(string memory _url, bytes memory _payload)
    public onlyPermittedCaller override returns (bytes memory) {
      require (_payload.length > 0, "Turing:TuringTx:no payload");

      /* Initiate the request. This can't be a local function call
         because that would stay inside the EVM and not give l2geth
         a place to intercept and re-write the call.
      */
      bytes memory response = Self.GetResponse(0x02000001, _url, _payload);
      emit OffchainResponse(0x01, response);
      return response;
  }

  /* Legacy version which inserts an extra length parameter into
     the off-chain request and response.
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

  /* Version 2 extends the capabilities of the RNG to preserve internal state across multiple
     transactions, and adds a mechanism for the client to supply its own randomness so that a
     malicious server cannot force a pre-determined outcome. This mode requires both client and
     server to publish commitments in one transaction, revealing their secrets in a subsequent Tx.

     Note that the server-side cache will eventually expire and may be lost in the event of node
     restarts or other maintenance operations. Client applications must be able to recover from
     cache-miss conditions.
     
     It is possible to use the V2 cache mechanism to generate a random number within a single
     transaction, using the cache to preserve a result between an eth_estimateGas() call and the
     actual transaction. This has security implications but may be suitable for some use cases.
     
     Because there is a single cache in the l2geth node, a session key is calculated at various
     stages to isolate requests. The key from the client is hashed along with the msg.sender in
     this contract, and is hashed again with the address of the helper contract inside l2geth.
     
     The protocol to generate random numbers is for the user to first pick a session ID which
     has not been used previously (hashing a timestamp or block number for example). The
     user then locally generates and stores a random number X1. The user calls TuringRandomV2
     supplying the session ID, 0 for "num", and the keccak256 hash H(X1) for "next".
     
     In response to this call, the server generates its random secret Y1 and stores it in its
     internal cache using H(X1) as part of the key. The server returns H(Y1) in its 'rNext' field
     
     A client application has the option of using H(Y1) as its "random" number and making
     no further transactions using the same session ID. Y1 is generated and the cache is
     populated during the first eth_estimateGas() call for the transaction, and the cached value
     will be used in the actual transaction provided that it has not expired.
     
     Continuing with the normal sequence, the client will save the value of H(Y1) from the
     server response and then prepare the next transaction by generating and storing another
     secret X2. Using the same session key as the previous transaction, the client calls
     TuringRandomV2(session, X1, H(X2)). The server generates another secret Y2 and stores
     this into the cache keyed by H(X2), as was done for the first transaction.
     
     The server next calculates H(X1) and retrieves the corresponding cache entry containing
     its secret Y1 (returning an error on a cache miss). The server computes Z1 = (X1 xor Y1)
     and returns this as its rNum, with H(Y2) as its rNext. Becasuse both sides committed to
     particular values of X1 and Y1 while not revealing their contents, Z1 is assured to be
     unpredictable by either party.
     
     The client may recover Y1 by calculating (Z1 xor X1), and may then verify that a 
     calculated H(Y1) matches the commitment returned from the previous transaction.
     
     This sequence may continue indefinitely. To terminate the sequence the client calls
     TuringRandomV2(session, Xn, 0), i.e. completing the protocol for the current number and
     signalling that it has not generated an X(n+1). The server response contains (Zn, 0).
     
     There is no explicit mechanism to remove cache entries after use. Instead the server will
     periodically purge entries which are older than some threshold (value TBD and subject to
     change).
     
     The current block number is included when a cache entry is stored, and is checked on a
     cache retrieval to ensure that the chain has advanced by a sufficient amount (currently
     set to 1 block but future updates may introduce a larger confirmation depth). If a
     client application needs to generate more than 1 random number per block then they must
     be done in separate sessions (but this is currently not supported due to a limit of one
     Turing operation per transaction).
  */     

  function TuringRandomV2(bytes32 sKey, uint256 num, bytes32 nextHash)
    public onlyPermittedCaller returns (uint256, bytes32)
  {
    uint256 rNum;
    bytes32 rNext;
    
    bytes32 session = keccak256(abi.encodePacked(msg.sender, sKey));
    (rNum, rNext) = Self.GetRandomV2(0x02000001, session, num, nextHash);
    
    //emit OffchainRandom(0x02, num);
    return (rNum, rNext);
  }

  function Turing42()
    public onlyPermittedCaller returns (uint256) {

      uint256 response = Self.Get42(2, 42);
      emit Offchain42(0x01, response);
      return response;
  }

    // ERC165 check interface
    function supportsInterface(bytes4 _interfaceId) public pure returns (bool) {
        bytes4 firstSupportedInterface = bytes4(keccak256("supportsInterface(bytes4)")); // ERC165
        bytes4 secondSupportedInterface = ITuringHelper.TuringTx.selector;
        return _interfaceId == firstSupportedInterface || _interfaceId == secondSupportedInterface;
    }
}
