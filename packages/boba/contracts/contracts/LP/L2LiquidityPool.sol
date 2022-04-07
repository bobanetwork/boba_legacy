// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "./interfaces/iL1LiquidityPool.sol";

/* Library Imports */
import "@eth-optimism/contracts/contracts/libraries/bridge/CrossDomainEnabled.sol";
import "@eth-optimism/contracts/contracts/libraries/constants/Lib_PredeployAddresses.sol";

/* External Imports */
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@eth-optimism/contracts/contracts/L2/predeploys/OVM_GasPriceOracle.sol";
import "@eth-optimism/contracts/contracts/L2/messaging/L2StandardBridge.sol";

/* External Imports */
import "../standards/xL2GovernanceERC20.sol";
import "../L2BillingContract.sol";

/**
 * @dev An L2 LiquidityPool implementation
 */

contract L2LiquidityPool is CrossDomainEnabled, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /**************
     *   Struct   *
     **************/
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        uint256 pendingReward; // Pending reward
        //
        // We do some fancy math here. Basically, any point in time, the amount of rewards
        // entitled to a user but is pending to be distributed is:
        //
        //   Update Reward Per Share:
        //   accUserRewardPerShare = accUserRewardPerShare + (accUserReward - lastAccUserReward) / userDepositAmount
        //
        //  LP Provider:
        //      Deposit:
        //          Case 1 (new user):
        //              Update Reward Per Share();
        //              Calculate user.rewardDebt = amount * accUserRewardPerShare;
        //          Case 2 (user who has already deposited add more funds):
        //              Update Reward Per Share();
        //              Calculate user.pendingReward = amount * accUserRewardPerShare - user.rewardDebt;
        //              Calculate user.rewardDebt = (amount + new_amount) * accUserRewardPerShare;
        //
        //      Withdraw
        //          Update Reward Per Share();
        //          Calculate user.pendingReward = amount * accUserRewardPerShare - user.rewardDebt;
        //          Calculate user.rewardDebt = (amount - withdraw_amount) * accUserRewardPerShare;
    }
    // Info of each pool.
    struct PoolInfo {
        address l1TokenAddress; // Address of token contract.
        address l2TokenAddress; // Address of toekn contract.

        // balance
        uint256 userDepositAmount; // user deposit amount;

        // user rewards
        uint256 lastAccUserReward; // Last accumulated user reward
        uint256 accUserReward; // Accumulated user reward.
        uint256 accUserRewardPerShare; // Accumulated user rewards per share, times 1e12. See below.

        // owner rewards
        uint256 accOwnerReward; // Accumulated owner reward.

        // start time
        uint256 startTime;
    }
    // Token batch structure
    struct ClientPayToken {
        address payable to;
        address l2TokenAddress;
        uint256 amount;
    }

    /*************
     * Variables *
     *************/

    // mapping L1 and L2 token address to poolInfo
    mapping(address => PoolInfo) public poolInfo;
    // Info of each user that stakes tokens.
    mapping(address => mapping(address => UserInfo)) public userInfo;

    address public owner;
    address public L1LiquidityPoolAddress;
    uint256 public userRewardMinFeeRate;
    uint256 public ownerRewardFeeRate;
    // Default gas value which can be overridden if more complex logic runs on L1.
    uint32 public DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS;

    uint256 private constant SAFE_GAS_STIPEND = 2300;

    address public DAO;

    uint256 public extraGasRelay;

    uint256 public userRewardMaxFeeRate;

    address public xBOBAAddress;
    address public BOBAAddress;

    // mapping user address to the status of xBOBA
    mapping(address => bool) public xBOBAStatus;

    // billing contract address
    address public billingContractAddress;

    /********************
     *       Event      *
     ********************/

    event AddLiquidity(
        address sender,
        uint256 amount,
        address tokenAddress
    );

    event OwnerRecoverFee(
        address sender,
        address receiver,
        uint256 amount,
        address tokenAddress
    );

    event ClientDepositL2(
        address sender,
        uint256 receivedAmount,
        address tokenAddress
    );

    event ClientPayL2(
        address sender,
        uint256 amount,
        uint256 userRewardFee,
        uint256 ownerRewardFee,
        uint256 totalFee,
        address tokenAddress
    );

    event ClientPayL2Settlement(
        address sender,
        uint256 amount,
        uint256 userRewardFee,
        uint256 ownerRewardFee,
        uint256 totalFee,
        address tokenAddress
    );

    event WithdrawLiquidity(
        address sender,
        address receiver,
        uint256 amount,
        address tokenAddress
    );

    event WithdrawReward(
        address sender,
        address receiver,
        uint256 amount,
        address tokenAddress
    );

    event RebalanceLP(
        uint256 amount,
        address tokenAddress
    );

    event OwnershipTransferred(
        address newOwner
    );

    event DaoRoleTransferred(
        address newDao
    );

    /********************************
     * Constructor & Initialization *
     ********************************/

    constructor ()
        CrossDomainEnabled(address(0))
    {}

    /**********************
     * Function Modifiers *
     **********************/

    modifier onlyOwner() {
        require(msg.sender == owner || owner == address(0), 'Caller is not the owner');
        _;
    }

    modifier onlyDAO() {
        require(msg.sender == DAO, 'Caller is not the DAO');
        _;
    }

    modifier onlyNotInitialized() {
        require(address(L1LiquidityPoolAddress) == address(0), "Contract has been initialized");
        _;
    }

    modifier onlyInitialized() {
        require(address(L1LiquidityPoolAddress) != address(0), "Contract has not yet been initialized");
        _;
    }

    modifier onlyWithBillingContract() {
        require(billingContractAddress != address(0), "Billing contract address is not set");
        _;
    }

    /********************
     * Public Functions *
     ********************/

    /**
     * @dev transfer ownership
     *
     * @param _newOwner new owner of this contract
     */
    function transferOwnership(
        address _newOwner
    )
        public
        onlyOwner()
    {
        require(_newOwner != address(0), 'New owner cannot be the zero address');
        owner = _newOwner;
        emit OwnershipTransferred(_newOwner);
    }

    /**
     * @dev transfer priviledges to DAO
     *
     * @param _newDAO new fee setter
     */
    function transferDAORole(
        address _newDAO
    )
        public
        onlyDAO()
    {
        require(_newDAO != address(0), 'New DAO address cannot be the zero address');
        DAO = _newDAO;
        emit DaoRoleTransferred(_newDAO);
    }

    /**
     * @dev Initialize this contract.
     * @param _l2CrossDomainMessenger L2 Messenger address being used for sending the cross-chain message.
     * @param _L1LiquidityPoolAddress Address of the corresponding L1 LP deployed to the main chain
     */
    function initialize(
        address _l2CrossDomainMessenger,
        address _L1LiquidityPoolAddress
    )
        public
        onlyOwner()
        onlyNotInitialized()
        initializer()
    {
        require(_l2CrossDomainMessenger != address(0) && _L1LiquidityPoolAddress != address(0), "zero address not allowed");
        messenger = _l2CrossDomainMessenger;
        L1LiquidityPoolAddress = _L1LiquidityPoolAddress;
        owner = msg.sender;
        DAO = msg.sender;
        // translates to fee rates 0.1%, 1% and 1.5% respectively
        configureFee(1, 10, 15);
        configureGas(100000);

        __Context_init_unchained();
        __Pausable_init_unchained();
        __ReentrancyGuard_init_unchained();
    }

    /**
     * @dev Configure fee of this contract.
     * @dev Each fee rate is scaled by 10^3 for precision, eg- a fee rate of 50 would mean 5%
     * @param _userRewardMinFeeRate minimum fee rate that users get
     * @param _userRewardMaxFeeRate maximum fee rate that users get
     * @param _ownerRewardFeeRate fee rate that contract owner gets
     */
    function configureFee(
        uint256 _userRewardMinFeeRate,
        uint256 _userRewardMaxFeeRate,
        uint256 _ownerRewardFeeRate
    )
        public
        onlyDAO()
        onlyInitialized()
    {
        require(_userRewardMinFeeRate <= _userRewardMaxFeeRate && _userRewardMinFeeRate > 0 && _userRewardMaxFeeRate <= 50 && _ownerRewardFeeRate <= 50, 'user and owner fee rates should be lower than 5 percent each');
        userRewardMinFeeRate = _userRewardMinFeeRate;
        userRewardMaxFeeRate = _userRewardMaxFeeRate;
        ownerRewardFeeRate = _ownerRewardFeeRate;
    }

    /**
     * @dev Configure fee of the L1LP contract
     * @dev Each fee rate is scaled by 10^3 for precision, eg- a fee rate of 50 would mean 5%
     * @param _userRewardMinFeeRate minimum fee rate that users get
     * @param _userRewardMaxFeeRate maximum fee rate that users get
     * @param _ownerRewardFeeRate fee rate that contract owner gets
     */
    function configureFeeExits(
        uint256 _userRewardMinFeeRate,
        uint256 _userRewardMaxFeeRate,
        uint256 _ownerRewardFeeRate
    )
        external
        onlyDAO()
        onlyInitialized()
    {
        require(_userRewardMinFeeRate <= _userRewardMaxFeeRate && _userRewardMinFeeRate > 0 && _userRewardMaxFeeRate <= 50 && _ownerRewardFeeRate <= 50, 'user and owner fee rates should be lower than 5 percent each');
        bytes memory data = abi.encodeWithSelector(
            iL1LiquidityPool.configureFee.selector,
            _userRewardMinFeeRate,
            _userRewardMaxFeeRate,
            _ownerRewardFeeRate
        );

        // Send calldata into L1
        sendCrossDomainMessage(
            address(L1LiquidityPoolAddress),
            getFinalizeDepositL1Gas(),
            data
        );
    }

    /**
     * @dev Configure gas.
     *
     * @param _l1GasFee default finalized withdraw L1 Gas
     */
    function configureGas(
        uint32 _l1GasFee
    )
        public
        onlyOwner()
        onlyInitialized()
    {
        DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS = _l1GasFee;
    }

    /**
     * @dev Configure billing contract address.
     *
     * @param _billingContractAddress billing contract address
     */
    function configureBillingContractAddress(
        address _billingContractAddress
    )
        public
        onlyOwner()
    {
        require(_billingContractAddress != address(0), "Billing contract address cannot be zero");
        billingContractAddress = _billingContractAddress;
    }

    /**
     * @dev Return user reward fee rate.
     *
     * @param _l2TokenAddress L2 token address
     */
    function getUserRewardFeeRate(
        address _l2TokenAddress
    )
        public
        view
        onlyInitialized()
        returns (uint256 userRewardFeeRate)
    {
        PoolInfo storage pool = poolInfo[_l2TokenAddress];
        uint256 poolLiquidity = pool.userDepositAmount;
        uint256 poolBalance;
        if (_l2TokenAddress == Lib_PredeployAddresses.OVM_ETH) {
            poolBalance = address(this).balance;
        } else {
            poolBalance = IERC20(_l2TokenAddress).balanceOf(address(this));
        }
        if (poolBalance == 0) {
            return userRewardMaxFeeRate;
        } else {
            uint256 poolRewardRate = userRewardMinFeeRate * poolLiquidity / poolBalance;
            if (userRewardMinFeeRate > poolRewardRate) {
                return userRewardMinFeeRate;
            } else if (userRewardMaxFeeRate < poolRewardRate) {
                return userRewardMaxFeeRate;
            }
            return poolRewardRate;
        }
    }

    /***
     * @dev Register BOBA tokens
     *
     * @param _BOBAAddress L2 BOBA address
     * @param _xBOBAAddress L2 xBOBA address
     *
     */
    function registerBOBA (
        address _BOBAAddress,
        address _xBOBAAddress
    )
        public
        onlyOwner()
    {
        require(BOBAAddress == address(0) && _BOBAAddress != address(0) && _xBOBAAddress != address(0), "Invalid BOBA address");
        BOBAAddress = _BOBAAddress;
        xBOBAAddress = _xBOBAAddress;
    }


    /***
     * @dev Add the new token pair to the pool
     * DO NOT add the same LP token more than once. Rewards will be messed up if you do.
     *
     * @param _l1TokenAddress
     * @param _l2TokenAddress
     *
     */
    function registerPool (
        address _l1TokenAddress,
        address _l2TokenAddress
    )
        public
        onlyOwner()
    {
        require(_l1TokenAddress != _l2TokenAddress, "l1 and l2 token addresses cannot be same");
        require(_l2TokenAddress != address(0), "l2 token address cannot be zero address");
        // use with caution, can register only once
        PoolInfo storage pool = poolInfo[_l2TokenAddress];
        // l2 token address equal to zero, then pair is not registered.
        require(pool.l2TokenAddress == address(0), "Token Address Already Registered");
        poolInfo[_l2TokenAddress] =
            PoolInfo({
                l1TokenAddress: _l1TokenAddress,
                l2TokenAddress: _l2TokenAddress,
                userDepositAmount: 0,
                lastAccUserReward: 0,
                accUserReward: 0,
                accUserRewardPerShare: 0,
                accOwnerReward: 0,
                startTime: block.timestamp
            });
    }

    /**
     * @dev Overridable getter for the L1 gas limit of settling the deposit, in the case it may be
     * dynamic, and the above public constant does not suffice.
     *
     */
    function getFinalizeDepositL1Gas()
        public
        view
        virtual
        returns(
            uint32
        )
    {
        return DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS;
    }

    /**
     * Update the user reward per share
     * @param _tokenAddress Address of the target token.
     */
    function updateUserRewardPerShare(
        address _tokenAddress
    )
        public
    {
        PoolInfo storage pool = poolInfo[_tokenAddress];
        if (pool.lastAccUserReward < pool.accUserReward) {
            uint256 accUserRewardDiff = (pool.accUserReward.sub(pool.lastAccUserReward));
            if (pool.userDepositAmount != 0) {
                pool.accUserRewardPerShare = pool.accUserRewardPerShare.add(
                    accUserRewardDiff.mul(1e12).div(pool.userDepositAmount)
                );
            }
            pool.lastAccUserReward = pool.accUserReward;
        }
    }

    /**
     * Give xBOBA to users who has already deposited liquidity
     * @param _tokenAddress address of the liquidity token.
     */
    function mintXBOBAForPreOwner(
        address _tokenAddress
    )
        internal
    {
        if (!xBOBAStatus[msg.sender] && BOBAAddress == _tokenAddress && BOBAAddress != address(0)) {
            // mint xBoba
            UserInfo storage user = userInfo[_tokenAddress][msg.sender];
            if (user.amount != 0) {
                xL2GovernanceERC20(xBOBAAddress).mint(msg.sender, user.amount);
            }
            xBOBAStatus[msg.sender] = true;
        }
    }

    /**
     * Give xBOBA to users who deposit liquidity
     * @param _amount boba amount that users want to deposit.
     * @param _tokenAddress address of the liquidity token.
     */
    function mintXBOBA(
        uint256 _amount,
        address _tokenAddress
    )
        internal
    {
        if (BOBAAddress == _tokenAddress && BOBAAddress != address(0)) {
            // mint xBoba
            xL2GovernanceERC20(xBOBAAddress).mint(msg.sender, _amount);
        }
    }

   /**
     * Burn xBOBA for users who withdraw liquidity
     * @param _amount boba amount that users want to withdraw.
     * @param _tokenAddress address of the liquidity token.
     */
    function burnXBOBA(
        uint256 _amount,
        address _tokenAddress
    )
        internal
    {
        if (BOBAAddress == _tokenAddress && BOBAAddress != address(0)) {
            // burn xBOBA
            xL2GovernanceERC20(xBOBAAddress).burn(msg.sender, _amount);
        }
    }

    /**
     * Liquididity providers add liquidity
     * @param _amount liquidity amount that users want to deposit.
     * @param _tokenAddress address of the liquidity token.
     */
     function addLiquidity(
        uint256 _amount,
        address _tokenAddress
    )
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(msg.value != 0 || _tokenAddress != Lib_PredeployAddresses.OVM_ETH, "Either Amount Incorrect or Token Address Incorrect");
        // combine to make logical XOR to avoid user error
        require(!(msg.value != 0 && _tokenAddress != Lib_PredeployAddresses.OVM_ETH), "Either Amount Incorrect or Token Address Incorrect");
        // check whether user sends ovm_ETH or ERC20
        if (msg.value != 0) {
            // override the _amount and token address
            _amount = msg.value;
            _tokenAddress = Lib_PredeployAddresses.OVM_ETH;
        }

        PoolInfo storage pool = poolInfo[_tokenAddress];
        UserInfo storage user = userInfo[_tokenAddress][msg.sender];

        require(pool.l2TokenAddress != address(0), "Token Address Not Registered");

        // Send initial xBOBA
        mintXBOBAForPreOwner(_tokenAddress);

        // Update accUserRewardPerShare
        updateUserRewardPerShare(_tokenAddress);

        // if the user has already deposited token, we move the rewards to
        // pendingReward and update the reward debet.
        if (user.amount > 0) {
            user.pendingReward = user.pendingReward.add(
                user.amount.mul(pool.accUserRewardPerShare).div(1e12).sub(user.rewardDebt)
            );
            user.rewardDebt = (user.amount.add(_amount)).mul(pool.accUserRewardPerShare).div(1e12);
        } else {
            user.rewardDebt = _amount.mul(pool.accUserRewardPerShare).div(1e12);
        }

        // update amounts
        user.amount = user.amount.add(_amount);
        pool.userDepositAmount = pool.userDepositAmount.add(_amount);

        emit AddLiquidity(
            msg.sender,
            _amount,
            _tokenAddress
        );

        // transfer funds if users deposit ERC20
        if (_tokenAddress != Lib_PredeployAddresses.OVM_ETH) {
            IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        }

        //  xBOBA
        mintXBOBA(_amount, _tokenAddress);
    }

    /**
     * Client deposit ERC20 from their account to this contract, which then releases funds on the L1 side
     * @param _amount amount that client wants to transfer.
     * @param _tokenAddress L2 token address
     */
    function clientDepositL2(
        uint256 _amount,
        address _tokenAddress
    )
        external
        payable
        whenNotPaused
        onlyWithBillingContract
    {
        // Collect the exit fee
        L2BillingContract billingContract = L2BillingContract(billingContractAddress);
        IERC20(billingContract.feeTokenAddress()).safeTransferFrom(msg.sender, billingContractAddress, billingContract.exitFee());

        require(msg.value != 0 || _tokenAddress != Lib_PredeployAddresses.OVM_ETH, "Either Amount Incorrect or Token Address Incorrect");
        // combine to make logical XOR to avoid user error
        require(!(msg.value != 0 && _tokenAddress != Lib_PredeployAddresses.OVM_ETH), "Either Amount Incorrect or Token Address Incorrect");
        // check whether user sends ovm_ETH or ERC20
        if (msg.value != 0) {
            // override the _amount and token address
            _amount = msg.value;
            _tokenAddress = Lib_PredeployAddresses.OVM_ETH;
        }
        PoolInfo storage pool = poolInfo[_tokenAddress];

        require(pool.l2TokenAddress != address(0), "Token Address Not Registered");

        emit ClientDepositL2(
            msg.sender,
            _amount,
            _tokenAddress
        );

        // transfer funds if users deposit ERC20
        if (_tokenAddress != Lib_PredeployAddresses.OVM_ETH) {
            IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        }

        // Construct calldata for L1LiquidityPool.clientPayL1(_to, _amount, _tokenAddress)
        bytes memory data = abi.encodeWithSelector(
            iL1LiquidityPool.clientPayL1.selector,
            msg.sender,
            _amount,
            pool.l1TokenAddress
        );

        // Send calldata into L1
        sendCrossDomainMessage(
            address(L1LiquidityPoolAddress),
            getFinalizeDepositL1Gas(),
            data
        );

    }

    /**
     * Users withdraw token from LP
     * @param _amount amount to withdraw
     * @param _tokenAddress L2 token address
     * @param _to receiver to get the funds
     */
    function withdrawLiquidity(
        uint256 _amount,
        address _tokenAddress,
        address payable _to
    )
        external
        whenNotPaused
    {
        PoolInfo storage pool = poolInfo[_tokenAddress];
        UserInfo storage user = userInfo[_tokenAddress][msg.sender];

        require(pool.l2TokenAddress != address(0), "Token Address Not Registered");
        require(user.amount >= _amount, "Requested amount exceeds amount staked");

        // Send initial xBOBA
        mintXBOBAForPreOwner(_tokenAddress);

        // Update accUserRewardPerShare
        updateUserRewardPerShare(_tokenAddress);

        // calculate all the rewards and set it as pending rewards
        user.pendingReward = user.pendingReward.add(
            user.amount.mul(pool.accUserRewardPerShare).div(1e12).sub(user.rewardDebt)
        );
        // Update the user data
        user.amount = user.amount.sub(_amount);
        // update reward debt
        user.rewardDebt = user.amount.mul(pool.accUserRewardPerShare).div(1e12);
        // update total user deposit amount
        pool.userDepositAmount = pool.userDepositAmount.sub(_amount);

        emit WithdrawLiquidity(
            msg.sender,
            _to,
            _amount,
            _tokenAddress
        );

        if (_tokenAddress != Lib_PredeployAddresses.OVM_ETH) {
            IERC20(_tokenAddress).safeTransfer(_to, _amount);
        } else {
            (bool sent,) = _to.call{gas: SAFE_GAS_STIPEND, value: _amount}("");
            require(sent, "Failed to send ovm_Eth");
        }

        // burn xBOBA
        burnXBOBA(_amount, _tokenAddress);
    }

    /**
     * owner recovers fee from ERC20
     * @param _amount amount to transfer to the other account.
     * @param _tokenAddress L2 token address
     * @param _to receiver to get the fee.
     */
    function ownerRecoverFee(
        uint256 _amount,
        address _tokenAddress,
        address _to
    )
        external
        onlyOwner()
    {
        PoolInfo storage pool = poolInfo[_tokenAddress];

        require(pool.l2TokenAddress != address(0), "Token Address Not Registered");
        require(pool.accOwnerReward >= _amount, "Requested amount exceeds reward");

        pool.accOwnerReward = pool.accOwnerReward.sub(_amount);

        emit OwnerRecoverFee(
            msg.sender,
            _to,
            _amount,
            _tokenAddress
        );

        if (_tokenAddress != Lib_PredeployAddresses.OVM_ETH) {
            IERC20(_tokenAddress).safeTransfer(_to, _amount);
        } else {
            (bool sent,) = _to.call{gas: SAFE_GAS_STIPEND, value: _amount}("");
            require(sent, "Failed to send ovm_Eth");
        }
    }

    /**
     * withdraw reward from ERC20
     * @param _amount reward amount that liquidity providers want to withdraw
     * @param _tokenAddress L2 token address
     * @param _to receiver to get the reward
     */
    function withdrawReward(
        uint256 _amount,
        address _tokenAddress,
        address _to
    )
        external
        whenNotPaused
    {
        PoolInfo storage pool = poolInfo[_tokenAddress];
        UserInfo storage user = userInfo[_tokenAddress][msg.sender];

        require(pool.l2TokenAddress != address(0), "Token Address Not Registered");

        uint256 pendingReward = user.pendingReward.add(
            user.amount.mul(pool.accUserRewardPerShare).div(1e12).sub(user.rewardDebt)
        );

        require(pendingReward >= _amount, "Requested amount exceeds pendingReward");

        user.pendingReward = pendingReward.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accUserRewardPerShare).div(1e12);

        emit WithdrawReward(
            msg.sender,
            _to,
            _amount,
            _tokenAddress
        );

        if (_tokenAddress != Lib_PredeployAddresses.OVM_ETH) {
            IERC20(_tokenAddress).safeTransfer(_to, _amount);
        } else {
            (bool sent,) = _to.call{gas: SAFE_GAS_STIPEND, value: _amount}("");
            require(sent, "Failed to send ovm_Eth");
        }
    }

    /*
     * Rebalance LPs
     * @param _amount token amount that we want to move from L2 to L1
     * @param _tokenAddress L2 token address
     */
    function rebalanceLP(
        uint256 _amount,
        address _tokenAddress
    )
        external
        onlyOwner()
        whenNotPaused()
    {
        require(_amount != 0, "Amount cannot be 0");

        PoolInfo storage pool = poolInfo[_tokenAddress];

        require(L1LiquidityPoolAddress != address(0), "L1 Liquidity Pool Not Registered");
        require(pool.l2TokenAddress != address(0), "Token Address Not Registered");

        if (_tokenAddress == Lib_PredeployAddresses.OVM_ETH) {
            require(_amount <= address(this).balance, "Requested ETH exceeds pool balance");
            L2StandardBridge(Lib_PredeployAddresses.L2_STANDARD_BRIDGE).withdrawTo(
                _tokenAddress,
                L1LiquidityPoolAddress,
                _amount,
                DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS,
                ""
            );
        } else {
            require(_amount <= IERC20(_tokenAddress).balanceOf(address(this)), "Requested ERC20 exceeds pool balance");
            L2StandardBridge(Lib_PredeployAddresses.L2_STANDARD_BRIDGE).withdrawTo(
                _tokenAddress,
                L1LiquidityPoolAddress,
                _amount,
                DEFAULT_FINALIZE_WITHDRAWAL_L1_GAS,
                ""
            );
        }
        emit RebalanceLP(
            _amount,
            _tokenAddress
        );
    }

    /**
     * Pause contract
     */
    function pause() external onlyOwner() {
        _pause();
    }

    /**
     * UnPause contract
     */
    function unpause() external onlyOwner() {
        _unpause();
    }

    /*************************
     * Cross-chain Functions *
     *************************/

    /**
     * Move funds from L1 to L2, and pay out from the right liquidity pool
     * @param _to receiver to get the funds
     * @param _amount amount to to be transferred.
     * @param _tokenAddress L2 token address
     */
    function clientPayL2(
        address payable _to,
        uint256 _amount,
        address _tokenAddress
    )
        external
        onlyInitialized()
        onlyFromCrossDomainAccount(address(L1LiquidityPoolAddress))
        whenNotPaused
    {
        _initiateClientPayL2(_to, _amount, _tokenAddress);
    }

    /**
     * Move funds in batch from L1 to L2, and pay out from the right liquidity pool
     * @param _tokens tokens in batch
     */
    function clientPayL2Batch(
        ClientPayToken [] calldata _tokens
    )
        external
        onlyInitialized()
        onlyFromCrossDomainAccount(address(L1LiquidityPoolAddress))
        whenNotPaused
    {
        for (uint256 i = 0; i < _tokens.length; i++) {
            ClientPayToken memory token = _tokens[i];
            _initiateClientPayL2(token.to, token.amount, token.l2TokenAddress);
        }
    }

    /**
     * Move funds from L1 to L2, and pay out from the right liquidity pool
     * @param _to receiver to get the funds
     * @param _amount amount to to be transferred.
     * @param _tokenAddress L2 token address
     */
    function _initiateClientPayL2(
        address payable _to,
        uint256 _amount,
        address _tokenAddress
    )
        internal
    {
        // replyNeeded helps store the status if a message needs to be sent back to the other layer
        // in case there is not enough funds to give away
        bool replyNeeded = false;
        PoolInfo storage pool = poolInfo[_tokenAddress];
        // if this fails, relay can be attempted again after registering
        require(pool.l2TokenAddress != address(0), "Token Address Not Registered");
        uint256 userRewardFeeRate = getUserRewardFeeRate(_tokenAddress);
        uint256 userRewardFee = (_amount.mul(userRewardFeeRate)).div(1000);
        uint256 ownerRewardFee = (_amount.mul(ownerRewardFeeRate)).div(1000);
        uint256 totalFee = userRewardFee.add(ownerRewardFee);
        uint256 receivedAmount = _amount.sub(totalFee);

        if (_tokenAddress != Lib_PredeployAddresses.OVM_ETH) {
            if (receivedAmount > IERC20(_tokenAddress).balanceOf(address(this))) {
                replyNeeded = true;
            } else {
                pool.accUserReward = pool.accUserReward.add(userRewardFee);
                pool.accOwnerReward = pool.accOwnerReward.add(ownerRewardFee);
                IERC20(_tokenAddress).safeTransfer(_to, receivedAmount);
            }
        } else {
            if (receivedAmount > address(this).balance) {
                 replyNeeded = true;
             } else {
                pool.accUserReward = pool.accUserReward.add(userRewardFee);
                pool.accOwnerReward = pool.accOwnerReward.add(ownerRewardFee);
                 //this is ovm_ETH
                 (bool sent,) = _to.call{gas: SAFE_GAS_STIPEND, value: receivedAmount}("");
                 require(sent, "Failed to send ovm_Eth");
             }
         }


        if (replyNeeded) {
            // send cross domain message
            bytes memory data = abi.encodeWithSelector(
                iL1LiquidityPool.clientPayL1Settlement.selector,
                _to,
                _amount,
                pool.l1TokenAddress
            );

            sendCrossDomainMessage(
                address(L1LiquidityPoolAddress),
                getFinalizeDepositL1Gas(),
                data
            );
        } else {
            emit ClientPayL2(
                _to,
                receivedAmount,
                userRewardFee,
                ownerRewardFee,
                totalFee,
                _tokenAddress
            );
        }
    }

    /**
     * Settlement pay when there's not enough funds on other side
     * @param _to receiver to get the funds
     * @param _amount amount to to be transferred.
     * @param _tokenAddress L2 token address
     */
    function clientPayL2Settlement(
        address payable _to,
        uint256 _amount,
        address _tokenAddress
    )
        external
        onlyInitialized()
        onlyFromCrossDomainAccount(address(L1LiquidityPoolAddress))
        whenNotPaused
    {
        PoolInfo storage pool = poolInfo[_tokenAddress];
        uint256 userRewardFeeRate = getUserRewardFeeRate(_tokenAddress);
        uint256 userRewardFee = (_amount.mul(userRewardFeeRate)).div(1000);
        uint256 ownerRewardFee = (_amount.mul(ownerRewardFeeRate)).div(1000);
        uint256 totalFee = userRewardFee.add(ownerRewardFee);
        uint256 receivedAmount = _amount.sub(totalFee);

        pool.accUserReward = pool.accUserReward.add(userRewardFee);
        pool.accOwnerReward = pool.accOwnerReward.add(ownerRewardFee);

        emit ClientPayL2Settlement(
            _to,
            receivedAmount,
            userRewardFee,
            ownerRewardFee,
            totalFee,
            _tokenAddress
        );

        if (_tokenAddress != Lib_PredeployAddresses.OVM_ETH) {
            IERC20(_tokenAddress).safeTransfer(_to, receivedAmount);
        } else {
            //this is ovm_ETH
            (bool sent,) = _to.call{gas: SAFE_GAS_STIPEND, value: receivedAmount}("");
            require(sent, "Failed to send ovm_Eth");
        }
    }

}
