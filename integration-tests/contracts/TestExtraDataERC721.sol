// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestExtraDataERC721
 * @dev A custom derivable data ERC721
 */
contract TestExtraDataERC721 is Ownable, ERC721 {
    mapping(uint256 => string) private _tokenURIs;

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

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    // special method to expose extra bridge data
    function bridgeExtraData(uint256 tokenId) public view virtual returns(bytes memory) {
        return abi.encode(_tokenURIs[tokenId]);
    }

    // special method override to specify the use
    function supportsInterface(bytes4 _interfaceId) public view virtual override returns (bool) {
        return _interfaceId == this.bridgeExtraData.selector || super.supportsInterface(_interfaceId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");
        return string(abi.encodePacked(_tokenURIs[tokenId], 'xyz'));
    }
}
