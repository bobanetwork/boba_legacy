// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "./L2StandardERC721.sol";

/**
* Custom L2 ERC721, add your custom logic which you also need on the other chain.
*/
contract L2CustomERC721 is L2StandardERC721 {

    /**
     * @param _l2Bridge Address of the L2 standard bridge.
     * @param _l1Contract Address of the corresponding L1 NFT contract.
     * @param _name ERC721 name.
     * @param _symbol ERC721 symbol.
     */
    constructor(
        address _l2Bridge,
        address _l1Contract,
        string memory _name,
        string memory _symbol,
        string memory _baseTokenURI
    )
        L2StandardERC721(_l2Bridge, _l1Contract, _name, _symbol, _baseTokenURI) {}

    function mint(address _to, uint256 _tokenId, bytes memory _data) public virtual override onlyL2Bridge {
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
