// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { xL2GovernanceERC20 } from "../standards/xL2GovernanceERC20.sol";

contract xL2GovernanceERC20Helper {
    address public xERC20Adress;
    address public owner;

    constructor(
        address _xERC20Address
    ) {
        xERC20Adress = _xERC20Address;
        owner = msg.sender;
    }

    modifier onlyOwner {
        require (msg.sender == owner, "Caller is not the owner");
        _;
    }

    function mint(
        address _to,
        uint256 _amount
    )
        public
        onlyOwner
    {
        xL2GovernanceERC20(xERC20Adress).mint(_to, _amount);
    }


    function burn(
        address _to,
        uint256 _amount
    )
        public
        onlyOwner
    {
        xL2GovernanceERC20(xERC20Adress).burn(_to, _amount);
    }

    function call(
        bytes memory _message
    )
        public
        onlyOwner
    {
       (bool success, ) = xERC20Adress.call(_message);
       require(success, "Transaction execution reverted.");
    }
}
