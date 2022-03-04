// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "./RandomlyAssigned.sol";
import "./WithRecover.sol";
import "./WithOnChainMetaData.sol";


contract NFTMonsterV2 is ERC721Burnable, ERC721Pausable, RandomlyAssigned, WithRecover, WithOnChainMetaData {

    uint256 public constant PRICE = 0.05 ether;
    uint256 public constant MAX_MINT_IN_PUBLIC = 3;
    address[] public projectOwners;

    mapping(address => uint256) public amountMintedInPublicSale;

    event MintedNFT(uint256 indexed id);

    constructor(string memory name_, string memory symbol_, uint256 maxNFTs_,
        address[] memory creatorAddresses_, address turingHelperAddress_)
    ERC721(name_, symbol_)
    WithOnChainMetaData(turingHelperAddress_)
    RandomlyAssigned(maxNFTs_, 0, turingHelperAddress_) // Max. x NFTs available; Start counting from 0
    {
        pause(true);
        projectOwners = creatorAddresses_;
    }

    modifier saleIsOpen {
        require(tokenCount() <= totalSupply(), "Sale end");
        if (_msgSender() != owner()) {
            require(!paused(), "Pausable: paused");
        }
        _;
    }

    /**
    * For DApp UX to determine how many NFTs can be minted.
    */
    function allowedMintAmount(address account_) view external returns (uint256) {
        return MAX_MINT_IN_PUBLIC - amountMintedInPublicSale[account_];
    }

    function mint(uint256 _count) external payable saleIsOpen {
        uint256 total = tokenCount();
        require(_count > 0, "Mint more than 0");
        require(total + _count <= totalSupply(), "Max limit");
        require(msg.value >= price(_count), "Value below price");

        amountMintedInPublicSale[_msgSender()] = amountMintedInPublicSale[_msgSender()] + _count;
        require(amountMintedInPublicSale[_msgSender()] <= MAX_MINT_IN_PUBLIC);

        for (uint256 i = 0; i < _count; i++) {
            _mintSingle(_msgSender());
        }
    }

    function _mintSingle(address _to) private {
        uint id = nextToken();
        _safeMint(_to, id);
        emit MintedNFT(id);
    }

    function price(uint256 _count) public pure returns (uint256) {
        return PRICE * _count;
    }

    function pause(bool val) public onlyOwner {
        if (val == true) {
            _pause();
            return;
        }
        _unpause();
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0);

        uint creatorCount = projectOwners.length;
        for (uint i = 0; i < projectOwners.length; i++) {
            _widthdraw(projectOwners[i], balance / creatorCount);
        }
    }

    function _widthdraw(address _address, uint256 _amount) private {
        (bool success,) = _address.call{value : _amount}("");
        require(success, "Transfer failed.");
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, WithOnChainMetaData) returns (string memory) {
        return WithOnChainMetaData.tokenURI(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
