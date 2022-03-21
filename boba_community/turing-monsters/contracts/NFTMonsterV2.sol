// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "./RandomlyAssigned.sol";
import "./AddRecover.sol";
import "./AddOnChainMetaData.sol";


contract NFTMonsterV2 is IERC2981, ERC721Burnable, ERC721Pausable, RandomlyAssigned, AddRecover, AddOnChainMetaData {

    uint256 public constant PRICE = 0; // 0.0000000001 ether;
    uint256 public constant ROYALTY_PERCENTAGE = 5; // 5 %
    uint256 public constant MAX_MINT_IN_PUBLIC = 3;
    address[] public projectOwners;

    mapping(address => uint256) public amountMintedInPublicSale;

    event MintedNFT(uint256 indexed id);

    constructor(string memory name_, string memory symbol_, uint256 maxNFTs_,
        address[] memory creatorAddresses_, address turingHelperAddress_)
    ERC721(name_, symbol_)
    RandomlyAssigned(maxNFTs_, 0, turingHelperAddress_) // Max. x NFTs available; Start counting from 0
    AddOnChainMetaData(turingHelperAddress_)
    {
        _pause();
        projectOwners = creatorAddresses_;
    }

    modifier saleIsOpen {
        require(tokenCount() <= totalSupply(), "Sale end");
        if (_msgSender() != owner()) {
            require(!paused(), "Pausable: paused");
        }
        _;
    }

    /// @notice Called with the sale price to determine how much royalty
    //          is owed and to whom.
    /// @param _tokenId - the NFT asset queried for royalty information
    /// @param _salePrice - the sale price of the NFT asset specified by _tokenId
    /// @return receiver - address of who should be sent the royalty payment
    /// @return royaltyAmount - the royalty payment amount for _salePrice
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) external override view returns (
        address receiver,
        uint256 royaltyAmount
    ) {
        return (address(this), (_salePrice * ROYALTY_PERCENTAGE)/100);
    }

    function mint(uint256 _count) external payable saleIsOpen {
        require(_count > 0 && _count <= MAX_MINT_IN_PUBLIC, "Mint not within boundaries");

        uint256 total = tokenCount();
        require(total + _count <= totalSupply(), "Max limit");
        require(msg.value >= price(_count), "Value below price");

        amountMintedInPublicSale[_msgSender()] = amountMintedInPublicSale[_msgSender()] + _count;
        require(amountMintedInPublicSale[_msgSender()] <= MAX_MINT_IN_PUBLIC, "Wallet limit reached");

        for (uint256 i = 0; i < _count; i++) {
            _mintSingle(_msgSender());
        }
    }

    function _mintSingle(address _to) private {
        uint256 id = nextToken();
        _safeMint(_to, id);

        _setTokenURI(id); // calculate random properties
        emit MintedNFT(id);
    }

    function price(uint256 _count) public pure returns (uint256) {
        return PRICE * _count;
    }

    function startTrading() external onlyOwner {
        _unpause();
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0);

        uint creatorCount = projectOwners.length;
        for (uint i = 0; i < projectOwners.length; i++) {
            _withdraw(projectOwners[i], balance / creatorCount);
        }
    }

    function _withdraw(address _address, uint256 _amount) private {
        (bool success,) = _address.call{value : _amount}("");
        require(success, "Transfer failed.");
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, AddOnChainMetaData) returns (string memory) {
        return AddOnChainMetaData.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 _interfaceId) public view override(IERC165, ERC721, AddOnChainMetaData) returns (bool) {
        return AddOnChainMetaData.supportsInterface(_interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
