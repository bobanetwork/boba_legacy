// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC1155
 * @dev A super simple ERC1155 implementation!
 */
contract L1ERC1155 is Ownable, ERC1155 {

    constructor(
        string memory _uri
    )
        public
        ERC1155(_uri)
    {}

    function mint(address _to, uint256 _tokenId, uint256 _amount) public onlyOwner {
        _mint(_to, _tokenId, _amount, "");
    }

    function mintBatch(address _to, uint256[] memory _tokenIds, uint256[] memory _amounts) public onlyOwner {
        _mintBatch(_to, _tokenIds, _amounts, "");
    }
}
