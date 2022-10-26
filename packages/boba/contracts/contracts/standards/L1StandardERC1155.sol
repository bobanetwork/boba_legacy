// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "./IL1StandardERC1155.sol";

contract L1StandardERC1155 is IL1StandardERC1155, ERC1155 {
    address public override l2Contract;
    address public l1Bridge;

    /**
     * @param _l1Bridge Address of the L1 standard bridge.
     * @param _l2Contract Address of the corresponding L2 NFT contract.
     * @param _uri URI for all token types
     */
    constructor(
        address _l1Bridge,
        address _l2Contract,
        string memory _uri
    )
        ERC1155(_uri) {
        l2Contract = _l2Contract;
        l1Bridge = _l1Bridge;
    }

    modifier onlyL1Bridge {
        require(msg.sender == l1Bridge, "Only L1 Bridge can mint and burn");
        _;
    }

    function supportsInterface(bytes4 _interfaceId) public view override(IERC165, ERC1155) returns (bool) {
        bytes4 bridgingSupportedInterface = IL1StandardERC1155.l2Contract.selector
            ^ IL1StandardERC1155.mint.selector
            ^ IL1StandardERC1155.burn.selector;
        return _interfaceId == bridgingSupportedInterface || super.supportsInterface(_interfaceId);
    }

    function mint(address _to, uint256 _tokenId, uint256 _amount, bytes memory _data) public virtual override onlyL1Bridge {
        _mint(_to, _tokenId, _amount, _data);

        emit Mint(_to, _tokenId, _amount);
    }


    function mintBatch(address _to, uint256[] memory _tokenIds, uint256[] memory _amounts, bytes memory _data) public virtual override onlyL1Bridge {
        _mintBatch(_to, _tokenIds, _amounts, _data);

        emit MintBatch(_to, _tokenIds, _amounts);
    }

    function burn(address _from, uint256 _tokenId, uint256 _amount) public virtual override onlyL1Bridge {
        _burn(_from, _tokenId, _amount);

        emit Burn(_from, _tokenId, _amount);
    }

    function burnBatch(address _from, uint256[] memory _tokenIds, uint256[] memory _amounts) public virtual override onlyL1Bridge {
        _burnBatch(_from, _tokenIds, _amounts);

        emit BurnBatch(_from, _tokenIds, _amounts);
    }
}
