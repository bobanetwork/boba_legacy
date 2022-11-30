// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AddRecover is Ownable {

    /// @dev Recovers ERC20 tokens accidentally sent to the contract.
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), tokenAmount);
    }

    /// @dev Recovers ERC721 tokens accidentally sent to the contract.
    function recoverERC721(address tokenAddress, uint256 tokenId_) external onlyOwner {
        IERC721(tokenAddress).transferFrom(address(this), owner(), tokenId_);
    }
}
