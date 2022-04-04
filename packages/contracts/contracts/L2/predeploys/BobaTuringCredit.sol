// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TuringHelper.sol";

/**
 * @title BobaTuringCredit
 * @dev The credit system for Boba Turing
 */
contract BobaTuringCredit is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**********************
     * Contract Variables *
     **********************/
    struct TuringRunner {
        uint256 prepaidBalance;
        uint256 unclaimedRevenue;
        uint256 tokenAmountStaked;
    }

    struct ApiEndpoint {
        string url;
        address turingHelper; // who is responsible for the api?
    }

    // TODO: Maybe find a more efficient data structure for this
    /// @dev Key being the turingHelper contract address.
    mapping(address => TuringRunner) public turingRunners;
    mapping(string => ApiEndpoint[]) public decentralizedApiCommands;

    IERC20 public turingToken;
    uint256 public turingPrice;

    /// @dev Amount of boba tokens needed to stake to register your own TuringHelper.
    uint256 public turingStake;

    /********************
     *      Events      *
     ********************/

    event TransferOwnership(address oldOwner, address newOwner);

    event AddBalanceTo(address sender, uint256 balanceAmount, address helperContractAddress);

    event WithdrawRevenue(address sender, uint256 withdrawAmount);

    /**********************
     * Function Modifiers *
     **********************/

    modifier onlyNotInitialized() {
        require(address(turingToken) == address(0), "Contract has been initialized");
        _;
    }

    modifier onlyInitialized() {
        require(address(turingToken) != address(0), "Contract has not yet been initialized");
        _;
    }

    modifier lockStake() {
        require(turingToken.balanceOf(_msgSender()) >= turingStake, "Not enough tokens");
        require(turingToken.allowance(_msgSender(), address(this)) >= turingStake, "Allowance too low");
        require(turingToken.transferFrom(_msgSender(), address(this), turingStake), "Transfer failed");
        _;
    }

    modifier isOwnerOfTuringHelper(address _turingHelper) {
        require(Ownable(_turingHelper).owner() == _msgSender(), "Caller not owner of TuringHelper"); // also implicitly requires the turingHelper to be set
        _;
    }

    /********************
     *    Constructor   *
     ********************/

    constructor(uint256 _turingPrice) {
        turingPrice = _turingPrice;
    }

    /********************
     * Public Functions *
     ********************/

    /// @dev Helper method for TuringHelper to get a "random" url out of the endpoints available for a specific command.
    function getDecentralizedOracle(string memory _command) public returns (string memory, address) {
        // TODO: use some sort of error score or at least remove failing TuringRunners from array sooner or later.
        // TODO: For server errors the TuringRunners might be punished with their staked tokens.

        // TODO: Ensure that Geth maybe removes the endPoints without turingCredits OR(!!??) make turingHelpers independent from apiUrls if possible
        ApiEndpoint memory apiEndpoint = decentralizedApiCommands[_command]
            [uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)))];
        return (apiEndpoint.url, apiEndpoint.turingHelper);
    }

    function registerAsTuringRunner(string[] memory _commands, string[] memory _endpoints) external lockStake {
        require(_commands.length == _endpoints.length, "Invalid api configuration");

        TuringHelper newTuringHelper = new TuringHelper(address(this), _msgSender());
        // regular factory, not using clone pattern here (needs to be discussed)
        // TODO: Funding TuringHelper needs to be done by users, and ensure that their contracts are the only ones using up the funds!

        turingRunners[address(newTuringHelper)] = TuringRunner({prepaidBalance : 0, unclaimedRevenue : 0, tokenAmountStaked : turingStake});

        for (uint i = 0; i < _commands.length; i++) {
            // add endpoints in a categorized manner to allow different logic
            // TODO: This way we would also need to have a way to ensure that users can only add commands if the logic is truly similar
            // TODO: The staked/locked tokens minimize bad behavior, but still people might categorize it wrong? Just keep it open and punish them if wrong configured?
            decentralizedApiCommands[_commands[i]].push(ApiEndpoint(_endpoints[i], address(newTuringHelper)));
        }
    }

    /**
     * @dev Update turing token
     *
     * @param _turingToken credit token address
     */
    function updateTuringToken(address _turingToken) public onlyOwner onlyNotInitialized {
        turingToken = IERC20(_turingToken);
    }

    /**
     * @dev Update turing price
     *
     * @param _turingPrice turing price for each off-chain computation
     */
    function updateTuringPrice(uint256 _turingPrice) public onlyOwner {
        turingPrice = _turingPrice;
    }

    /**
     * @dev Add credit for a Turing helper contract
     *
     * @param _addBalanceAmount the prepaid amount that the user want to add
     * @param _helperContractAddress the address of the turing helper contract
     */
    function addBalanceTo(uint256 _addBalanceAmount, address _helperContractAddress)
    public
    onlyInitialized
    {
        require(_addBalanceAmount != 0, "Invalid amount");
        require(Ownable(_helperContractAddress).owner() != address(0), "TuringHelper not registered");
        require(Address.isContract(_helperContractAddress), "Address is EOA");
        require(
            ERC165Checker.supportsInterface(_helperContractAddress, 0x2f7adf43),
            "Invalid Helper Contract"
        );

        turingRunners[_helperContractAddress].prepaidBalance += _addBalanceAmount;

        emit AddBalanceTo(_msgSender(), _addBalanceAmount, _helperContractAddress);

        // Transfer token to this contract
        turingToken.safeTransferFrom(_msgSender(), address(this), _addBalanceAmount);
    }

    /**
     * @dev Return the credit of a specific helper contract
     */
    function getCreditAmount(address _helperContractAddress) public view returns (uint256) {
        require(turingPrice != 0, "Unlimited credit");
        return turingRunners[_helperContractAddress].prepaidBalance.div(turingPrice);
    }

    /**
     * @dev Turing runner withdraws revenue
     *
     * @param _withdrawAmount the revenue amount that the user wants to withdraw
     */
    function withdrawRevenue(uint256 _withdrawAmount, address _turingHelper) public isOwnerOfTuringHelper(_turingHelper) onlyInitialized {
        require(_withdrawAmount <= turingRunners[_turingHelper].unclaimedRevenue, "Invalid Amount");

        turingRunners[_turingHelper].unclaimedRevenue -= _withdrawAmount;

        emit WithdrawRevenue(_msgSender(), _withdrawAmount);

        turingToken.safeTransfer(_msgSender(), _withdrawAmount);
    }

    function unregisterAsTuringRunner(address _turingHelper) external isOwnerOfTuringHelper(_turingHelper) onlyInitialized {
        TuringRunner memory turingRunner = turingRunners[_turingHelper];

        // pay back remaining funds (leave responsibility to turingRunner for reimbursing people who funded the turingHelper)
        turingToken.safeTransfer(_msgSender(),
            turingRunner.unclaimedRevenue + turingRunner.tokenAmountStaked + turingRunner.prepaidBalance);

        turingRunner.tokenAmountStaked = 0;
        turingRunner.unclaimedRevenue = 0;
        turingRunner.prepaidBalance = 0;
    }
}
