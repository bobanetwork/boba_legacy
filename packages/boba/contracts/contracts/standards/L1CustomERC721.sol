// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "./L1StandardERC721.sol";

/**
* Custom L1 ERC721, add your custom logic which you also need on the other chain.
*/
contract L1CustomERC721 is L1StandardERC721 {

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
    }

    /**
    * @dev Override the tokenURI method to return your onChain metadata.
    * You basically can just copy the same logic from your original ERC721 contract.
    */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        revert("Not implemented");
    }
}
