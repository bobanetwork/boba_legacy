//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./ITuringHelper.sol";

contract TuringTest is ITuringHelper {

  string public url;
  bytes public payload;

  function TuringTx(string memory _url, bytes memory _payload)
    public override returns (bytes memory) {
        url = _url;
        payload = _payload;
        return _payload;
  }

    // ERC165 check interface
    function supportsInterface(bytes4 _interfaceId) public pure returns (bool) {
        bytes4 firstSupportedInterface = bytes4(keccak256("supportsInterface(bytes4)")); // ERC165
        bytes4 secondSupportedInterface = ITuringHelper.TuringTx.selector;
        return _interfaceId == firstSupportedInterface || _interfaceId == secondSupportedInterface;
    }
}
