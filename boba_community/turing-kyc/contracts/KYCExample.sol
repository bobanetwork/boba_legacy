// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./common/interfaces/ITuringHelper.sol";
import "./access/KYCWrapper.sol";

contract KYCExample is KYCWrapper {

    event FunctionCall(string name);

    constructor(string memory apiUrl_, address turingHelper_) KYCWrapper(apiUrl_, turingHelper_) {}

    function openForEveryone() external {
        emit FunctionCall("openForEveryone");
    }

    function onlyForKYCedWallets() external onlyKYCed {
        emit FunctionCall("onlyForKYCedWallets");
    }
}
