// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/ITuringHelper.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract TwitterClaim {

    string public apiUrl;
    ITuringHelper public turingHelper;
    IERC721 public nftToClaim;
    mapping(string => bool) hasTwitterUserClaimed;
    uint256 lastEpochStart;
    uint256 amountClaimsInLastEpoch;
    uint256 maxClaimsPerEpoch;

    event NFTClaimed(string twitterUser);

    /*modifier isEligible() {
        _;
    }*/

    constructor(string memory apiUrl_, address turingHelper_, address nftAddress_, uint256 maxClaimsPerEpoch_) {
        apiUrl = apiUrl_;
        turingHelper = ITuringHelper(turingHelper_);
        lastEpochStart = block.timestamp;
        amountClaimsInLastEpoch = 0;
        maxClaimsPerEpoch = maxClaimsPerEpoch_;
        nftToClaim = IERC721(nftAddress_);
    }

    function claimNFT(string calldata idToVerify_, string calldata twitterPostID_) external {
        if(block.timestamp >= (lastEpochStart + 1 hours)) {
            lastEpochStart = block.timestamp;
            amountClaimsInLastEpoch = 1;
        } else {
            amountClaimsInLastEpoch++;
        }
        require(amountClaimsInLastEpoch < maxClaimsPerEpoch, "Rate limit reached");


        string memory twitterUser = "TODO";
        // TODO: Add prior requires for better UX (direct error in MetaMask)
        require(!hasTwitterUserClaimed[twitterUser], "Already claimed");
        // TODO: Has enough followers, does exist long enough?

        emit NFTClaimed(twitterUser);
    }

}
