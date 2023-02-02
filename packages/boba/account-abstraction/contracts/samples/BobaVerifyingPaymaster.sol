/**
 * Credit - VerifyingPaymaster.sol from https://github.com/eth-infinitism/account-abstraction
 */

// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable reason-string */

import "../core/BasePaymaster.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * A sample paymaster that uses external service to decide whether to pay for the UserOp.
 * The paymaster trusts an external signer to sign the transaction.
 * The calling user must pass the UserOp to that external signer first, which performs
 * whatever off-chain verification before signing the UserOp.
 * Note that this signature is NOT a replacement for wallet signature:
 * - the paymaster signs to agree to PAY for GAS.
 * - the wallet signs to prove identity and wallet ownership.
 */
contract BobaVerifyingPaymaster is BasePaymaster {

    using ECDSA for bytes32;
    using UserOperationLib for UserOperation;

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

    /**
     * return the hash we're going to sign off-chain (and validate on-chain)
     * this method is called by the off-chain service, to sign the request.
     * it is called on-chain from the validatePaymasterUserOp, to validate the signature.
     * note that this signature covers all fields of the UserOperation, except the "paymasterAndData",
     * which will carry the signature itself.
     */
    function getHash(UserOperation calldata userOp)
    public pure returns (bytes32) {
        //can't use userOp.hash(), since it contains also the paymasterAndData itself.
        return keccak256(abi.encode(
                userOp.getSender(),
                userOp.nonce,
                keccak256(userOp.initCode),
                keccak256(userOp.callData),
                userOp.callGasLimit,
                userOp.verificationGasLimit,
                userOp.preVerificationGas,
                userOp.maxFeePerGas,
                userOp.maxPriorityFeePerGas
            ));
    }

    /**
     * verify our external signer signed this request.
     * the "paymasterAndData" is expected to be the paymaster and a signature over the entire request params
     */
    function validatePaymasterUserOp(UserOperation calldata userOp, bytes32 /*requestId*/, uint256 requiredPreFund)
    external view override returns (bytes memory context, uint256 deadline) {
        (requiredPreFund);

        bytes32 hash = getHash(userOp);
        bytes calldata paymasterAndData = userOp.paymasterAndData;
        uint256 sigLength = paymasterAndData.length - 20;
        //ECDSA library supports both 64 and 65-byte long signatures.
        // we only "require" it here so that the revert reason on invalid signature will be of "VerifyingPaymaster", and not "ECDSA"
        require(sigLength == 64 || sigLength == 65, "VerifyingPaymaster: invalid signature length in paymasterAndData");
        require(verifyingSigner == hash.toEthSignedMessageHash().recover(paymasterAndData[20 :]), "VerifyingPaymaster: wrong signature");

        require(_validateCallDataApprove(userOp.callData) || _validateCallDataDeposit(userOp.callData), "VerifyingPaymaster: invalid operation");
        //no need for other on-chain validation: entire UserOp should have been checked
        // by the external service prior to signing it.
        return ("", 0);
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
