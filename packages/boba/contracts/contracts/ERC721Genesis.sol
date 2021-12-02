// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
/**
 * @title ERC721Genesis
 *
 */
contract ERC721Genesis is Ownable, ERC721Enumerable, ERC721URIStorage {

    uint256 tID;

    // Ancestral NFT
    struct Ancestor {
       address cAddress;
       string id;
       string chain;
    }

    Ancestor genesis;

    constructor (
        string memory name,
        string memory symbol,
        uint256 tID_start,
        address origin_cAddress,
        string memory origin_id,
        string memory origin_chain
    )
        ERC721(name, symbol) {
        tID = tID_start;
        genesis = Ancestor(
            origin_cAddress,
            origin_id,
            origin_chain
        );
    }

    function mintNFT(address recipient, string memory tokenURIArg) external onlyOwner returns (uint256)
    {
        _mint(recipient, tID);
        _setTokenURI(tID, tokenURIArg);
        tID += 1;
        return tID;
    }

    function getLastTID() external view returns(uint256) {
        return tID;
    }

    function getGenesis() external view returns (
        address,
        string memory,
        string memory) {
        return(genesis.cAddress, genesis.id, genesis.chain);
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function safeMint(address to, uint256 tokenId, bytes memory _data) external onlyOwner {
        _safeMint(to, tokenId, _data);
    }

    function burn(uint256 tokenId) external {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner nor approved");
        _burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage,ERC721) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721URIStorage,ERC721) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable,ERC721) returns (bool) {
        super.supportsInterface(interfaceId);
    }
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721Enumerable,ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
