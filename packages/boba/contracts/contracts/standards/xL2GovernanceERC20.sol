// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import { ERC20Votes } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { ERC20VotesComp } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/* External Imports */
import "@openzeppelin/contracts/security/Pausable.sol";

contract xL2GovernanceERC20 is ERC20, ERC20Permit, ERC20Votes, ERC20VotesComp, Pausable {
    uint224 public constant maxSupply = 500000000e18; // 500 million BOBA
    uint8 private immutable _decimals;
    address public owner;
    address public DAO;

    mapping(address => bool) public controllers;

    /**
     * @param _name ERC20 name.
     * @param _symbol ERC20 symbol.
     */
    constructor(
        string memory _name,
        string memory _symbol,
         uint8 decimals_
    )
        ERC20(_name, _symbol) ERC20Permit(_name) {
        _decimals = decimals_;
        owner = msg.sender;
        DAO = msg.sender;

        _pause();
    }

    modifier onlyOwner {
        require(msg.sender == owner || owner == address(0), 'Caller is not the owner');
        _;
    }

    modifier onlyDAO {
        require(msg.sender == DAO, 'Caller is not the owner');
        _;
    }

    modifier onlyController {
        require(controllers[msg.sender], "Only controller can mint and burn");
        _;
    }

    modifier onlyContract (address _address) {
        require(Address.isContract(_address), "Account not contract");
        _;
    }

    /**
     * transfer ownership
     *
     * @param _newOwner new owner of this contract
     */
    function transferOwnership(
        address _newOwner
    )
        public
        onlyOwner()
    {
        owner = _newOwner;
    }

    /**
     * transfer DAO
     *
     * @param _newDAO new owner of this contract
     */
    function transferDAO(
        address _newDAO
    )
        public
        onlyDAO()
    {
        DAO = _newDAO;
    }

    /**
     * add controller
     *
     * @param _controller new controller of this contract
     */
    function addController(
        address _controller
    )
        public
        onlyOwner()
        onlyContract(_controller)
    {
        require(!controllers[_controller]);
        controllers[_controller] = true;
    }

    /**
     * delete controller
     *
     * @param _controller controller of this contract
     */
    function deleteController(
        address _controller
    )
        public
        onlyOwner()
        onlyContract(_controller)
    {
        require(controllers[_controller]);
       controllers[_controller] = false;
    }

    /**
     * Pause contract
     */
    function pause() external onlyDAO() {
        _pause();
    }

    /**
     * UnPause contract
     */
    function unpause() external onlyDAO() {
        _unpause();
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function supportsInterface(bytes4 _interfaceId) public pure returns (bool) {
        bytes4 firstSupportedInterface = bytes4(keccak256("supportsInterface(bytes4)")); // ERC165
        return _interfaceId == firstSupportedInterface;
    }

    function mint(address _to, uint256 _amount) public virtual onlyController {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) public virtual onlyController {
        _burn(_from, _amount);
    }

    // Overrides required by Solidity
    function _mint(address _to, uint256 _amount) internal override (ERC20, ERC20Votes) {
        super._mint(_to, _amount);
    }

    function _burn(address _account, uint256 _amount) internal override (ERC20, ERC20Votes) {
        super._burn(_account, _amount);
    }

    function transfer(address recipient, uint256 amount) public virtual whenNotPaused override (ERC20) returns (bool) {
        return super.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual whenNotPaused override (ERC20) returns (bool) {
        return super.transferFrom(sender, recipient, amount);
    }

    function approve(address spender, uint256 amount) public virtual whenNotPaused override (ERC20) returns (bool) {
        return super.approve(spender, amount);
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual whenNotPaused override (ERC20) returns (bool) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual whenNotPaused override (ERC20) returns (bool) {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override (ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _maxSupply() internal pure override (ERC20Votes, ERC20VotesComp) returns (uint224) {
        return maxSupply;
    }
}
