//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import './TuringHelper.sol';

contract BobaMainnetFaucet is Ownable {
    address public NativeAddress = 0x4200000000000000000000000000000000000006;
    uint256 public nativeFaucetAmount;
    uint256 public waitingPeriod;

    string public hcBackendUrl;
    TuringHelper public hcHelper;

    uint256 private constant SAFE_GAS_STIPEND = 6000;

    mapping(address => uint256) public nativeClaimRecords;

    event Configure(
        address turingHelperAddress,
        string turingUrl,
        uint256 waitingPeriod,
        uint256 nativeFaucetAmount
    );

    event WithdrawNative(
        address receiver,
        uint256 amount
    );

    event IssuedNative(
        bytes32 uuid,
        bytes32 key,
        address receiver,
        uint256 amount,
        uint256 timestamp
    );

    event VerifyKey(
        string url,
        bytes32 uuid,
        bytes32 key,
        uint256 result
    );

    constructor(
        address _hcHelperAddress,
        string memory _hcUrl,
        uint256 _waitingPeriod,
        uint256 _nativeFaucetAmount
    ) {
        hcHelper = TuringHelper(_hcHelperAddress);
        hcBackendUrl = _hcUrl;
        waitingPeriod = _waitingPeriod;
        nativeFaucetAmount = _nativeFaucetAmount;
    }

    // allow contract to receive ETH
    receive() external payable {}

    function configure(
        address _turingHelperAddress,
        string memory _turingUrl,
        uint256 _waitingPeriod,
        uint256 _nativeFaucetAmount
    ) public onlyOwner {
        require(_turingHelperAddress != address(0), "HCHelper cannot be ZeroAddr");
        require(_nativeFaucetAmount > 0, "Native amount too small");

        hcHelper = TuringHelper(_turingHelperAddress);
        hcBackendUrl = _turingUrl;
        waitingPeriod = _waitingPeriod;
        nativeFaucetAmount = _nativeFaucetAmount;

        emit Configure(
            _turingHelperAddress,
            _turingUrl,
            _waitingPeriod,
            _nativeFaucetAmount
        );
    }

    function withdrawNative(
        uint256 _amount
    ) public onlyOwner {
            (bool sent,) = (msg.sender).call{gas: SAFE_GAS_STIPEND, value: _amount}("");
            require(sent, "Failed to send native");

        emit WithdrawNative(msg.sender, _amount);
    }

    function getNativeFaucet(
        bytes32 _uuid,
        string memory _key,
        address _to
    ) external {
        require(nativeClaimRecords[_to] + waitingPeriod <= block.timestamp, 'Invalid request');

        bytes32 hashedKey = keccak256(abi.encodePacked(_key));
        uint256 result = _verifyKey(_uuid, hashedKey, _to);

        require(result == 1, 'Captcha wrong');

        nativeClaimRecords[_to] = block.timestamp;

        (bool sent,) = (_to).call{gas: SAFE_GAS_STIPEND, value: nativeFaucetAmount}("");
        require(sent, "Failed to send native");

        emit IssuedNative(_uuid, hashedKey, _to, nativeFaucetAmount, block.timestamp);
    }

    function _verifyKey(bytes32 _uuid, bytes32 _key, address _to) private returns (uint256) {
        bytes memory encRequest = abi.encode(_uuid, _key, _to);
        bytes memory encResponse = hcHelper.TuringTxV2(hcBackendUrl, encRequest);

        uint256 result = abi.decode(encResponse,(uint256));

        emit VerifyKey(hcBackendUrl, _uuid, _key, result);

        return result;
    }
}
