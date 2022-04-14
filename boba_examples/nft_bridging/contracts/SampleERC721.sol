// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC721
 * @dev A super simple ERC721 implementation!
 */
contract SampleERC721 is Ownable, ERC721 {
    constructor()
        ERC721(
            "Bubble",
            "BUBL"
        ) {
    }

    function mint(address _to, uint256 _tokenId) public onlyOwner {
        _safeMint(_to, _tokenId);
    }
}
