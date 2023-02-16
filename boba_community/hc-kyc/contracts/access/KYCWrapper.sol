// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../common/interfaces/ITuringHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
* @dev KYC wrapper for smart contracts respecting the users' privacy.
*/
contract KYCWrapper is Ownable {

    ITuringHelper public turingHelper;
    string private _apiUrl;
    mapping (address => bool) private _excludedFromKYC;

    event KYCResult(address indexed _wallet, bool indexed _isKYCed);

    modifier onlyKYCed() {
        require(isKYCedOrExcluded(_msgSender()), "Only KYCed or excluded wallets allowed");
        _;
    }

    constructor(string memory apiUrl_, address turingHelper_) {
        _apiUrl = apiUrl_;
        turingHelper = ITuringHelper(turingHelper_);
    }

    /**
    * @dev Exclude wallet(s) from KYC process if needed (e.g. for whitelisted smart contracts, etc.)
    */
    function excludeFromKYC(address[] memory _wallets, bool shouldBeExcluded) public onlyOwner {
        for (uint i = 0; i < _wallets.length; i++) {
            _excludedFromKYC[_wallets[i]] = shouldBeExcluded;
        }
    }

    /**
    * @dev Internal function to perform the actual request.
    * @param _wallet: Wallet to verify for KYC.
    */
    function makeRequest(address _wallet) private returns (bytes memory) {
        bytes memory encRequest = abi.encode(_wallet);
        return turingHelper.TuringTx(_apiUrl, encRequest);
    }

    /**
    * @dev Verifies whether wallet has been KYCed on a trusted platform or is excluded from KYC by the contract owners.
    * @param _wallet: Wallet to verify for KYC.
    */
    function isKYCedOrExcluded(address _wallet) private returns (bool) {
        // simply return true, if excluded from KYC
        if (_excludedFromKYC[_wallet]) return true;

        (uint256 resp) = abi.decode(makeRequest(_wallet), (uint256));

        bool isKYCed = resp != 0; // 0 = false, 1 = true
        emit KYCResult(_wallet, isKYCed);
        return isKYCed;
    }
}
