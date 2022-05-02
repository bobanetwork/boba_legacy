// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/ITuringHelper.sol";
import "./WithRecover.sol";
import "./LinearlyAssigned.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/utils/Strings.sol";
// TODO: import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract TwitterClaim is WithRecover, LinearlyAssigned, ERC721 {
    string public apiUrl;
    ITuringHelper public turingHelper;
    mapping(uint256 => bool) hasTwitterUserClaimed;
    uint256 lastEpochStart;
    uint256 amountClaimsInLastEpoch;
    uint256 maxClaimsPerEpoch;

    event NFTClaimed(uint256 authorId);

    /*modifier isEligible() {
        _;
    }*/

    constructor(string memory name_, string memory symbol_, uint256 totalSupply_, string memory apiUrl_,
        address turingHelper_, uint256 maxClaimsPerEpoch_)
    ERC721(name_, symbol_) LinearlyAssigned(totalSupply_, 0) {
        apiUrl = apiUrl_;
        turingHelper = ITuringHelper(turingHelper_);
        lastEpochStart = block.timestamp;
        amountClaimsInLastEpoch = 0;
        maxClaimsPerEpoch = maxClaimsPerEpoch_;
    }

    /// @dev Mint/Claim NFT
    /// @param twitterPostID_: Tweet ID with the assigned ID.
    function claimNFT(string calldata twitterPostID_) external {
        if (block.timestamp >= (lastEpochStart + 1 hours)) {
            lastEpochStart = block.timestamp;
            amountClaimsInLastEpoch = 1;
        } else {
            amountClaimsInLastEpoch++;
        }
        require(amountClaimsInLastEpoch < maxClaimsPerEpoch, "Rate limit reached");

        bytes memory encRequest = abi.encode(_msgSender(), twitterPostID_);
        (uint256 resp, uint256 authorId) = abi.decode(turingHelper.TuringTx(apiUrl, encRequest), (uint256, uint256));
        // 0 = false, 1 = true
        bool isAllowedToClaim = resp != 0;

        require(isAllowedToClaim, "Tweet invalid");
        require(!hasTwitterUserClaimed[authorId], "Already claimed");
        hasTwitterUserClaimed[authorId] = true;
        // TODO: Has enough followers, does exist long enough?

        _safeMint(_msgSender(), nextToken());
        emit NFTClaimed(authorId);
    }
}
