// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

contract PausedReceiver {

    bool public paused;

    fallback() external payable {
        require(!paused, "cant receive ether");
    }

    function setPauseStatus(bool status) public {
        paused = status;
    }
}