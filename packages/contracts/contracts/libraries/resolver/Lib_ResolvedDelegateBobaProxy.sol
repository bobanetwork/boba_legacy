// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

/**
 * @title Lib_ResolvedDelegateBobaProxy
 */
contract Lib_ResolvedDelegateBobaProxy {
    /*************
     * Variables *
     *************/

    mapping(string => address) public addressManager;

    /***************
     * Constructor *
     ***************/

    /**
     * @param _proxyTarget Address of the target contract.
     */
    constructor(address _proxyTarget) {
        addressManager["proxyTarget"] = _proxyTarget;
        addressManager["proxyOwner"] = msg.sender;
    }

    /**********************
     * Function Modifiers *
     **********************/

    modifier proxyCallIfNotOwner() {
        if (msg.sender == addressManager["proxyOwner"]) {
            _;
        } else {
            // This WILL halt the call frame on completion.
            _doProxyCall();
        }
    }

    /*********************
     * Fallback Function *
     *********************/

    fallback() external payable {
        // Proxy call by default.
        _doProxyCall();
    }

    /********************
     * Public Functions *
     ********************/

    /**
     * Update target
     *
     * @param _proxyTarget address of proxy target contract
     */
    function setTargetContract(address _proxyTarget) external proxyCallIfNotOwner {
        addressManager["proxyTarget"] = _proxyTarget;
    }

    /**
     * Transfer owner
     */
    function transferProxyOwnership(address _newOwner) external proxyCallIfNotOwner {
        require(_newOwner != address(0), "New owner cannot be the zero address.");
        addressManager["proxyOwner"] = _newOwner;
    }

    /**
     * Performs the proxy call via a delegatecall.
     */
    function _doProxyCall() internal {
        require(addressManager["proxyOwner"] != address(0), "Target address must be initialized.");

        (bool success, bytes memory returndata) = addressManager["proxyTarget"].delegatecall(
            msg.data
        );

        if (success == true) {
            assembly {
                return(add(returndata, 0x20), mload(returndata))
            }
        } else {
            assembly {
                revert(add(returndata, 0x20), mload(returndata))
            }
        }
    }
}
