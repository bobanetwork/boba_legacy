// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/ITuringHelper.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuthenticatedFaucet is Ownable {
    using ECDSA for bytes32;

    string public apiUrl;
    ITuringHelper public turingHelper;
    mapping(uint256 => uint256) twitterUserLastClaim;
    uint256 lastEpochStart;
    uint256 amountClaimsInLastEpoch;
    uint256 maxClaimsPerEpoch;
    uint256 testnetETHPerClaim;

    event GasClaimed(uint256 authorId);

    mapping(address => uint256) private _nonces;

    constructor(string memory apiUrl_, address turingHelper_, uint256 maxClaimsPerEpoch_, uint256 testnetETHPerClaim_) {
        apiUrl = apiUrl_;
        turingHelper = ITuringHelper(turingHelper_);
        lastEpochStart = block.timestamp;
        amountClaimsInLastEpoch = 0;
        maxClaimsPerEpoch = maxClaimsPerEpoch_;
        testnetETHPerClaim = testnetETHPerClaim_;
    }

    function setConfig(string memory apiUrl_, uint256 maxClaimsPerEpoch_, uint256 testnetETHPerClaim_) external onlyOwner {
        apiUrl = apiUrl_;
        maxClaimsPerEpoch = maxClaimsPerEpoch_;
        testnetETHPerClaim = testnetETHPerClaim_;
    }

    function sendFundsMeta(address to_, string calldata twitterPostID_, bytes32 hashedMessage_, bytes memory signature_) external {
        require(verifyMessage(hashedMessage_, signature_) == to_, "Signature faulty");
        _nonces[to_] = _nonces[to_] + 1;
        sendFunds(to_, twitterPostID_);
    }

    /// @dev Send funds to authenticated user.
    /// @param twitterPostID_: Tweet ID with the assigned ID.
    function sendFunds(address to_, string calldata twitterPostID_) public {
        require(address(this).balance >= testnetETHPerClaim, "No testnet funds");
        if (block.timestamp >= (lastEpochStart + 1 hours)) {
            lastEpochStart = block.timestamp;
            amountClaimsInLastEpoch = 1;
        } else {
            amountClaimsInLastEpoch++;
        }

        require(amountClaimsInLastEpoch < maxClaimsPerEpoch, "Rate limit reached");

        bytes memory encRequest = abi.encode(to_, twitterPostID_);

        (uint256 resp, uint256 authorId, uint256 errorMsgVal) = abi.decode(turingHelper.TuringTx(apiUrl, encRequest), (uint256, uint256, uint256));
        // 0 = false, 1 = true
        bool isAllowedToClaim = resp != 0;

        require(isAllowedToClaim, string(abi.encodePacked("Invalid request:", Strings.toString(errorMsgVal))));
        require((block.timestamp - twitterUserLastClaim[authorId]) > 1 days, "Cooldown");
        twitterUserLastClaim[authorId] = block.timestamp;

        payable(to_).transfer(testnetETHPerClaim);
        emit GasClaimed(authorId);
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
