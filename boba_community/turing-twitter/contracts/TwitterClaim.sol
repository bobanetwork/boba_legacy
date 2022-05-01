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

        // idToVerify = walletAddress
        // string memory walletAddr = Strings.toHexString(uint256(uint160(_msgSender())), 20);
        // string memory t = bytes20ToLiteralString(bytes20(_msgSender()));
        bytes memory encRequest = abi.encode("hhh", "hhk"); // _msgSender(), twitterPostID_);

        // TODO: Check if number large enough?
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

    // TODO: Better way? Strings lib doesn't seem to work sufficiently for addresses
    /*function bytes20ToLiteralString(bytes20 data)
    private
    pure
    returns (string memory result)
    {
        bytes memory temp = new bytes(41);
        uint256 count;

        for (uint256 i = 0; i < 20; i++) {
            bytes1 currentByte = bytes1(data << (i * 8));

            uint8 c1 = uint8(
                bytes1((currentByte << 4) >> 4)
            );

            uint8 c2 = uint8(
                bytes1((currentByte >> 4))
            );

            if (c2 >= 0 && c2 <= 9) temp[++count] = bytes1(c2 + 48);
            else temp[++count] = bytes1(c2 + 87);

            if (c1 >= 0 && c1 <= 9) temp[++count] = bytes1(c1 + 48);
            else temp[++count] = bytes1(c1 + 87);
        }

        result = string(temp);
    }*/
}
