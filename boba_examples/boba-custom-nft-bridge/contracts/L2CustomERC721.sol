// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "./interfaces/IL2CustomERC721.sol";

contract L2CustomERC721 is IL2CustomERC721, ERC721 {
    address public override l1Contract;
    address public l2Bridge;
    string private baseTokenURI;

    mapping(uint256 => string) public feature_1;
    mapping(uint256 => string) public feature_2;
    mapping(uint256 => string) public feature_3;

    /**
     * @param _l2Bridge Address of the L2 standard bridge.
     * @param _l1Contract Address of the corresponding L1 NFT contract.
     * @param _name ERC721 name.
     * @param _symbol ERC721 symbol.
     * @param _baseTokenURI ERC721 token uri.
     */
    constructor(
        address _l2Bridge,
        address _l1Contract,
        string memory _name,
        string memory _symbol,
        string memory _baseTokenURI
    )
        ERC721(_name, _symbol) {
        l1Contract = _l1Contract;
        l2Bridge = _l2Bridge;
        baseTokenURI = _baseTokenURI;
    }

    modifier onlyL2Bridge {
        require(msg.sender == l2Bridge, "Only L2 Bridge can mint and burn");
        _;
    }

    function supportsInterface(bytes4 _interfaceId) public view override(IERC165, ERC721) returns (bool) {
        bytes4 bridgingSupportedInterface = IL2CustomERC721.l1Contract.selector
            ^ IL2CustomERC721.mint.selector
            ^ IL2CustomERC721.burn.selector;

        return _interfaceId == bridgingSupportedInterface || super.supportsInterface(_interfaceId);
    }

    function mint(address _to, uint256 _tokenId, string calldata _feature_1, string calldata _feature_2, string calldata _feature_3, bytes memory _data) public virtual override onlyL2Bridge {
        _mint(_to, _tokenId);

        feature_1[_tokenId] = _feature_1;
        feature_2[_tokenId] = _feature_2;
        feature_3[_tokenId] = _feature_3;
    }

    function burn(uint256 _tokenId) public virtual override onlyL2Bridge {
        _burn(_tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }
}
