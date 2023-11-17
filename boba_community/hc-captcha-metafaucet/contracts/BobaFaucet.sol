//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './TuringHelper.sol';

contract BobaFaucet is Ownable {
    uint256 public nativeFaucetAmount;
    uint256 public tokenFaucetAmount;
    uint256 public waitingPeriod;

    IERC20 public token;
    TuringHelper public hcHelper;

    string public hcBackendUrl;

    uint256 private constant SAFE_GAS_STIPEND = 6000;

    mapping(address => uint256) public claimRecords;

    event Configure(
        address turingHelperAddress,
        address tokenAddress,
        string turingUrl,
        uint256 waitingPeriod,
        uint256 nativeFaucetAmount,
        uint256 tokenFaucetAmount
    );

    event Withdraw(
        address receiver,
        uint256 nativeAmount,
        uint256 tokenAmount
    );

    event Issued(
        bytes32 uuid,
        bytes32 key,
        address receiver,
        uint256 amount,
        uint256 tokenAmount,
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
        address _token,
        string memory _hcUrl,
        uint256 _waitingPeriod,
        uint256 _nativeFaucetAmount,
        uint256 _tokenFaucetAmount
    ) {
        hcHelper = TuringHelper(_hcHelperAddress);
        token = IERC20(_token);
        hcBackendUrl = _hcUrl;
        waitingPeriod = _waitingPeriod;
        nativeFaucetAmount = _nativeFaucetAmount;
        tokenFaucetAmount = _tokenFaucetAmount;
    }

    // allow contract to receive ETH
    receive() external payable {}

    function configure(
        address _turingHelperAddress,
        address _tokenAddress,
        string memory _turingUrl,
        uint256 _waitingPeriod,
        uint256 _nativeFaucetAmount,
        uint256 _tokenFaucetAmount
    ) public onlyOwner {
        require(_turingHelperAddress != address(0), "HCHelper cannot be ZeroAddr");
        require(_nativeFaucetAmount > 0, "Native amount too small");
        // tokenAmount can be 0 (e.g. for mainnet)

        hcHelper = TuringHelper(_turingHelperAddress);
        token = IERC20(token);

        hcBackendUrl = _turingUrl;
        waitingPeriod = _waitingPeriod;
        nativeFaucetAmount = _nativeFaucetAmount;
        tokenFaucetAmount = _tokenFaucetAmount;

        emit Configure(
            _turingHelperAddress,
            _tokenAddress,
            _turingUrl,
            _waitingPeriod,
            _nativeFaucetAmount,
            _tokenFaucetAmount
        );
    }

    function withdraw(
        uint256 _nativeAmount,
        uint256 _tokenAmount
    ) public onlyOwner {
        (bool sent,) = (msg.sender).call{gas: SAFE_GAS_STIPEND, value: _nativeAmount}("");
        require(sent, "Failed to send native");

        sent = token.transfer(msg.sender, _tokenAmount);
        require(sent, "Failed to send token");

        emit Withdraw(msg.sender, _nativeAmount, _tokenAmount);
    }

    function getFaucet(
        bytes32 _uuid,
        string memory _key,
        address _to
    ) external {
        require(claimRecords[_to] + waitingPeriod <= block.timestamp, 'Invalid request');

        bytes32 hashedKey = keccak256(abi.encodePacked(_key));
        uint256 result = _verifyKey(_uuid, hashedKey, _to);

        require(result == 1, 'Captcha wrong');

        claimRecords[_to] = block.timestamp;

        (bool sent,) = (_to).call{gas: SAFE_GAS_STIPEND, value: nativeFaucetAmount}("");
        require(sent, "Failed to send native");

        if (tokenFaucetAmount > 0 && token.balanceOf(address(this)) >= tokenFaucetAmount) {
            sent = token.transfer(_to, tokenFaucetAmount);
            require(sent, "Failed to send token");
            emit Issued(_uuid, hashedKey, _to, nativeFaucetAmount, tokenFaucetAmount, block.timestamp);
        } else {
            emit Issued(_uuid, hashedKey, _to, nativeFaucetAmount, 0, block.timestamp);
        }
    }

    function _verifyKey(bytes32 _uuid, bytes32 _key, address _to) private returns (uint256) {
        bytes memory encRequest = abi.encode(_uuid, _key, _to);
        bytes memory encResponse = hcHelper.TuringTxV2(hcBackendUrl, encRequest);

        uint256 result = abi.decode(encResponse, (uint256));

        emit VerifyKey(hcBackendUrl, _uuid, _key, result);

        return result;
    }
}
