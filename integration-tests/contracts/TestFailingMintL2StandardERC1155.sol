// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@boba/contracts/contracts/standards/L2StandardERC1155.sol";

/**
* A Failing mint L2ERC1155 contract
*/
contract TestFailingMintL2StandardERC1155 is L2StandardERC1155 {
    /**
     * @param _l2Bridge Address of the L2 standard bridge.
     * @param _l1Contract Address of the corresponding L1 token contract.
     * @param _uri uri.
     */
    constructor(
        address _l2Bridge,
        address _l1Contract,
        string memory _uri
    )
        L2StandardERC1155(_l2Bridge, _l1Contract, _uri) {}

    function mint(address _to, uint256 _tokenId, uint256 _amount, bytes memory _data) public virtual override onlyL2Bridge {
        revert("mint failing");
    }

    function mintBatch(address _to, uint256[] memory _tokenId, uint256[] memory _amount, bytes memory _data) public virtual override onlyL2Bridge {
        revert("mint failing");
    }
}
