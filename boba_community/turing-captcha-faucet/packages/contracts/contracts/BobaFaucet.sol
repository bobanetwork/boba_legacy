//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import './TuringHelper.sol';

contract BobaFaucet is Ownable {
    using SafeERC20 for IERC20;

    address public BobaAddress;
    address public ETHAddress = 0x4200000000000000000000000000000000000006;
    uint256 public BobaFaucetAmount;
    uint256 public ETHFaucetAmount;
    uint256 public waitingPeriod;

    // Turing
    address public turingHelperAddress;
    string public turingUrl;
    TuringHelper public turing;

    uint256 private constant SAFE_GAS_STIPEND = 6000;

    mapping(address => uint256) BobaClaimRecords;
    mapping(address => uint256) ETHClaimRecords;

    event Configure(
        address turingHelperAddress,
        string turingUrl,
        uint256 waitingPeriod,
        uint256 BobaFaucetAmount,
        uint256 ETHFaucetAmount
    );

    event WithdrawToken(
        address receiver,
        address tokenAddress,
        uint256 amount
    );

    event GetBobaFaucet(
        bytes32 uuid,
        bytes32 key,
        address receiver,
        uint256 amount,
        uint256 timestamp
    );

    event GetETHFaucet(
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
        address _turingHelperAddress,
        string memory _turingUrl,
        address _BobaAddress,
        uint256 _waitingPeriod,
        uint256 _BobaFaucetAmount,
        uint256 _ETHFaucetAmount
    ) {
        turingHelperAddress = _turingHelperAddress;
        turing = TuringHelper(_turingHelperAddress);
        turingUrl = _turingUrl;
        BobaAddress = _BobaAddress;
        waitingPeriod = _waitingPeriod;
        BobaFaucetAmount = _BobaFaucetAmount;
        ETHFaucetAmount = _ETHFaucetAmount;
    }

    // allow contract to receive ETH
    receive() external payable {}

    function configure(
        address _turingHelperAddress,
        string memory _turingUrl,
        uint256 _waitingPeriod,
        uint256 _BobaFaucetAmount,
        uint256 _ETHFaucetAmount
    ) public onlyOwner {
        turingHelperAddress = _turingHelperAddress;
        turing = TuringHelper(_turingHelperAddress);
        turingUrl = _turingUrl;
        waitingPeriod = _waitingPeriod;
        BobaFaucetAmount = _BobaFaucetAmount;
        ETHFaucetAmount = _ETHFaucetAmount;

        emit Configure(
            _turingHelperAddress,
            _turingUrl,
            _waitingPeriod,
            _BobaFaucetAmount,
            _ETHFaucetAmount
        );
    }

    function withdrawToken (
        address _tokenAddress,
        uint256 _amount
    ) public onlyOwner {
        if (_tokenAddress == ETHAddress) {
            (bool sent,) = (msg.sender).call{gas: SAFE_GAS_STIPEND, value: _amount}("");
            require(sent, "Failed to send oEth");
        } else {
            IERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
        }

        emit WithdrawToken(msg.sender, _tokenAddress, _amount);
    }

    function getBobaFaucet(
        bytes32 _uuid,
        string memory _key
    ) external {
        require(BobaClaimRecords[msg.sender] + waitingPeriod < block.timestamp, 'Invalid request');

        bytes32 hashedKey = keccak256(abi.encodePacked(_key));
        uint256 result = _verifyKey(_uuid, hashedKey);

        require(result == 1, 'Captcha wrong');

        BobaClaimRecords[msg.sender] = block.timestamp;
        IERC20(BobaAddress).safeTransfer(msg.sender, BobaFaucetAmount);

        emit GetBobaFaucet(_uuid, hashedKey, msg.sender, BobaFaucetAmount, block.timestamp);
    }

    function getETHFaucet(
        bytes32 _uuid,
        string memory _key
    ) external {
        require(ETHClaimRecords[msg.sender] + waitingPeriod < block.timestamp, 'Invalid request');

        bytes32 hashedKey = keccak256(abi.encodePacked(_key));
        uint256 result = _verifyKey(_uuid, hashedKey);

        require(result == 1, 'Captcha wrong');

        ETHClaimRecords[msg.sender] = block.timestamp;

        (bool sent,) = (msg.sender).call{gas: SAFE_GAS_STIPEND, value: ETHFaucetAmount}("");
        require(sent, "Failed to send oEth");

        emit GetETHFaucet(_uuid, hashedKey, msg.sender, BobaFaucetAmount, block.timestamp);
    }

    function _verifyKey(bytes32 _uuid, bytes32 _key) private returns (uint256) {
        bytes memory encRequest = abi.encodePacked(_uuid, _key);
        bytes memory encResponse = turing.TuringTx(turingUrl, encRequest);

        uint256 result = abi.decode(encResponse,(uint256));

        emit VerifyKey(turingUrl, _uuid, _key, result);

        return result;
    }
}
