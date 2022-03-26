// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUniqueDataERC721
 * @dev A custom data ERC721
 */
contract TestUniqueDataERC721 is Ownable, ERC721URIStorage {
    constructor(
        string memory name,
        string memory symbol
    )
        ERC721(
            name,
            symbol
        ) {
    }

    function mint(address _to, uint256 _tokenId, string memory _tokenURI) public onlyOwner {
        _safeMint(_to, _tokenId);
        _setTokenURI(_tokenId, _tokenURI);
    }
}
