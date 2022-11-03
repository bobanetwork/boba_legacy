//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ITuringHelper.sol";

contract ComplexType {

    ITuringHelper public turingHelper;
    string private _turingUri;

   constructor(address turingHelper_, string memory turingUri_) {
       turingHelper = ITuringHelper(turingHelper_);
       _turingUri = turingUri_;
   }

    /// @dev Exemplary function to load more complex types from Turing.
    function loadData(address wallet_, string calldata someID_) external {

        // You can send here whatever you want
        bytes memory encRequest = abi.encode(wallet_, someID_);
        bytes memory byteRes = turingHelper.TuringTxV2(_turingUri, encRequest);
        // Decode returned data into its expected types
        (uint256[] memory someNumbers, string[] memory someTextArray, string memory someOtherText) = abi.decode(byteRes, (uint256[], string[], string));

        // .. work with your data here
    }
}
