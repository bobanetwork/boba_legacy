// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.11;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

library Math {
    function max(uint a, uint b) internal pure returns (uint) {
        return a >= b ? a : b;
    }
}

interface ve {
    function token() external view returns (address);
    function create_lock_for(uint, uint, address) external returns (uint);
    function transferFrom(address, address, uint) external;
}

interface underlying {
    function approve(address spender, uint value) external returns (bool);
    function balanceOf(address) external view returns (uint);
    function transfer(address, uint) external returns (bool);
    function transferFrom(address, address, uint) external returns (bool);
}

interface voter {
    function notifyRewardAmount(uint amount) external;
}

// this is the layer-2 Boba custodian contract which holds and distributes emission to the voter

contract BaseV1Dispatcher is OwnableUpgradeable {

    uint internal constant week = 86400 * 7; // allows minting once per week (reset every Thursday 00:00 UTC)
    uint internal weeklyEmission;
    underlying public _token;
    voter public _voter;
    ve public _ve;
    uint public active_period;
    // update lock period according to requirements
    uint internal constant lock = 86400 * 7 * 52 * 1;

    address internal _initializer;

    event Emission(address indexed sender, uint weekly);
    event WeeklyEmissionUpdated(uint priorWeeklyEmission, uint updatedWeeklyEmission);

    constructor() {
    }

    function initialize(
        address __voter, // the voting & distribution system
        address  __ve // the ve system that will be locked into)
    ) public initializer() {
        _initializer = msg.sender;
        _token = underlying(ve(__ve).token());
        _voter = voter(__voter);
        _ve = ve(__ve);
        active_period = (block.timestamp + (2*week)) / week * week;

        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    // load up the custodian contract with initAmount, which should cover for sum amounts
    // if we want initial ve dist, to be a percent owner, make sure
    // sum amounts / initAmount = % ownership of top protocols
    function initiate_(
        address[] memory claimants,
        uint[] memory amounts,
        uint initAmount // sum amounts / initAmount = % ownership of top protocols, so if initial 20m is distributed, and target is 25% protocol ownership, then max - 4 x 20m = 80m
    ) external {
        require(_initializer == msg.sender);
        // an explicit initAmount >= sum(amounts) is not added, since if initAmount is not enough, this call would fail
        require(_token.transferFrom(msg.sender, address(this), initAmount));
        _token.approve(address(_ve), type(uint).max);
        for (uint i = 0; i < claimants.length; i++) {
            _ve.create_lock_for(amounts[i], lock, claimants[i]);
        }
        _initializer = address(0);
        active_period = (block.timestamp + week) / week * week;
    }

    // set weekly emission by the owner, add methods to update the value
    // weekly emission takes the max of calculated (aka target) emission versus circulating tail end emission
    function weekly_emission() public view returns (uint) {
        return weeklyEmission;
    }

    function set_weekly_emission(uint _newWeeklyEmission) public onlyOwner {
        uint prior = weeklyEmission;
        weeklyEmission = _newWeeklyEmission;
        emit WeeklyEmissionUpdated(prior, weeklyEmission);
    }

    // update period can only be called once per cycle (1 week)
    function update_period() external returns (uint) {
        uint _period = active_period;
        if (block.timestamp >= _period + week && _initializer == address(0)) { // only trigger if new week
            _period = block.timestamp / week * week;
            active_period = _period;
            // if for an entire week, no one calls this/distribute/getReward,
            // there will be no emission for that week
            uint weekly = weekly_emission();

            // decay emission by 1% every week
            weeklyEmission = (weeklyEmission * 99) / 100;

            uint _balanceOf = _token.balanceOf(address(this));
            require(_balanceOf >= weekly, "Insufficient funds in dispatcher");

            _token.approve(address(_voter), weekly);
            _voter.notifyRewardAmount(weekly);

            emit Emission(msg.sender, weekly);
        }
        return _period;
    }

}