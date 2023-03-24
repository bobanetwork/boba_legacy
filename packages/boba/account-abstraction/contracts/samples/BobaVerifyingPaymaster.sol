/**
 * Credit - VerifyingPaymaster.sol from https://github.com/eth-infinitism/account-abstraction
 */

// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable reason-string */
/* solhint-disable no-inline-assembly */

import "../core/BasePaymaster.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * A sample paymaster that uses external service to decide whether to pay for the UserOp.
 * The paymaster trusts an external signer to sign the transaction.
 * The calling user must pass the UserOp to that external signer first, which performs
 * whatever off-chain verification before signing the UserOp.
 * Note that this signature is NOT a replacement for account-specific signature:
 * - the paymaster checks a signature to agree to PAY for GAS.
 * - the account checks a signature to prove identity and account ownership.
 */
contract BobaVerifyingPaymaster is BasePaymaster {

    using ECDSA for bytes32;
    using UserOperationLib for UserOperation;

    uint256 private constant VALID_TIMESTAMP_OFFSET = 20;

    uint256 private constant SIGNATURE_OFFSET = 84;

    address public immutable verifyingSigner;
    address public bobaDepositPaymaster;
    address public approvedToken;

    bytes4 public constant APPROVE_FUNCTION_SELECTOR = bytes4(keccak256("approve(address,uint256)"));
    bytes4 public constant DEPOSIT_FOR_FUNCTION_SELECTOR = bytes4(keccak256("addDepositFor(address,address,uint256)"));

    constructor(IEntryPoint _entryPoint, address _verifyingSigner, address _bobaDepositPaymaster, address _approvedToken) BasePaymaster(_entryPoint) {
        verifyingSigner = _verifyingSigner;
        bobaDepositPaymaster = _bobaDepositPaymaster;
        approvedToken = _approvedToken;
    }

    mapping(address => uint256) public senderNonce;

    function pack(UserOperation calldata userOp) internal pure returns (bytes memory ret) {
        // lighter signature scheme. must match UserOp.ts#packUserOp
        bytes calldata pnd = userOp.paymasterAndData;
        // copy directly the userOp from calldata up to (but not including) the paymasterAndData.
        // this encoding depends on the ABI encoding of calldata, but is much lighter to copy
        // than referencing each field separately.
        assembly {
            let ofs := userOp
            let len := sub(sub(pnd.offset, ofs), 32)
            ret := mload(0x40)
            mstore(0x40, add(ret, add(len, 32)))
            mstore(ret, len)
            calldatacopy(add(ret, 32), ofs, len)
        }
    }


    /**
     * return the hash we're going to sign off-chain (and validate on-chain)
     * this method is called by the off-chain service, to sign the request.
     * it is called on-chain from the validatePaymasterUserOp, to validate the signature.
     * note that this signature covers all fields of the UserOperation, except the "paymasterAndData",
     * which will carry the signature itself.
     */
    function getHash(UserOperation calldata userOp, uint48 validUntil, uint48 validAfter)
    public view returns (bytes32) {
        //can't use userOp.hash(), since it contains also the paymasterAndData itself.

        return keccak256(abi.encode(
                pack(userOp),
                block.chainid,
                address(this),
                senderNonce[userOp.getSender()],
                validUntil,
                validAfter
            ));
    }

    /**
     * verify our external signer signed this request.
     * the "paymasterAndData" is expected to be the paymaster and a signature over the entire request params
     * paymasterAndData[:20] : address(this)
     * paymasterAndData[20:84] : abi.encode(validUntil, validAfter)
     * paymasterAndData[84:] : signature
     */
    function _validatePaymasterUserOp(UserOperation calldata userOp, bytes32 /*userOpHash*/, uint256 requiredPreFund)
    internal override returns (bytes memory context, uint256 validationData) {
        (requiredPreFund);

        (uint48 validUntil, uint48 validAfter, bytes calldata signature) = parsePaymasterAndData(userOp.paymasterAndData);
        //ECDSA library supports both 64 and 65-byte long signatures.
        // we only "require" it here so that the revert reason on invalid signature will be of "VerifyingPaymaster", and not "ECDSA"
        require(signature.length == 64 || signature.length == 65, "VerifyingPaymaster: invalid signature length in paymasterAndData");
        bytes32 hash = ECDSA.toEthSignedMessageHash(getHash(userOp, validUntil, validAfter));
        senderNonce[userOp.getSender()]++;

        //don't revert on signature failure: return SIG_VALIDATION_FAILED
        if (verifyingSigner != ECDSA.recover(hash, signature)) {
            return ("",_packValidationData(true,validUntil,validAfter));
        }

        require(_validateCallDataApprove(userOp.callData) || _validateCallDataDeposit(userOp.callData), "VerifyingPaymaster: invalid operation");
        //no need for other on-chain validation: entire UserOp should have been checked
        // by the external service prior to signing it.
        return ("",_packValidationData(false,validUntil,validAfter));
    }

    function parsePaymasterAndData(bytes calldata paymasterAndData) public pure returns(uint48 validUntil, uint48 validAfter, bytes calldata signature) {
        (validUntil, validAfter) = abi.decode(paymasterAndData[VALID_TIMESTAMP_OFFSET:SIGNATURE_OFFSET],(uint48, uint48));
        signature = paymasterAndData[SIGNATURE_OFFSET:];
    }

    function _validateCallDataApprove(bytes calldata opCallData) internal view returns(bool) {
        // check approve
        if (opCallData.length != 228) return false;
        bytes4 funcSelector = bytes4(opCallData[132:136]);
        bytes calldata destData = opCallData[4:36];
        address dest = abi.decode(destData, (address));
        if (dest != approvedToken) return false;
        bytes memory approveParam = opCallData[136:200];
        (address spender, ) = abi.decode(approveParam, (address, uint256));
        if (funcSelector == APPROVE_FUNCTION_SELECTOR && spender == bobaDepositPaymaster) return true;
        return false;
    }

    function _validateCallDataDeposit(bytes calldata opCallData) internal view returns(bool) {
        // check approve
        if (opCallData.length != 260) return false;
        bytes4 funcSelector = bytes4(opCallData[132:136]);
        bytes calldata destData = opCallData[4:36];
        address dest = abi.decode(destData, (address));
        if (dest != bobaDepositPaymaster) return false;
        bytes memory depositParam = opCallData[136:232];
        (address token, , ) = abi.decode(depositParam, (address, address, uint256));
        if (funcSelector == DEPOSIT_FOR_FUNCTION_SELECTOR && token == approvedToken) return true;
        return false;
    }

}
