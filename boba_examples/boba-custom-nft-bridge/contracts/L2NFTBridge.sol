// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;
pragma experimental ABIEncoderV2;

/* Interface Imports */
import { iL1NFTBridge } from "./interfaces/iL1NFTBridge.sol";
import { iL2NFTBridge } from "./interfaces/iL2NFTBridge.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC721Metadata } from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

/* Library Imports */
import { CrossDomainEnabled } from "@eth-optimism/contracts/libraries/bridge/CrossDomainEnabled.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { ERC721Holder } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import { ERC165Checker } from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@eth-optimism/contracts/libraries/constants/Lib_PredeployAddresses.sol";

/* Contract Imports */
import { L2CustomERC721 } from "./L2CustomERC721.sol";

/* External Imports */
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@eth-optimism/contracts/L2/predeploys/OVM_GasPriceOracle.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { L2BillingContract } from "./L2BillingContract.sol";

/* External Imports */

 // add is interface
contract L2NFTBridge is iL2NFTBridge, CrossDomainEnabled, ERC721Holder, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /********************************
     * External Contract References *
     ********************************/

    address public owner;
    address public l1NFTBridge;
    uint256 public extraGasRelay;
    uint32 public exitL1Gas;

    enum Network { L1, L2 }

    // Info of each NFT
    struct PairNFTInfo {
        address l1Contract;
        address l2Contract;
    }

    // Maps L2 NFT address to NFTInfo
    mapping(address => PairNFTInfo) public pairNFTInfo;

    // billing contract address
    address public billingContractAddress;
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
        owner = _newOwner;
    }

    /**
     * @param _l2CrossDomainMessenger Cross-domain messenger used by this contract.
     * @param _l1NFTBridge Address of the L1 bridge deployed to the main chain.
     */
    function initialize(
        address _l2CrossDomainMessenger,
        address _l1NFTBridge
    )
        public
        onlyOwner()
        initializer()
    {
        require(messenger == address(0), "Contract has already been initialized.");
        require(_l2CrossDomainMessenger != address(0) && _l1NFTBridge != address(0), "zero address not allowed");
        messenger = _l2CrossDomainMessenger;
        l1NFTBridge = _l1NFTBridge;
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

    /***
     * @dev Add the new NFT pair to the pool
     * DO NOT add the same NFT token more than once.
     *
     * @param _l1Contract L1 NFT contract address
     * @param _l2Contract L2 NFT contract address
     *
     */
    function registerNFTPair(
        address _l1Contract,
        address _l2Contract
    )
        public
        onlyOwner()
    {
        //create2 would prevent this check
        //require(_l1Contract != _l2Contract, "Contracts should not be the same");
        bytes4 erc721 = 0x80ac58cd;
        require(ERC165Checker.supportsInterface(_l2Contract, erc721), "L2 NFT is not ERC721 compatible");
        // l1 NFT address equal to zero, then pair is not registered yet.
        // use with caution, can register only once
        PairNFTInfo storage pairNFT = pairNFTInfo[_l2Contract];
        require(pairNFT.l1Contract == address(0), "L1 NFT address already registered");
        require(ERC165Checker.supportsInterface(_l2Contract, 0xb07cd11a), "L2 contract is not bridgable");

        pairNFTInfo[_l2Contract] =
            PairNFTInfo({
                l1Contract: _l1Contract,
                l2Contract: _l2Contract
            });
    }


    /**
     * @inheritdoc iL2NFTBridge
     */
    function withdraw(
        address _l2Contract,
        uint256 _tokenId,
        uint32 _l1Gas
    )
        external
        virtual
        override
        nonReentrant()
        whenNotPaused()
    {
        _initiateWithdrawal(
            _l2Contract,
            msg.sender,
            msg.sender,
            _tokenId,
            _l1Gas,
            ""
        );
    }

    /**
     * @inheritdoc iL2NFTBridge
     */
    function withdrawTo(
        address _l2Contract,
        address _to,
        uint256 _tokenId,
        uint32 _l1Gas
    )
        external
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
            _l1Gas,
            ""
        );
    }

    /**
     * @dev Performs the logic for withdrawals by burning the token and informing the L1 ERC721 Gateway
     * of the withdrawal.
     * @param _l2Contract Address of L2 ERC721 where withdrawal was initiated.
     * @param _from Account to pull the deposit from on L2.
     * @param _to Account to give the withdrawal to on L1.
     * @param _tokenId Amount of the token to withdraw.
     * param _l1Gas Unused, but included for potential forward compatibility considerations.
     * @param _data Data/metadata to forward to L1. This data is either extraBridgeData,
     * or encoded tokenURI, in this order of priority if user choses to send, is empty otherwise
     */
    function _initiateWithdrawal(
        address _l2Contract,
        address _from,
        address _to,
        uint256 _tokenId,
        uint32 _l1Gas,
        bytes memory _data
    )
        internal
        onlyWithBillingContract()
    {
        // Collect the exit fee
        L2BillingContract billingContract = L2BillingContract(billingContractAddress);
        IERC20(billingContract.feeTokenAddress()).safeTransferFrom(msg.sender, billingContractAddress, billingContract.exitFee());

        PairNFTInfo storage pairNFT = pairNFTInfo[_l2Contract];
        require(pairNFT.l1Contract != address(0), "Can't Find L1 NFT Contract");

        address l1Contract = L2CustomERC721(_l2Contract).l1Contract();
        require(pairNFT.l1Contract == l1Contract, "L1 NFT Contract Address Error");

        // When a withdrawal is initiated, we burn the withdrawer's funds to prevent subsequent L2
        // usage
        address NFTOwner = L2CustomERC721(_l2Contract).ownerOf(_tokenId);
        require(
            msg.sender == NFTOwner || L2CustomERC721(_l2Contract).getApproved(_tokenId) == msg.sender ||
            L2CustomERC721(_l2Contract).isApprovedForAll(NFTOwner, msg.sender)
        );

        L2CustomERC721(_l2Contract).burn(_tokenId);

        // Construct calldata for l1NFTBridge.finalizeNFTWithdrawal(_to, _amount)
        bytes memory message;

        message = abi.encodeWithSelector(
                    iL1NFTBridge.finalizeNFTWithdrawal.selector,
                    l1Contract,
                    _l2Contract,
                    _from,
                    _to,
                    _tokenId,
                    _data
                );

        // Send message up to L1 bridge
        sendCrossDomainMessage(
            l1NFTBridge,
            _l1Gas,
            message
        );

        emit WithdrawalInitiated(pairNFT.l1Contract, _l2Contract, msg.sender, _to, _tokenId, _data);
    }

    /************************************
     * Cross-chain Function: Depositing *
     ************************************/

    /**
     * @inheritdoc iL2NFTBridge
     */
    function finalizeDeposit(
        address _l1Contract,
        address _l2Contract,
        address _from,
        address _to,
        uint256 _tokenId,
        string calldata _feature_1,
        string calldata _feature_2,
        string calldata _feature_3,
        bytes memory _data
    )
        external
        virtual
        override
        onlyFromCrossDomainAccount(l1NFTBridge)
    {
        // Check the target token is compliant and
        // verify the deposited token on L1 matches the L2 deposited token representation here
        if (
            // check with interface of L2CustomERC721
            ERC165Checker.supportsInterface(_l2Contract, 0xb07cd11a) &&
            _l1Contract == L2CustomERC721(_l2Contract).l1Contract()
        ) {
            // When a deposit is finalized, we credit the account on L2 with the same amount of
            // tokens.
            L2CustomERC721(_l2Contract).mint(_to, _tokenId, _feature_1, _feature_2, _feature_3, _data);
            emit DepositFinalized(_l1Contract, _l2Contract, _from, _to, _tokenId, _data);
        } else {
            // Either the L2 token which is being deposited-into disagrees about the correct address
            // of its L1 token, or does not support the correct interface.
            // This should only happen if there is a  malicious L2 token, or if a user somehow
            // specified the wrong L2 token address to deposit into.
            // In either case, we stop the process here and construct a withdrawal
            // message so that users can get their funds out in some cases.
            // There is no way to prevent malicious token contracts altogether, but this does limit
            // user error and mitigate some forms of malicious contract behavior.
            bytes memory message = abi.encodeWithSelector(
                iL1NFTBridge.finalizeNFTWithdrawal.selector,
                _l1Contract,
                _l2Contract,
                _to,   // switched the _to and _from here to bounce back the deposit to the sender
                _from,
                _tokenId,
                _data
            );

            // Send message up to L1 bridge
            sendCrossDomainMessage(
                l1NFTBridge,
                exitL1Gas,
                message
            );
            emit DepositFailed(_l1Contract, _l2Contract, _from, _to, _tokenId, _data);
        }
    }

}
