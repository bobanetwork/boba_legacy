// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/ITuringHelper.sol";
import "./WithRecover.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AuthenticatedFaucet is WithRecover {
    string public apiUrl;
    ITuringHelper public turingHelper;
    mapping(uint256 => uint256) twitterUserLastClaim;
    uint256 lastEpochStart;
    uint256 amountClaimsInLastEpoch;
    uint256 maxClaimsPerEpoch;

    event GasClaimed(uint256 authorId);

    /*modifier isEligible() {
        _;
    }*/

    constructor(string memory apiUrl_, address turingHelper_, uint256 maxClaimsPerEpoch_) {
        apiUrl = apiUrl_;
        turingHelper = ITuringHelper(turingHelper_);
        lastEpochStart = block.timestamp;
        amountClaimsInLastEpoch = 0;
        maxClaimsPerEpoch = maxClaimsPerEpoch_;
    }

    /// @dev Send funds to authenticated user. OnlyOwner as sent via Signature.
    /// @param twitterPostID_: Tweet ID with the assigned ID.
    function sendFunds(address payable recipient_, string calldata twitterPostID_) external payable onlyOwner() {
        
        require(msg.value > 0, "No testnet funds");
        
        if (block.timestamp >= (lastEpochStart + 1 hours)) {
            lastEpochStart = block.timestamp;
            amountClaimsInLastEpoch = 1;
        } else {
            amountClaimsInLastEpoch++;
        }
        
        require(amountClaimsInLastEpoch < maxClaimsPerEpoch, "Rate limit reached");

        bytes memory encRequest = abi.encode(_msgSender(), twitterPostID_);
        
        (uint256 resp, uint256 authorId, uint256 errorMsgVal) = abi.decode(turingHelper.TuringTx(apiUrl, encRequest), (uint256, uint256, uint256));
        // 0 = false, 1 = true
        bool isAllowedToClaim = resp != 0;

        require(isAllowedToClaim, string(abi.encodePacked("Invalid request:",Strings.toString(errorMsgVal))));
        require((block.timestamp - twitterUserLastClaim[authorId]) > 1 days, "Cooldown");
        twitterUserLastClaim[authorId] = block.timestamp;

        recipient_.transfer(msg.value);
        emit GasClaimed(authorId);
    }
}
