// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@eth-optimism/contracts/contracts/libraries/constants/Lib_PredeployAddresses.sol";

import "@eth-optimism/contracts/contracts/L2/messaging/IL2ERC20Bridge.sol";
import "@eth-optimism/contracts/contracts/L2/predeploys/OVM_GasPriceOracle.sol";
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract DiscretionaryExitBurn {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public l2Bridge;
    uint256 public extraGasRelay;

    constructor(address _l2Bridge) {
        l2Bridge = _l2Bridge;
    }

    modifier onlyGasPriceOracleOwner() {
        require(msg.sender == OVM_GasPriceOracle(Lib_PredeployAddresses.OVM_GAS_PRICE_ORACLE).owner(), 'caller is not the gasPriceOracle owner');
        _;
    }

    function configureExtraGasRelay(
        uint256 _extraGas
    )
        public
        onlyGasPriceOracleOwner()
    {
        extraGasRelay = _extraGas;
    }

    function burnAndWithdraw(
        address _l2Token,
        uint256 _amount,
        uint32 _l1Gas,
        bytes calldata _data
    ) external payable {
        // extra gas
        uint256 startingGas = gasleft();
        require(startingGas > extraGasRelay, "Insufficient Gas For a Relay Transaction");

        uint256 desiredGasLeft = startingGas.sub(extraGasRelay);
        uint256 i;
        while (gasleft() > desiredGasLeft) {
            i++;
        }

        require(msg.value != 0 || _l2Token != Lib_PredeployAddresses.OVM_ETH, "Amount Incorrect");

        if (msg.value != 0) {
            // override the _amount and token address
            _amount = msg.value;
            _l2Token = Lib_PredeployAddresses.OVM_ETH;
        }

        // transfer funds if users deposit ERC20
        if (_l2Token != Lib_PredeployAddresses.OVM_ETH) {
            IERC20(_l2Token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        // call withdrawTo on the l2Bridge
        IL2ERC20Bridge(l2Bridge).withdrawTo(_l2Token, msg.sender, _amount, _l1Gas, _data);
    }
}