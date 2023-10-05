// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@bobanetwork/contracts/contracts/standards/L1StandardERC721.sol";

/**
* A Failing mint L1ERC721 contract
*/
contract TestFailingMintL1StandardERC721 is L1StandardERC721 {
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
    )
        L1StandardERC721(_l1Bridge, _l2Contract, _name, _symbol, _baseTokenURI) {}

    function mint(address _to, uint256 _tokenId, bytes memory _data) public virtual override onlyL1Bridge {
        revert("mint failing");
    }
}
