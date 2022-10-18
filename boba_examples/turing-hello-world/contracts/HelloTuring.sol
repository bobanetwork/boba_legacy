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

        bytes memory encResponse = myHelper.TuringTxV2(_url, encRequest);

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
      bytes memory encResponse = myHelper.TuringTxV2(_url, encRequest);

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

    // A method of generating a cached random number using the V2 API. Use with caution
    // as a hostile client may be able to force a desired outcome by submitting repeated
    // transactions to eth_estimateGas() before sending one as a real transaction
    
    function getSingleRandomV2()
    public returns (uint256) {

	bytes32 sKey = keccak256("123");
        uint256 r1;
	bytes32 r2;
	(r1, r2) = myHelper.TuringRandomV2(sKey,0,0x1122334455667788112233445566778811223344556677881122334455667788);
	
	require(r1 == 0, "Should return 0 for cNum==0");
	r1 = uint256(r2);
	
        emit GetRandom(r1);
        return r1;
    }
    
   // function nextRandomV2(uint256 cNum, uint256 cNext) {
   // 
   // }
    
    // This should fail to generate and reveal a V2 random number in a single Tx.    
    function cheatRandomV2() public {
 	bytes32 sKey = keccak256("abc");
	
	uint256 cSecret = 1234;
	bytes32 cHash = keccak256(abi.encodePacked(cSecret));
	
        uint256 r1;
	bytes32 r2;
	
	(r1, r2) = myHelper.TuringRandomV2(sKey, 0, cHash);
	
	(r1, r2) = myHelper.TuringRandomV2(sKey, cSecret, "0x");

	emit GetRandom(r1);
    }
    
    // Called repeatedly to generate a sequence of random numbers
    // Stage number is used as the client secret.
    bytes32 prevHash; 
    function seqRandomV2(uint32 stage, bool last) public {
      bytes32 sKey = keccak256("qwerty");
      uint256 cNum = stage;
      bytes32 cNextHash;

      if (!last) {
        cNextHash = keccak256(abi.encodePacked(cNum + 1));
      }
      uint256 rNum;
      bytes32 rNextHash;
      
      (rNum, rNextHash) = myHelper.TuringRandomV2(sKey, cNum, cNextHash);
      emit GetRandom(rNum);
      
      if (stage != 0) {
        // Recover the server secret and test it against prevHash
	uint256 sNum = rNum ^ cNum;
	bytes32 sHash = keccak256(abi.encodePacked(sNum));
	require(sHash == prevHash, "Server secret does not match prevHash");
      }
      prevHash = rNextHash;
    }
}




