//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.16;

import "@boba/contracts/contracts/DAO/governance/Timelock.sol";
import { IMockGovernorBravoDelegate } from "./MockGovernorBravoDelegate.sol";

contract MockTimelock is Timelock {

    address owner;

    constructor(address admin_, uint delay_) Timelock(admin_, delay_) public {
        owner = msg.sender;
    }

    function setAdminMock(address newAdmin) external {
        require(msg.sender == owner);
        admin = newAdmin;
    }

    function setVotingPeriodMock(address governor, uint value) external {
        require(msg.sender == owner);
        IMockGovernorBravoDelegate(governor)._setVotingPeriodMock(value);
    }

    function setVotingDelayMock(address governor, uint value) external {
        require(msg.sender == owner);
        IMockGovernorBravoDelegate(governor)._setVotingDelayMock(value);
    }
}