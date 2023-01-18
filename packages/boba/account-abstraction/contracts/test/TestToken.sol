// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    uint8 public decimalsOverride = 18;
    constructor ()
        // solhint-disable-next-line no-empty-blocks
        ERC20("TST", "TestToken") {
    }

    function mint(address sender, uint256 amount) external {
        _mint(sender, amount);
    }

    function decimals() public view override returns (uint8) {
        return decimalsOverride;
    }

    function setDecimals(uint8 _decimals) public {
        decimalsOverride = _decimals;
    }
}
