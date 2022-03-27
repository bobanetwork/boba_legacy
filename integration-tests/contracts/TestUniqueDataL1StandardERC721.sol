// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@boba/contracts/contracts/standards/L1StandardERC721.sol";

/**
* Sample L1 representation of TestUniqueDataERC721
*/
contract TestUniqueDataL1StandardERC721 is L1StandardERC721 {

    mapping(uint256 => string) private _tokenURIs;

    /**
     * @param _l1Bridge Address of the L1 standard bridge.
     * @param _l2Contract Address of the corresponding L2 NFT contract.
     * @param _name ERC721 name.
     * @param _symbol ERC721 symbol.
     */
    constructor(
        address _l1Bridge,
        address _l2Contract,
        string memory _name,
        string memory _symbol,
        string memory _baseTokenURI
    ) L1StandardERC721(_l1Bridge, _l2Contract, _name, _symbol, _baseTokenURI) {}

    function mint(address _to, uint256 _tokenId, bytes memory _data) public virtual override onlyL1Bridge {
        super.mint(_to, _tokenId, _data);

        // do something with _data
        if(_data.length != 0) {
            _setTokenURI(_tokenId, abi.decode(_data, (string)));
        }
    }

    /**
    * @dev Override the tokenURI method to return your onChain metadata.
    * You basically can just copy the same logic from your original ERC721 contract.
    */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }
}
