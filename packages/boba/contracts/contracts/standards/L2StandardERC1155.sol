// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "./IL2StandardERC1155.sol";

contract L2StandardERC1155 is IL2StandardERC1155, ERC1155 {
    address public override l1Contract;
    address public l2Bridge;

    /**
     * @param _l2Bridge Address of the L2 standard bridge.
     * @param _l1Contract Address of the corresponding L1 NFT contract.
     * @param _uri URI for all token types
     */
    constructor(
        address _l2Bridge,
        address _l1Contract,
        string memory _uri
    )
        ERC1155(_uri) {
        l1Contract = _l1Contract;
        l2Bridge = _l2Bridge;
    }

    modifier onlyL2Bridge {
        require(msg.sender == l2Bridge, "Only L2 Bridge can mint and burn");
        _;
    }

    function supportsInterface(bytes4 _interfaceId) public view override(IERC165, ERC1155) returns (bool) {
        bytes4 bridgingSupportedInterface = IL2StandardERC1155.l1Contract.selector
            ^ IL2StandardERC1155.mint.selector
            ^ IL2StandardERC1155.burn.selector
            ^ IL2StandardERC1155.mintBatch.selector
            ^ IL2StandardERC1155.burnBatch.selector;
        return _interfaceId == bridgingSupportedInterface || super.supportsInterface(_interfaceId);
    }

    function mint(address _to, uint256 _tokenId, uint256 _amount, bytes memory _data) public virtual override onlyL2Bridge {
        _mint(_to, _tokenId, _amount, _data);

        emit Mint(_to, _tokenId, _amount);
    }

    function mintBatch(address _to, uint256[] memory _tokenIds, uint256[] memory _amounts, bytes memory _data) public virtual override onlyL2Bridge {
        _mintBatch(_to, _tokenIds, _amounts, _data);

        emit MintBatch(_to, _tokenIds, _amounts);
    }

    function burn(address _from, uint256 _tokenId, uint256 _amount) public virtual override onlyL2Bridge {
        _burn(_from, _tokenId, _amount);

        emit Burn(_from, _tokenId, _amount);
    }

    function burnBatch(address _from, uint256[] memory _tokenIds, uint256[] memory _amounts) public virtual override onlyL2Bridge {
        _burnBatch(_from, _tokenIds, _amounts);

        emit BurnBatch(_from, _tokenIds, _amounts);
    }
}
