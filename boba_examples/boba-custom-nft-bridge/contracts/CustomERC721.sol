// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC721
 * @dev A custom ERC721 implementation!
 */
contract CustomERC721 is Ownable, ERC721 {
    constructor()
        ERC721(
            "Bubble",
            "BUBL"
        ) {
    }

    mapping(uint256 => string) public feature_1;
    mapping(uint256 => string) public feature_2;
    mapping(uint256 => string) public feature_3;

    function mint(address _to, uint256 _tokenId) public onlyOwner {
        _safeMint(_to, _tokenId);

        feature_1[_tokenId] = 1;
        feature_2[_tokenId] = 2;
        feature_3[_tokenId] = 3;
    }

    function bridgeToL2


}
