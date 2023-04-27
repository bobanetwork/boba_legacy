// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */

import "../interfaces/IEntryPoint.sol";

contract EntryPointWrapper {
    /**
     * gas and return values during simulation
     * @param preOpGas the gas used for validation (including preValidationGas)
     * @param prefund the required prefund for this operation
     * @param sigFailed validateUserOp's (or paymaster's) signature check failed
     * @param validAfter - first timestamp this UserOp is valid (merging account and paymaster time-range)
     * @param validUntil - last timestamp this UserOp is valid (merging account and paymaster time-range)
     * @param paymasterContext returned by validatePaymasterUserOp (to be passed into postOp)
     */
    struct ReturnInfo {
        uint256 preOpGas;
        uint256 prefund;
        bool sigFailed;
        uint48 validAfter;
        uint48 validUntil;
        bytes paymasterContext;
    }

    struct StakeInfo {
        uint256 stake;
        uint256 unstakeDelaySec;
    }

    /**
     * returned aggregated signature info.
     * the aggregator returned by the account, and its current stake.
     */
    struct AggregatorStakeInfo {
        address aggregator;
        StakeInfo stakeInfo;
    }

    struct FailedOpStatus {
        bool status;
        uint256 opIndex;
        string reason;
    }

    struct Response {
        string selectorType;
        ReturnInfo returnInfo;
        StakeInfo senderInfo;
        StakeInfo factoryInfo;
        StakeInfo paymasterInfo;
        AggregatorStakeInfo aggregatorInfo;
    }


     /**
     * a custom revert error of handleOps, to identify the offending op.
     *  NOTE: if simulateValidation passes successfully, there should be no reason for handleOps to fail on it.
     *  @param opIndex - index into the array of ops to the failed one (in simulateValidation, this is always zero)
     *  @param reason - revert reason
     *      The string starts with a unique code "AAmn", where "m" is "1" for factory, "2" for account and "3" for paymaster issues,
     *      so a failure can be attributed to the correct entity.
     *   Should be caught in off-chain handleOps simulation and not happen on-chain.
     *   Useful for mitigating DoS attempts against batchers or for troubleshooting of factory/account/paymaster reverts.
     */
    error FailedOp(uint256 opIndex, string reason);

    /**
     * Successful result from simulateValidation.
     * @param returnInfo gas and time-range returned values
     * @param senderInfo stake information about the sender
     * @param factoryInfo stake information about the factory (if any)
     * @param paymasterInfo stake information about the paymaster (if any)
     */
    error ValidationResult(ReturnInfo returnInfo,
        StakeInfo senderInfo, StakeInfo factoryInfo, StakeInfo paymasterInfo);

    /**
     * Successful result from simulateValidation, if the account returns a signature aggregator
     * @param returnInfo gas and time-range returned values
     * @param senderInfo stake information about the sender
     * @param factoryInfo stake information about the factory (if any)
     * @param paymasterInfo stake information about the paymaster (if any)
     * @param aggregatorInfo signature aggregation info (if the account requires signature aggregator)
     *      bundler MUST use it to verify the signature, or reject the UserOperation
     */
    error ValidationResultWithAggregation(ReturnInfo returnInfo,
        StakeInfo senderInfo, StakeInfo factoryInfo, StakeInfo paymasterInfo,
        AggregatorStakeInfo aggregatorInfo);

    IEntryPoint public entryPoint;

    StakeInfo private emptyStakeInfo = StakeInfo(0, 0);
    AggregatorStakeInfo private emptyAggregatorInfo = AggregatorStakeInfo(address(0), emptyStakeInfo);
    ReturnInfo private emptyReturnInfo = ReturnInfo(0, 0, false, 0, 0, new bytes(0));
    Response private emptyResponse = Response("", emptyReturnInfo, emptyStakeInfo, emptyStakeInfo, emptyStakeInfo, emptyAggregatorInfo);
    FailedOpStatus private emptyFailedOp = FailedOpStatus(false, 0, "");

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
    }

    function simulateValidation(UserOperation calldata userOp) external returns (FailedOpStatus memory, Response memory) {
        try entryPoint.simulateValidation(userOp) {}
        catch (bytes memory revertData) {
            bytes4 receivedSelector = bytes4(revertData);

            if (receivedSelector == ValidationResult.selector) {
                (ReturnInfo memory returnInfo, StakeInfo memory senderInfo, StakeInfo memory factoryInfo, StakeInfo memory paymasterInfo) = abi.decode(slice(revertData, 4, revertData.length - 4), (ReturnInfo, StakeInfo, StakeInfo, StakeInfo));
                return (emptyFailedOp, Response('ValidationResult', returnInfo, senderInfo, factoryInfo, paymasterInfo, emptyAggregatorInfo));
            } else if (receivedSelector == ValidationResultWithAggregation.selector) {
                (ReturnInfo memory returnInfo, StakeInfo memory senderInfo, StakeInfo memory factoryInfo, StakeInfo memory paymasterInfo, AggregatorStakeInfo memory aggregatorInfo) = abi.decode(slice(revertData, 4, revertData.length - 4), (ReturnInfo, StakeInfo, StakeInfo, StakeInfo, AggregatorStakeInfo));
                return (emptyFailedOp, Response('ValidationResultWithAggregation', returnInfo, senderInfo, factoryInfo, paymasterInfo, aggregatorInfo));
            } else if (receivedSelector == FailedOp.selector){
                (uint256 opIndex, string memory reason) = abi.decode(slice(revertData, 4, revertData.length - 4), (uint256, string));
                return (FailedOpStatus(true, opIndex, reason), emptyResponse);
            }
        }
    }

    function slice(
        bytes memory _bytes,
        uint256 _start,
        uint256 _length
    )
        internal
        pure
        returns (bytes memory)
    {
        require(_length + 31 >= _length, "slice_overflow");
        require(_bytes.length >= _start + _length, "slice_outOfBounds");

        bytes memory tempBytes;

        assembly {
            switch iszero(_length)
            case 0 {
                // Get a location of some free memory and store it in tempBytes as
                // Solidity does for memory variables.
                tempBytes := mload(0x40)

                // The first word of the slice result is potentially a partial
                // word read from the original array. To read it, we calculate
                // the length of that partial word and start copying that many
                // bytes into the array. The first word we copy will start with
                // data we don't care about, but the last `lengthmod` bytes will
                // land at the beginning of the contents of the new array. When
                // we're done copying, we overwrite the full first word with
                // the actual length of the slice.
                let lengthmod := and(_length, 31)

                // The multiplication in the next line is necessary
                // because when slicing multiples of 32 bytes (lengthmod == 0)
                // the following copy loop was copying the origin's length
                // and then ending prematurely not copying everything it should.
                let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))
                let end := add(mc, _length)

                for {
                    // The multiplication in the next line has the same exact purpose
                    // as the one above.
                    let cc := add(add(add(_bytes, lengthmod), mul(0x20, iszero(lengthmod))), _start)
                } lt(mc, end) {
                    mc := add(mc, 0x20)
                    cc := add(cc, 0x20)
                } {
                    mstore(mc, mload(cc))
                }

                mstore(tempBytes, _length)

                //update free-memory pointer
                //allocating the array padded to 32 bytes like the compiler does now
                mstore(0x40, and(add(mc, 31), not(31)))
            }
            //if we want a zero-length slice let's just return a zero-length array
            default {
                tempBytes := mload(0x40)
                //zero out the 32 bytes slice we are about to return
                //we need to do it because Solidity does not garbage collect
                mstore(tempBytes, 0)

                mstore(0x40, add(tempBytes, 0x20))
            }
        }

        return tempBytes;
    }

    function getUserOpHashes(IEntryPoint entryPoint, UserOperation[] memory userOps) public view returns (bytes32[] memory ret) {
        ret = new bytes32[](userOps.length);
        for (uint i = 0; i < userOps.length; i++) {
            ret[i] = entryPoint.getUserOpHash(userOps[i]);
        }
        return ret;
    }

    function getCodeHashes(address[] memory addresses) public view returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](addresses.length);
        for (uint i = 0; i < addresses.length; i++) {
            hashes[i] = addresses[i].codehash;
        }
        bytes memory data = abi.encode(hashes);
        return (keccak256(data));
    }
}
