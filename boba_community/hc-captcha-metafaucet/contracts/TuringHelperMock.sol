//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TuringHelperMock is Ownable {

    bytes private turingTxResp;

    function mockResponse(bytes memory resp) external {
         turingTxResp = resp;
    }

    /* Called from the external contract. It takes an api endponit URL
       and an abi-encoded request payload.
    */
    function TuringTxV2(string memory _url, bytes memory _payload)
    public returns (bytes memory) {
        require (_payload.length > 0, "Turing:TuringTx:no payload");
        return turingTxResp;
    }
}
