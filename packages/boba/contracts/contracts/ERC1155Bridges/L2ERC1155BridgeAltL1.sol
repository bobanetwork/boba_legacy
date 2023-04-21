// SPDX-License-Identifier: MIT

/**
 Note: This contract has not been audited, exercise caution when using this on mainnet
 */
pragma solidity 0.8.9;
pragma experimental ABIEncoderV2;

/* Interface Imports */
import { iL1ERC1155Bridge } from "./interfaces/iL1ERC1155Bridge.sol";
import { iL2ERC1155BridgeAltL1 } from "./interfaces/iL2ERC1155BridgeAltL1.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC1155MetadataURI } from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";

/* Library Imports */
import { ERC165Checker } from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import { CrossDomainEnabled } from "@eth-optimism/contracts/contracts/libraries/bridge/CrossDomainEnabled.sol";
import { ERC1155Holder } from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@eth-optimism/contracts/contracts/libraries/constants/Lib_PredeployAddresses.sol";

/* Contract Imports */
import { IL2StandardERC1155 } from "../standards/IL2StandardERC1155.sol";

/* External Imports */
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@eth-optimism/contracts/contracts/L2/predeploys/OVM_GasPriceOracle.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/* External Imports */
import { L2BillingContract } from "../L2BillingContract.sol";

/**
 * @title L2ERC1155BridgeAltL1
 * @dev The L2 ERC1155 bridge is a contract which works together with the L1 Standard bridge to
 * enable ERC1155 transitions between L1 and L2.
 * This contract acts as a minter for new tokens when it hears about deposits into the L1 Standard
 * bridge.
 * This contract also acts as a burner of the tokens intended for withdrawal, informing the L1
 * bridge to release L1 funds.
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
 // add is interface
contract L2ERC1155BridgeAltL1 is iL2ERC1155BridgeAltL1, CrossDomainEnabled, ERC1155Holder, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /********************************
     * External Contract References *
     ********************************/

    address public owner;
    address public l1Bridge;
    // this is unused, however is a part of the contract to preserve the storage layout
    uint256 public extraGasRelay;
    uint32 public exitL1Gas;

    enum Network { L1, L2 }

    // Info of each token
    struct PairTokenInfo {
        address l1Contract;
        address l2Contract;
        Network baseNetwork; // L1 or L2
    }

    // Maps L2 token to tokenId to L1 token contract deposited for the native L2 token
    mapping(address => mapping (uint256 => uint256)) public exits;
    // Maps L2 token address to tokenInfo
    mapping(address => PairTokenInfo) public pairTokenInfo;

    // billing contract address
    address payable public billingContractAddress;

    event OwnershipTransferred(
        address newOwner
    );

    event GasConfigured(
        address exitL1Gas
    );

    event PairRegistered(
        address l1Contract,
        address l2Contract,
        string baseNetwork
    );

    event BillingContractUpdated(
        address billingContract
    )

    /***************
     * Constructor *
     ***************/

    constructor()
        CrossDomainEnabled(address(0))
    {}

    /**********************
     * Function Modifiers *
     **********************/
    modifier onlyOwner() {
        require(msg.sender == owner || owner == address(0), 'Caller is not the owner');
        _;
    }

    modifier onlyInitialized() {
        require(address(messenger) != address(0), "Contract has not yet been initialized");
        _;
    }

    modifier onlyWithBillingContract() {
        require(billingContractAddress != address(0), "Billing contract address is not set");
        _;
    }

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
        require(_newOwner != address(0), "New owner cannot be the zero address");
        owner = _newOwner;
        emit OwnershipTransferred(owner);
    }

    /**
     * @param _l2CrossDomainMessenger Cross-domain messenger used by this contract.
     * @param _l1Bridge Address of the L1 bridge deployed to the main chain.
     */
    function initialize(
        address _l2CrossDomainMessenger,
        address _l1Bridge
    )
        public
        onlyOwner()
        initializer()
    {
        require(messenger == address(0), "Contract has already been initialized.");
        require(_l2CrossDomainMessenger != address(0) && _l1Bridge != address(0), "zero address not allowed");
        messenger = _l2CrossDomainMessenger;
        l1Bridge = _l1Bridge;
        owner = msg.sender;
        configureGas(100000);

        __Context_init_unchained();
        __Pausable_init_unchained();
        __ReentrancyGuard_init_unchained();
    }

    /**
     * Configure gas.
     *
     * @param _exitL1Gas default finalized withdraw L1 Gas
     */
    function configureGas(
        uint32 _exitL1Gas
    )
        public
        onlyOwner()
        onlyInitialized()
    {
        exitL1Gas = _exitL1Gas;
        emit GasConfigured(exitL1Gas);
    }

    /**
     * @dev Configure billing contract address.
     *
     * @param _billingContractAddress billing contract address
     */
    function configureBillingContractAddress(
        address payable _billingContractAddress
    )
        public
        onlyOwner()
    {
        require(_billingContractAddress != address(0), "Billing contract address cannot be zero");
        billingContractAddress = _billingContractAddress;
        emit BillingContractUpdated(billingContractAddress);
    }

    /***
     * @dev Add the new token pair to the pool
     * DO NOT add the same token token more than once.
     *
     * @param _l1Contract L1 token contract address
     * @param _l2Contract L2 token contract address
     * @param _baseNetwork Network where the token contract was created
     *
     */
    function registerPair(
        address _l1Contract,
        address _l2Contract,
        string memory _baseNetwork
    )
        public
        onlyOwner()
    {
        require(_l1Contract != address(0), "L1 token cannot be zero address");
        //create2 would prevent this check
        //require(_l1Contract != _l2Contract, "Contracts should not be the same");
        bytes4 erc1155 = 0xd9b67a26;
        require(ERC165Checker.supportsInterface(_l2Contract, erc1155), "L2 token is not ERC1155 compatible");
        bytes32 bn = keccak256(abi.encodePacked(_baseNetwork));
        bytes32 l1 = keccak256(abi.encodePacked("L1"));
        bytes32 l2 = keccak256(abi.encodePacked("L2"));
        // l1 token address equal to zero, then pair is not registered yet.
        // use with caution, can register only once
        PairTokenInfo storage pairToken = pairTokenInfo[_l2Contract];
        require(pairToken.l1Contract == address(0), "L1 token address already registered");
        // _baseNetwork can only be L1 or L2
        require(bn == l1 || bn == l2, "Invalid Network");
        Network baseNetwork;
        if (bn == l1) {
            // check the IL2StandardERC1155 interface is supported
            require(ERC165Checker.supportsInterface(_l2Contract, 0x945d1710), "L2 contract is not bridgable");
            baseNetwork = Network.L1;
        }
        else {
            baseNetwork = Network.L2;
        }

        pairTokenInfo[_l2Contract] =
            PairTokenInfo({
                l1Contract: _l1Contract,
                l2Contract: _l2Contract,
                baseNetwork: baseNetwork
            });

        emit PairRegistered(_l1Contract, _l2Contract, _baseNetwork);
    }

    /***************
     * Withdrawing *
     ***************/

    /**
     * @inheritdoc iL2ERC1155BridgeAltL1
     */
    function withdraw(
        address _l2Contract,
        uint256 _tokenId,
        uint256 _amount,
        bytes memory _data,
        uint32 _l1Gas
    )
        external
        payable
        virtual
        override
        nonReentrant()
        whenNotPaused()
    {
        //  This check could be bypassed by a malicious contract via initcode,
        // but it takes care of the user error we want to avoid.
        require(!Address.isContract(msg.sender), "Account not EOA");
        _initiateWithdrawal(
            _l2Contract,
            msg.sender,
            msg.sender,
            _tokenId,
            _amount,
            _data,
            _l1Gas
        );
    }

    /**
     * @inheritdoc iL2ERC1155BridgeAltL1
     */
    function withdrawBatch(
        address _l2Contract,
        uint256[] memory _tokenIds,
        uint256[] memory _amounts,
        bytes memory _data,
        uint32 _l1Gas
    )
        external
        payable
        virtual
        override
        nonReentrant()
        whenNotPaused()
    {
        //  This check could be bypassed by a malicious contract via initcode,
        // but it takes care of the user error we want to avoid.
        require(!Address.isContract(msg.sender), "Account not EOA");
        _initiateWithdrawalBatch(
            _l2Contract,
            msg.sender,
            msg.sender,
            _tokenIds,
            _amounts,
            _data,
            _l1Gas
        );
    }

    /**
     * @inheritdoc iL2ERC1155BridgeAltL1
     */
    function withdrawTo(
        address _l2Contract,
        address _to,
        uint256 _tokenId,
        uint256 _amount,
        bytes memory _data,
        uint32 _l1Gas
    )
        external
        payable
        virtual
        override
        nonReentrant()
        whenNotPaused()
    {
        _initiateWithdrawal(
            _l2Contract,
            msg.sender,
            _to,
            _tokenId,
            _amount,
            _data,
            _l1Gas
        );
    }

    /**
     * @inheritdoc iL2ERC1155BridgeAltL1
     */
    function withdrawBatchTo(
        address _l2Contract,
        address _to,
        uint256[] memory _tokenIds,
        uint256[] memory _amounts,
        bytes memory _data,
        uint32 _l1Gas
    )
        external
        payable
        virtual
        override
        nonReentrant()
        whenNotPaused()
    {
        _initiateWithdrawalBatch(
            _l2Contract,
            msg.sender,
            _to,
            _tokenIds,
            _amounts,
            _data,
            _l1Gas
        );
    }

    /**
     * @dev Performs the logic for withdrawals by burning the token and informing the L1 ERC721 Gateway
     * of the withdrawal.
     * @param _l2Contract Address of L2 ERC721 where withdrawal was initiated.
     * @param _from Account to pull the deposit from on L2.
     * @param _to Account to give the withdrawal to on L1.
     * @param _tokenId id of token to withdraw.
     * @param _amount Amount of the tokens to withdraw.
     * @param _data Optional data for events.
     * param _l1Gas Unused, but included for potential forward compatibility considerations.
     * or encoded tokenURI, in this order of priority if user choses to send, is empty otherwise
     */
    function _initiateWithdrawal(
        address _l2Contract,
        address _from,
        address _to,
        uint256 _tokenId,
        uint256 _amount,
        bytes memory _data,
        uint32 _l1Gas
    )
        internal
        onlyWithBillingContract()
    {
        // Collect the exit fee
        L2BillingContract billingContract = L2BillingContract(billingContractAddress);
        require(msg.value == billingContract.exitFee(), "Not enough fee");
        (bool sent,) = billingContractAddress.call{gas: 3000, value: billingContract.exitFee()}("");
        require(sent, "Failed to send BOBA");

        PairTokenInfo storage pairToken = pairTokenInfo[_l2Contract];
        require(pairToken.l1Contract != address(0), "Can't Find L1 token Contract");
        require(_from == msg.sender, "Sender does not have token priviledges");

        require(_amount > 0, "Amount should be greater than 0");

        if (pairToken.baseNetwork == Network.L1) {
            address l1Contract = IL2StandardERC1155(_l2Contract).l1Contract();
            require(pairToken.l1Contract == l1Contract, "L1 token Contract Address Error");

            // When a withdrawal is initiated, we burn the withdrawer's funds to prevent subsequent L2
            // usage
           // When a withdrawal is initiated, we burn the withdrawer's funds to prevent subsequent L2
            // usage
            uint256 balance = IL2StandardERC1155(_l2Contract).balanceOf(msg.sender, _tokenId);
            require(_amount <= balance, "Amount exceeds balance");

            IL2StandardERC1155(_l2Contract).burn(msg.sender, _tokenId, _amount);

            // Construct calldata for l1ERC1155Bridge.finalizeWithdrawal(_to, _amount)
            bytes memory message;

            message = abi.encodeWithSelector(
                        iL1ERC1155Bridge.finalizeWithdrawal.selector,
                        l1Contract,
                        _l2Contract,
                        _from,
                        _to,
                        _tokenId,
                        _amount,
                        _data
                    );

            // Send message up to L1 bridge
            sendCrossDomainMessage(
                l1Bridge,
                _l1Gas,
                message
            );
        } else {
            // When a native token is withdrawn on L2, the L1 Bridge mints the funds to itself for future
            // withdrawals. safeTransferFrom would fail if it’s address(0).
            // And the call fails if it’s not an EOA
            IERC1155(_l2Contract).safeTransferFrom(
                _from,
                address(this),
                _tokenId,
                _amount,
                _data
            );

            // Construct calldata for _l2Contract.finalizeDeposit(_to, _amount)
            bytes memory message = abi.encodeWithSelector(
                iL1ERC1155Bridge.finalizeWithdrawal.selector,
                pairToken.l1Contract,
                _l2Contract,
                _from,
                _to,
                _tokenId,
                _amount,
                _data
            );

            // Send calldata into L2
            sendCrossDomainMessage(
                l1Bridge,
                _l1Gas,
                message
            );

            exits[_l2Contract][_tokenId] += _amount;
        }
        emit WithdrawalInitiated(pairToken.l1Contract, _l2Contract, msg.sender, _to, _tokenId, _amount, _data);
    }

 /**
     * @dev Performs the logic for withdrawals by burning the token and informing the L1 ERC721 Gateway
     * of the withdrawal.
     * @param _l2Contract Address of L2 ERC721 where withdrawal was initiated.
     * @param _from Account to pull the deposit from on L2.
     * @param _to Account to give the withdrawal to on L1.
     * @param _tokenIds ids of tokens to withdraw.
     * @param _amounts Amounts of the tokens to withdraw.
    * @param _data Optional data for events.
     * param _l1Gas Unused, but included for potential forward compatibility considerations.
     * or encoded tokenURI, in this order of priority if user choses to send, is empty otherwise
     */
    function _initiateWithdrawalBatch(
        address _l2Contract,
        address _from,
        address _to,
        uint256[] memory _tokenIds,
        uint256[] memory _amounts,
        bytes memory _data,
        uint32 _l1Gas
    )
        internal
        onlyWithBillingContract()
    {
        // Collect the exit fee
        L2BillingContract billingContract = L2BillingContract(billingContractAddress);
        require(msg.value == billingContract.exitFee(), "Not enough fee");
        (bool sent,) = billingContractAddress.call{gas: 3000, value: billingContract.exitFee()}("");
        require(sent, "Failed to send BOBA");

        PairTokenInfo storage pairToken = pairTokenInfo[_l2Contract];
        require(pairToken.l1Contract != address(0), "Can't Find L1 token Contract");
        require(_from == msg.sender, "Sender does not have token priviledges");
        require(_tokenIds.length == _amounts.length, "TokenId and Amount list size do not match");

        for (uint256 i = 0; i < _amounts.length; i++) {
            require(_amounts[i] > 0, "Amount should be greater than 0");
        }

        if (pairToken.baseNetwork == Network.L1) {
            address l1Contract = IL2StandardERC1155(_l2Contract).l1Contract();
            require(pairToken.l1Contract == l1Contract, "L1 token Contract Address Error");

            IL2StandardERC1155(_l2Contract).burnBatch(msg.sender, _tokenIds, _amounts);

            // Construct calldata for l1ERC1155Bridge.finalizeWithdrawal(_to, _amount)
            bytes memory message;

            message = abi.encodeWithSelector(
                        iL1ERC1155Bridge.finalizeWithdrawalBatch.selector,
                        l1Contract,
                        _l2Contract,
                        _from,
                        _to,
                        _tokenIds,
                        _amounts,
                        _data
                    );

            // Send message up to L1 bridge
            sendCrossDomainMessage(
                l1Bridge,
                _l1Gas,
                message
            );
        } else {
            // When a native token is withdrawn on L2, the L1 Bridge mints the funds to itself for future
            // withdrawals. safeTransferFrom would fail if it’s address(0).
            // And the call fails if it’s not an EOA
            IERC1155(_l2Contract).safeBatchTransferFrom(
                _from,
                address(this),
                _tokenIds,
                _amounts,
                _data
            );

            // Construct calldata for _l2Contract.finalizeDeposit(_to, _amount)
            bytes memory message = abi.encodeWithSelector(
                iL1ERC1155Bridge.finalizeWithdrawalBatch.selector,
                pairToken.l1Contract,
                _l2Contract,
                _from,
                _to,
                _tokenIds,
                _amounts,
                _data
            );

            // Send calldata into L2
            sendCrossDomainMessage(
                l1Bridge,
                _l1Gas,
                message
            );

            for (uint256 i = 0; i < _tokenIds.length; i++) {
                exits[_l2Contract][_tokenIds[i]] += _amounts[i];
            }
        }
        emit WithdrawalBatchInitiated(pairToken.l1Contract, _l2Contract, msg.sender, _to, _tokenIds, _amounts, _data);
    }

    /************************************
     * Cross-chain Function: Depositing *
     ************************************/

    // /**
    //  * @inheritdoc IL2ERC20Bridge
    //  */
    function finalizeDeposit(
        address _l1Contract,
        address _l2Contract,
        address _from,
        address _to,
        uint256 _tokenId,
        uint256 _amount,
        bytes memory _data
    )
        external
        virtual
        override
        onlyFromCrossDomainAccount(l1Bridge)
    {
        PairTokenInfo storage pairToken = pairTokenInfo[_l2Contract];

        if (pairToken.baseNetwork == Network.L1) {
            // replyNeeded helps store the status if a message needs to be sent back to the other layer
            bool replyNeeded = false;
            // Check the target token is compliant and
            // verify the deposited token on L1 matches the L2 deposited token representation here
            if (
                // check with interface of IL2StandardERC1155
                ERC165Checker.supportsInterface(_l2Contract, 0x945d1710) &&
                _l1Contract == IL2StandardERC1155(_l2Contract).l1Contract()
            ) {
                // When a deposit is finalized, we credit the account on L2 with the same amount of
                // tokens.
                try IL2StandardERC1155(_l2Contract).mint(_to, _tokenId, _amount, _data) {
                    emit DepositFinalized(_l1Contract, _l2Contract, _from, _to, _tokenId, _amount, _data);
                } catch {
                    replyNeeded = true;
                }
            } else {
                replyNeeded = true;
            }

            if (replyNeeded) {
                // Either the L2 token which is being deposited-into disagrees about the correct address
                // of its L1 token, or does not support the correct interface, or maybe the l2 mint reverted
                // This should only happen if there is a  malicious L2 token, or if a user somehow
                // specified the wrong L2 token address to deposit into.
                // In either case, we stop the process here and construct a withdrawal
                // message so that users can get their funds out in some cases.
                // There is no way to prevent malicious token contracts altogether, but this does limit
                // user error and mitigate some forms of malicious contract behavior.
                bytes memory message = abi.encodeWithSelector(
                    iL1ERC1155Bridge.finalizeWithdrawal.selector,
                    _l1Contract,
                    _l2Contract,
                    _to,   // switched the _to and _from here to bounce back the deposit to the sender
                    _from,
                    _tokenId,
                    _amount,
                    _data
                );

                // Send message up to L1 bridge
                sendCrossDomainMessage(
                    l1Bridge,
                    exitL1Gas,
                    message
                );
                emit DepositFailed(_l1Contract, _l2Contract, _from, _to, _tokenId, _amount, _data);
            }
        } else {
            exits[_l2Contract][_tokenId] -= _amount;
            // When a deposit is finalized on L2, the L2 Bridge transfers the token to the depositer
            IERC1155(_l2Contract).safeTransferFrom(
                address(this),
                _to,
                _tokenId,
                _amount,
                _data
            );
            emit DepositFinalized(_l1Contract, _l2Contract, _from, _to, _tokenId, _amount, _data);
        }
    }

   // /**
    //  * @inheritdoc IL2ERC20Bridge
    //  */
    function finalizeDepositBatch(
        address _l1Contract,
        address _l2Contract,
        address _from,
        address _to,
        uint256[] memory _tokenIds,
        uint256[] memory _amounts,
        bytes memory _data
    )
        external
        virtual
        override
        onlyFromCrossDomainAccount(l1Bridge)
    {
        PairTokenInfo storage pairToken = pairTokenInfo[_l2Contract];

        if (pairToken.baseNetwork == Network.L1) {
            // replyNeeded helps store the status if a message needs to be sent back to the other layer
            bool replyNeeded = false;
            // Check the target token is compliant and
            // verify the deposited token on L1 matches the L2 deposited token representation here
            if (
                // check with interface of IL2StandardERC1155
                ERC165Checker.supportsInterface(_l2Contract, 0x945d1710) &&
                _l1Contract == IL2StandardERC1155(_l2Contract).l1Contract()
            ) {
                // When a deposit is finalized, we credit the account on L2 with the same amount of
                // tokens.
                try IL2StandardERC1155(_l2Contract).mintBatch(_to, _tokenIds, _amounts, _data) {
                    emit DepositBatchFinalized(_l1Contract, _l2Contract, _from, _to, _tokenIds, _amounts, _data);
                } catch {
                    replyNeeded = true;
                }
            } else {
                replyNeeded = true;
            }

            if (replyNeeded) {
                // Either the L2 token which is being deposited-into disagrees about the correct address
                // of its L1 token, or does not support the correct interface, or maybe the l2 mint reverted
                // This should only happen if there is a  malicious L2 token, or if a user somehow
                // specified the wrong L2 token address to deposit into.
                // In either case, we stop the process here and construct a withdrawal
                // message so that users can get their funds out in some cases.
                // There is no way to prevent malicious token contracts altogether, but this does limit
                // user error and mitigate some forms of malicious contract behavior.
                bytes memory message = abi.encodeWithSelector(
                    iL1ERC1155Bridge.finalizeWithdrawalBatch.selector,
                    _l1Contract,
                    _l2Contract,
                    _to,   // switched the _to and _from here to bounce back the deposit to the sender
                    _from,
                    _tokenIds,
                    _amounts,
                    _data
                );

                // Send message up to L1 bridge
                sendCrossDomainMessage(
                    l1Bridge,
                    exitL1Gas,
                    message
                );
                emit DepositBatchFailed(_l1Contract, _l2Contract, _from, _to, _tokenIds, _amounts, _data);
            }
        } else {
            // remove the amount from the exits
            for (uint256 i = 0; i < _tokenIds.length; i++) {
                exits[_l2Contract][_tokenIds[i]] -= _amounts[i];
            }
            // When a deposit is finalized on L2, the L2 Bridge transfers the token to the depositer
            IERC1155(_l2Contract).safeBatchTransferFrom(
                address(this),
                _to,
                _tokenIds,
                _amounts,
                _data
            );
            emit DepositBatchFinalized(_l1Contract, _l2Contract, _from, _to, _tokenIds, _amounts, _data);
        }
    }

    /******************
     *      Pause     *
     ******************/

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
}
