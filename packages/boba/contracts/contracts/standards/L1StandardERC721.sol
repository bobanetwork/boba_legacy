// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "./IL1StandardERC721.sol";

contract L1StandardERC721 is IL1StandardERC721, ERC721 {
    address public override l2Contract;
    address public l1Bridge;
    string private baseTokenURI;

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
        ERC721(_name, _symbol) {
        l2Contract = _l2Contract;
        l1Bridge = _l1Bridge;
        baseTokenURI = _baseTokenURI;
    }

    modifier onlyL1Bridge {
        require(msg.sender == l1Bridge, "Only L1 Bridge can mint and burn");
        _;
    }

    function supportsInterface(bytes4 _interfaceId) public view override(IERC165, ERC721) returns (bool) {
        bytes4 bridgingSupportedInterface = IL1StandardERC721.l2Contract.selector
            ^ IL1StandardERC721.mint.selector
            ^ IL1StandardERC721.burn.selector;
        return _interfaceId == bridgingSupportedInterface || super.supportsInterface(_interfaceId);
    }

    function mint(address _to, uint256 _tokenId, bytes memory _data) public virtual override onlyL1Bridge {
        _mint(_to, _tokenId);

        emit Mint(_to, _tokenId);
    }

    function burn(uint256 _tokenId) public virtual override onlyL1Bridge {
        _burn(_tokenId);

        emit Burn(_tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }
}
