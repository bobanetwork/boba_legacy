// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@bobanetwork/contracts/contracts/standards/L1StandardERC1155.sol";

/**
* A Failing mint L1ERC1155 contract
*/
contract TestFailingMintL1StandardERC1155 is L1StandardERC1155 {
    /**
     * @param _l1Bridge Address of the L1 standard bridge.
     * @param _l2Contract Address of the corresponding L2 token contract.
     * @param _uri uri.
     */
    constructor(
        address _l1Bridge,
        address _l2Contract,
        string memory _uri
    )
        L1StandardERC1155(_l1Bridge, _l2Contract, _uri) {}

    function mint(address _to, uint256 _tokenId, uint256 _amount, bytes memory _data) public virtual override onlyL1Bridge {
        revert("mint failing");
    }

    function mintBatch(address _to, uint256[] memory _tokenId, uint256[] memory _amount, bytes memory _data) public virtual override onlyL1Bridge {
        revert("mint failing");
    }
}
