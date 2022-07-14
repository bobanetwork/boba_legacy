// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "./IL2StandardERC20.sol";

contract L2StandardERC20LayerZero is IL2StandardERC20, ERC20, Pausable, Ownable {
    address public l1Token;
    address public l2Bridge;
    uint8 private immutable _decimals;

    // Allow us to register a bridge to mint and burn tokens
    mapping(address => bool) public whitelistBridges;

    /**
     * @param _l2Bridge Address of the L2 standard bridge.
     * @param _l1Token Address of the corresponding L1 token.
     * @param _name ERC20 name.
     * @param _symbol ERC20 symbol.
     * @param decimals_ ERC20 decimals.
     */
    constructor(
        address _l2Bridge,
        address _l1Token,
        string memory _name,
        string memory _symbol,
        uint8 decimals_
    ) ERC20(_name, _symbol) {
        l1Token = _l1Token;
        l2Bridge = _l2Bridge;
        _decimals = decimals_;
    }

    /*********************/
    /*      Modifier     */
    /*********************/
    modifier onlyWhitelistBridge() {
        require(
            msg.sender == l2Bridge || whitelistBridges[msg.sender],
            "Only whitelist bridge can mint and burn"
        );
        _;
    }

    /******************/
    /*      Event     */
    /******************/
    event AddWhitelistBridge(address _sender, address _bridgeAddress);
    event RevokeWhitelistBridge(address _sender, address _bridgeAddress);

    /**********************/
    /*      Functions     */
    /**********************/

    /**
     * @dev Give the permission to bridge to mint and burn tokens.
     * @param _bridgeAddress The bridge address that can mint and burn tokens
     */
    function addWhitelistBridge(address _bridgeAddress) public onlyOwner {
        whitelistBridges[_bridgeAddress] = true;
        emit AddWhitelistBridge(msg.sender, _bridgeAddress);
    }

    /**
     * @dev Revoke the permission to bridge to mint and burn tokens.
     * @param _bridgeAddress The bridge address that can mint and burn tokens
     */
    function revokeWhitelistBridge(address _bridgeAddress) public onlyOwner {
        whitelistBridges[_bridgeAddress] = false;
        emit RevokeWhitelistBridge(msg.sender, _bridgeAddress);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function supportsInterface(bytes4 _interfaceId) public pure returns (bool) {
        bytes4 firstSupportedInterface = bytes4(keccak256("supportsInterface(bytes4)")); // ERC165
        bytes4 secondSupportedInterface = IL2StandardERC20.l1Token.selector ^
            IL2StandardERC20.mint.selector ^
            IL2StandardERC20.burn.selector;
        return _interfaceId == firstSupportedInterface || _interfaceId == secondSupportedInterface;
    }

    function mint(address _to, uint256 _amount) public virtual onlyWhitelistBridge whenNotPaused {
        _mint(_to, _amount);

        emit Mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) public virtual onlyWhitelistBridge whenNotPaused {
        _burn(_from, _amount);

        emit Burn(_from, _amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
