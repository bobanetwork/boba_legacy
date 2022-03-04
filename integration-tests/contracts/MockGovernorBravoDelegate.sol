//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "@boba/contracts/contracts/DAO/governance/GovernorBravoDelegate.sol";

interface IMockGovernorBravoDelegate {

    function _setVotingPeriodMock(uint value) external;

    function _setVotingDelayMock(uint value) external;
}

contract MockGovernorBravoDelegate is GovernorBravoDelegate {
    /**
      * @notice Allow mocking voting delay without limits
      * @param newVotingDelay new voting delay, in seconds
      */
    function _setVotingDelayMock(uint newVotingDelay) external {
        require(msg.sender == admin, "GovernorBravo::_setVotingDelay: admin only");
        // require(newVotingDelay >= MIN_VOTING_DELAY && newVotingDelay <= MAX_VOTING_DELAY, "GovernorBravo::_setVotingDelay: invalid voting delay");
        uint oldVotingDelay = votingDelay;
        votingDelay = newVotingDelay;

        emit VotingDelaySet(oldVotingDelay,votingDelay);
    }

    /**
      * @notice Allow mocking voting period without limits
      * @param newVotingPeriod new voting period, in seconds
      */
    function _setVotingPeriodMock(uint newVotingPeriod) external {
        require(msg.sender == admin, "GovernorBravo::_setVotingPeriod: admin only");
        // require(newVotingPeriod >= MIN_VOTING_PERIOD && newVotingPeriod <= MAX_VOTING_PERIOD, "GovernorBravo::_setVotingPeriod: invalid voting period");
        uint oldVotingPeriod = votingPeriod;
        votingPeriod = newVotingPeriod;

        emit VotingPeriodSet(oldVotingPeriod, votingPeriod);
    }
}