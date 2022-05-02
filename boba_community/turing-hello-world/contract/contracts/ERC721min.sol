//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface Helper {
  function TuringRandom() external returns (uint256);
}

/**
 * @title ERC721Mock
 * This mock just provides a public safeMint, mint, and burn functions for testing purposes
 */
contract ERC721min is ERC721 {

    address public helperAddr;
    Helper myHelper;

    event MintedRandom(uint256, uint8, uint8);

    constructor(
      string memory name, 
      string memory symbol,
      address _helper) ERC721(name, symbol) {
        helperAddr = _helper;
        myHelper = Helper(helperAddr);
    }

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function mint(address to, uint256 tokenId) public {
      uint256 result = myHelper.TuringRandom();
      bytes memory i_bytes = abi.encodePacked(result);
      uint8 attribute_a = uint8(i_bytes[0]);
      uint8 attribute_b = uint8(i_bytes[1]);
      // use the attributes here to e.g. set URI/Attributes etc
      _mint(to, tokenId);
      emit MintedRandom(result, attribute_a, attribute_b);
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        _safeMint(to, tokenId, _data);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }
}