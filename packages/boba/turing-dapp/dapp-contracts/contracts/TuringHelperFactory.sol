pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./TuringHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITuringCredit {
    function addBalanceTo(uint256, address) external;
}

contract TuringHelperFactory is Ownable {

    address public turingImplementation;
    ITuringCredit public turingCredit;
    IERC20 public bobaToken;

    event TuringHelperDeployed(TuringHelper proxy, uint256 depositedBoba);

    modifier takePayment(uint256 bobaToDeposit) {
        require(bobaToken.balanceOf(_msgSender()) >= bobaToDeposit, "Not enough tokens");
        require(bobaToken.allowance(_msgSender(), address(this)) >= bobaToDeposit, "Allowance too low");
        require(bobaToken.transferFrom(_msgSender(), address(this), bobaToDeposit), "Payment failed");
        _;
    }

    constructor(address bobaToken_, address turingImplementation_, address turingCredit_) {
        bobaToken = IERC20(bobaToken_);
        turingImplementation = turingImplementation_;
        turingCredit = ITuringCredit(turingCredit_);
    }

    function changeTuringHelperImpl(address turingImplementation_) external onlyOwner {
        turingImplementation = turingImplementation_;
    }

    // TODO: add also support for ETH payments (with then just swapping to Boba for TuringCredit etc.)
    // https://github.com/OolongSwap/oolongswap-deployments
    function deployMinimal(address[] memory permittedCallers, uint256 amountBoba) takePayment(amountBoba) external returns (TuringHelper) {

        // This will create a minimal proxy for the implementation contract.
        TuringHelper implementation = TuringHelper(Clones.clone(turingImplementation));

        // Other way, if we just stick with .call we can use this as well: implementation.initialize(_msgSender());
        bytes memory _encodedFunction = abi.encodeWithSignature(
            "initialize()"
        );
        // if (_encodedFunction.length > 0) {
            (bool success,) = address(implementation).call(_encodedFunction);
            require(success, "Proxy call failed");
        // }

        // add permitted callers in same transaction, for better UX
        implementation.addPermittedCallers(permittedCallers);

        // Add balance to TuringCredit associated with new turingHelper
        bobaToken.approve(address(turingCredit), amountBoba);
        turingCredit.addBalanceTo(amountBoba, address(implementation));

        // TODO: Transfer ownership, maybe solve with .delegatecall to automatically have original msgSender as owner
        implementation.transferOwnership(_msgSender());

        emit TuringHelperDeployed(implementation, amountBoba);

        return implementation;
    }
}
