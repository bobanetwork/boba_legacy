// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "./IL2StandardERC721.sol";

contract L2StandardERC721 is IL2StandardERC721, ERC721 {
    address public override l1Contract;
    address public l2Bridge;
    string private baseTokenURI;

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
        bytes4 bridgingSupportedInterface = IL2StandardERC721.l1Contract.selector
            ^ IL2StandardERC721.mint.selector
            ^ IL2StandardERC721.burn.selector;

        return _interfaceId == bridgingSupportedInterface || super.supportsInterface(_interfaceId);
    }

    function mint(address _to, uint256 _tokenId, bytes memory _data) public virtual override onlyL2Bridge {
        _mint(_to, _tokenId);

        emit Mint(_to, _tokenId);
    }

    function burn(uint256 _tokenId) public virtual override onlyL2Bridge {
        _burn(_tokenId);

        emit Burn(_tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }
}
