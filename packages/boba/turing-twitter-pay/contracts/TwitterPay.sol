// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/ITuringHelper.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TwitterPay is Ownable {
    using ECDSA for bytes32;

    string public apiUrl;
    ITuringHelper public turingHelper;

    mapping(uint256 => address) public bubbleRegister;
    mapping(uint256 => bool) public twitterRegister;

    uint256 public lastEpochStart;
    uint256 public amountRegistersInLastEpoch;
    uint256 public maxRegistersPerEpoch;

    event BubbleRegistered(uint256 authorId, uint256 bobaBubble);

    mapping(address => uint256) private _nonces;

    constructor(string memory apiUrl_, address turingHelper_, uint256 maxRegistersPerEpoch_) {
        apiUrl = apiUrl_;
        turingHelper = ITuringHelper(turingHelper_);
        lastEpochStart = block.timestamp;
        amountRegistersInLastEpoch = 0;
        maxRegistersPerEpoch = maxRegistersPerEpoch_;
    }

    function setConfig(string memory apiUrl_, uint256 maxRegistersPerEpoch_) external onlyOwner {
        apiUrl = apiUrl_;
        maxRegistersPerEpoch = maxRegistersPerEpoch_;
    }

    function registerBobaBubble(string calldata twitterPostID_) external {
        if (block.timestamp >= (lastEpochStart + 1 hours)) {
            lastEpochStart = block.timestamp;
            amountRegistersInLastEpoch = 1;
        } else {
            amountRegistersInLastEpoch++;
        }

        require(amountRegistersInLastEpoch < maxRegistersPerEpoch, "Rate limit reached");

        bytes memory encRequest = abi.encode(_msgSender(), twitterPostID_);

        (uint256 resp, uint256 authorId, uint256 errorMsgVal, uint256 bobaBubble) = abi.decode(turingHelper.TuringTx(apiUrl, encRequest), (uint256, uint256, uint256, uint256));
        // 0 = false, 1 = true
        bool isAllowedToReceive = resp != 0;
        require(twitterRegister[authorId] == false, "Twitter already used");
        require(bubbleRegister[bobaBubble] == address(0), "Wallet already used or collision");
        require(isAllowedToReceive, string(abi.encodePacked("Invalid request:", Strings.toString(errorMsgVal))));

        twitterRegister[authorId] = true;
        bubbleRegister[bobaBubble] = _msgSender();

        emit BubbleRegistered(authorId, bobaBubble);
    }

    /// @dev Send funds to authenticated user.
    function sendFunds(address token_, uint256 bobaBubble_, uint256 amount_) public {
        require(bubbleRegister[bobaBubble_] != address(0), "Unknown bubble");

        IERC20(token_).transferFrom(_msgSender(), bubbleRegister[bobaBubble_], amount_);
    }

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function verifyMessage(bytes32 _hashedMessage, bytes memory signature) public pure returns (address) {
        bytes32 signedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hashedMessage));
        return signedHash.recover(signature);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}
