// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@bobanetwork/contracts/contracts/standards/L2StandardERC721.sol";

/**
* A Failing mint L2ERC721 contract
*/
contract TestFailingMintL2StandardERC721 is L2StandardERC721 {
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
        revert("mint failing");
    }
}
