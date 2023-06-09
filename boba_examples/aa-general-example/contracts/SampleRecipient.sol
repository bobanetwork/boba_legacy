//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@bobanetwork/accountabstraction/contracts/samples/SimpleAccount.sol";

contract SampleRecipient {

    SimpleAccount account;

    event Sender(address txOrigin, address msgSender, string message);

    function something(string memory message) public {
        emit Sender(tx.origin, msg.sender, message);
    }

    // solhint-disable-next-line
    function reverting() public {
        revert( "test revert");
    }
}
