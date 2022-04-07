// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "./ITuringHelper.sol";

contract TalkWithQuantumComputers {

    event QuantumComputerResult(string _url, string _quantumEngine, uint256 realRandomNumber);
    event Debug(bytes response);

    ITuringHelper myHelper;

    constructor(address _helper) {
        myHelper = ITuringHelper(_helper);
    }

    function getRealRandomNumberFromQuantumComputer(string memory _url, string memory _quantumEngine) external {
        bytes memory encRequest = abi.encode(_quantumEngine);
        // TODO: This call may take a while (longer than Turing timeout) --> async callback needed like with ChainLink
        bytes memory encResponse = myHelper.TuringTx(_url, encRequest);
        emit Debug(encResponse);

        (uint256 randomNumber) = abi.decode(encResponse, (uint256));

        emit QuantumComputerResult(_url, _quantumEngine, randomNumber);
    }

}
