// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract L1ERC20 is ERC20, IERC165 {

    uint8 private immutable _decimals;

    constructor(
        uint256 _initialSupply,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint8 decimals_
    )
        public
        ERC20(
            _tokenName,
            _tokenSymbol
        )
    {
        _decimals = decimals_;
        _mint(msg.sender, _initialSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /** @dev Not implemented by base contracts, implemented here to support interface checks (e.g. Teleportation) */
    function supportsInterface(bytes4 interfaceId) public view override virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == type(IERC20).interfaceId;
    }
}
