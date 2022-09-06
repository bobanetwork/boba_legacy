// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";

library Math {
    function max(uint a, uint b) internal pure returns (uint) {
        return a >= b ? a : b;
    }
    function min(uint a, uint b) internal pure returns (uint) {
        return a < b ? a : b;
    }
}

interface erc20 {
    function totalSupply() external view returns (uint256);
    function transfer(address recipient, uint amount) external returns (bool);
    function balanceOf(address) external view returns (uint);
    function transferFrom(address sender, address recipient, uint amount) external returns (bool);
    function approve(address spender, uint value) external returns (bool);
}

interface ve {
    function token() external view returns (address);
    function balanceOfNFT(uint) external view returns (uint);
    function isApprovedOrOwner(address, uint) external view returns (bool);
    function ownerOf(uint) external view returns (address);
    function transferFrom(address, address, uint) external;
}

interface Voter {
    function distribute(address _gauge) external;
}

// Basic Guages are pools to receive rewards, to be distributed among the associated participants
// at the discretion of the protocol operator
contract Gauge is Ownable {

    // to identify guage with pool/vaults/reference address
    address public immutable pool;
    address public immutable _ve; // the ve token used for gauges
    address public immutable voter;

    event NotifyReward(address indexed from, address indexed reward, uint amount);
    event ClaimRewards(address indexed to, address indexed reward, uint amount);

    constructor(address _pool, address  __ve, address _voter, address _operator) {
        pool = _pool;
        _ve = __ve;
        voter = _voter;
        transferOwnership(_operator);
    }

    // simple re-entrancy check
    uint internal _unlocked = 1;
    modifier lock() {
        require(_unlocked == 1);
        _unlocked = 2;
        _;
        _unlocked = 1;
    }

    function notifyRewardAmount(address token, uint amount) external lock {
        require(amount > 0);
        _safeTransferFrom(token, msg.sender, address(this), amount);

        emit NotifyReward(msg.sender, token, amount);
    }

    function getReward(address account, address token) external onlyOwner lock {
        _unlocked = 1;
        Voter(voter).distribute(address(this));
        _unlocked = 2;

        uint _reward = erc20(token).balanceOf(address(this));
        if (_reward > 0) _safeTransfer(token, account, _reward);

        emit ClaimRewards(account, token, _reward);
    }

    // no user deposits, hence no 40-100% range for emissions for locking ve Token
    // distribution at their own discretion
    // attaching a veToken hence, might be problematic for gaugeOwners to distribute

    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        require(token.code.length > 0);
        (bool success, bytes memory data) =
        token.call(abi.encodeWithSelector(erc20.transferFrom.selector, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))));
    }

    function _safeTransfer(address token, address to, uint256 value) internal {
        require(token.code.length > 0);
        (bool success, bytes memory data) =
        token.call(abi.encodeWithSelector(erc20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))));
    }
}

contract BaseV1GaugeFactory {
    address public last_gauge;

    // called by Voter
    function createGauge(address _pool, address _ve, address operator) external returns (address) {
        last_gauge = address(new Gauge(_pool, _ve, msg.sender, operator));
        return last_gauge;
    }

    function createGaugeSingle(address _pool, address _ve, address _voter, address operator) external returns (address) {
        last_gauge = address(new Gauge(_pool, _ve, _voter, operator));
        return last_gauge;
    }
}