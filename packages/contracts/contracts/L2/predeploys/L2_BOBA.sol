// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* Library Imports */
import { Lib_PredeployAddresses } from "../../libraries/constants/Lib_PredeployAddresses.sol";

/* Contract Imports */
import { L2StandardERC20LayerZero } from "../../standards/L2StandardERC20LayerZero.sol";

/**
 * @title L2_BOBA
 * @dev The L2 BOBA predeploy provides an ERC20 interface for BOBA deposited to Layer 2. Note that
 * unlike on Layer 1, Layer 2 accounts do not have a balance field.
 */
contract L2_BOBA is L2StandardERC20LayerZero {
    /***************
     * Constructor *
     ***************/

    constructor(address _l1TokenAddress)
        L2StandardERC20LayerZero(
            Lib_PredeployAddresses.L2_STANDARD_BRIDGE,
            _l1TokenAddress,
            "BOBA Network",
            "BOBA",
            18
        )
    {}

    // BOBA features are disabled until further notice.
    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        revert("L2_BOBA: transfer is disabled pending further community discussion.");
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        revert("L2_BOBA: approve is disabled pending further community discussion.");
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        revert("L2_BOBA: transferFrom is disabled pending further community discussion.");
    }

    function increaseAllowance(address spender, uint256 addedValue)
        public
        virtual
        override
        returns (bool)
    {
        revert("L2_BOBA: increaseAllowance is disabled pending further community discussion.");
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        virtual
        override
        returns (bool)
    {
        revert("L2_BOBA: decreaseAllowance is disabled pending further community discussion.");
    }
}
