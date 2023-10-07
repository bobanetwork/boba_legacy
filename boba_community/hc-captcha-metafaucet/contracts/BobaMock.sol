//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BobaMock is ERC20 {
    constructor() ERC20("Boba Network", "BOBA") {
        _mint(msg.sender, 100 ether);
    }
}
