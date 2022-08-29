// SPDX-License-Identifier: MIT
// @unsupported: ovm
pragma solidity >0.7.5;
pragma experimental ABIEncoderV2;

/* Interface Imports */
import { iL1NFTBridge } from "./interfaces/iL1NFTBridge.sol";
import { iL2NFTBridge } from "./interfaces/iL2NFTBridge.sol";

/* Library Imports */
import { CrossDomainEnabled } from "@eth-optimism/contracts/contracts/libraries/bridge/CrossDomainEnabled.sol";
import { Lib_PredeployAddresses } from "@eth-optimism/contracts/contracts/libraries/constants/Lib_PredeployAddresses.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

/* External Imports */
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/* NFT Imports */
import { CustomERC721 } from "./CustomERC721.sol";

contract L1NFTBridge is iL1NFTBridge, CrossDomainEnabled, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeMath for uint;

    /********************************
     * External Contract References *
     ********************************/

    address public owner;
    address public l2NFTBridge;
    // Default gas value which can be overridden if more complex logic runs on L2.
    uint32 public depositL2Gas;

    enum Network { L1, L2 }

    // Info of each NFT
    struct PairNFTInfo {
        address l1Contract;
        address l2Contract;
    }

    // Maps L1 NFT address to NFTInfo
    mapping(address => PairNFTInfo) public pairNFTInfo;

    /***************
     * Constructor *
     ***************/

    // This contract lives behind a proxy, so the constructor parameters will go unused.
    constructor()
        CrossDomainEnabled(address(0))
    {}

    /**********************
     * Function Modifiers *
     **********************/

    modifier onlyOwner() {
        require(msg.sender == owner, 'Caller is not the owner');
        _;
    }

    modifier onlyInitialized() {
        require(address(messenger) != address(0), "Contract has not yet been initialized");
        _;
    }

    /******************
     * Initialization *
     ******************/

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
        onlyInitialized()
    {
        owner = _newOwner;
    }

    /**
     * @dev Configure gas.
     *
     * @param _depositL2Gas default finalized deposit L2 Gas
     */
    function configureGas(
        uint32 _depositL2Gas
    )
        public
        onlyOwner()
        onlyInitialized()
    {
        depositL2Gas = _depositL2Gas;
    }

    /**
     * @param _l1messenger L1 Messenger address being used for cross-chain communications.
     * @param _l2NFTBridge L2 NFT bridge address.
     */
    function initialize(
        address _l1messenger,
        address _l2NFTBridge
    )
        public
        initializer()
    {
        require(_l1messenger != address(0) && _l2NFTBridge != address(0), "zero address not allowed");
        messenger = _l1messenger;
        l2NFTBridge = _l2NFTBridge;
        owner = msg.sender;
        configureGas(1400000);

        __Context_init_unchained();
        __Pausable_init_unchained();
        __ReentrancyGuard_init_unchained();
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
        address _l2Contract,
    )
        public
        onlyOwner()
    {
        //create2 would prevent this check
        //require(_l1Contract != _l2Contract, "Contracts should not be the same");
        bytes4 erc721 = 0x80ac58cd;
        require(ERC165Checker.supportsInterface(_l1Contract, erc721), "L1 NFT is not ERC721 compatible");
        bytes32 l1 = keccak256(abi.encodePacked("L1"));
        bytes32 l2 = keccak256(abi.encodePacked("L2"));
        // l2 NFT address equal to zero, then pair is not registered yet.
        // use with caution, can register only once
        PairNFTInfo storage pairNFT = pairNFTInfo[_l1Contract];
        require(pairNFT.l2Contract == address(0), "L2 NFT address already registered");
        require(bn == l1 || bn == l2, "Invalid Network");

        pairNFTInfo[_l1Contract] =
            PairNFTInfo({
                l1Contract: _l1Contract,
                l2Contract: _l2Contract
            });
    }

    /**************
     * Depositing *
     **************/

    /**
     * @inheritdoc iL1NFTBridge
     */
    function depositNFT(
        address _l1Contract,
        uint256 _tokenId,
        uint32 _l2Gas
    )
        external
        virtual
        override
        nonReentrant()
        whenNotPaused()
    {
        _initiateNFTDeposit(_l1Contract, msg.sender, msg.sender, _tokenId, _l2Gas, "");
    }


     /**
     * @inheritdoc iL1NFTBridge
     */
    function depositNFTTo(
        address _l1Contract,
        address _to,
        uint256 _tokenId,
        uint32 _l2Gas
    )
        external
        virtual
        override
        nonReentrant()
        whenNotPaused()
    {
        _initiateNFTDeposit(_l1Contract, msg.sender, _to, _tokenId, _l2Gas, "");
    }

    /**
     * @dev Performs the logic for deposits by informing the L2 Deposited Token
     * contract of the deposit and calling a handler to lock the L1 token. (e.g. transferFrom)
     *
     * @param _l1Contract Address of the L1 NFT contract we are depositing
     * @param _from Account to pull the deposit from on L1
     * @param _to Account to give the deposit to on L2
     * @param _tokenId NFT token Id to deposit.
     * @param _l2Gas Gas limit required to complete the deposit on L2.
     * @param _data Data/metadata to forward to L2. This data is either extraBridgeData,
     * or encoded tokenURI, in this order of priority if user choses to send, is empty otherwise
     */
    function _initiateNFTDeposit(
        address _l1Contract,
        address _from,
        address _to,
        uint256 _tokenId,
        uint32 _l2Gas,
        bytes memory _data
    )
        internal
    {
        PairNFTInfo storage pairNFT = pairNFTInfo[_l1Contract];
        require(pairNFT.l2Contract != address(0), "Can't Find L2 NFT Contract");
        //  This check could be bypassed by a malicious contract via initcode,
        // but it takes care of the user error we want to avoid.
        require(!Address.isContract(msg.sender), "Account not EOA");
        // When a deposit is initiated on L1, the L1 Bridge transfers the funds to itself for future
        // withdrawals. safeTransferFrom also checks if the contract has code, so this will fail if
        // _from is an EOA or address(0).
        IERC721(_l1Contract).safeTransferFrom(
            _from,
            address(this),
            _tokenId
        );

        // Get speical features
        CustomERC721 l1NFTContract = CustomERC721(_l1Contract)
        feature_1 = l1NFTContract.feature_1(_tokenId)
        feature_2 = l1NFTContract.feature_2(_tokenId)
        feature_3 = l1NFTContract.feature_3(_tokenId)

        // Construct calldata for _l2Contract.finalizeDeposit(_to, _amount)
        bytes memory message = abi.encodeWithSelector(
            iL2NFTBridge.finalizeDeposit.selector,
            _l1Contract,
            pairNFT.l2Contract,
            _from,
            _to,
            _tokenId,
            feature_1,
            feature_2,
            feature_3,
            _data
        );

        // Send calldata into L2
        sendCrossDomainMessage(
            l2NFTBridge,
            _l2Gas,
            message
        );

        emit NFTDepositInitiated(_l1Contract, pairNFT.l2Contract, _from, _to, _tokenId, feature_1, feature_2, feature_3, _data);
    }

    /**
     * @inheritdoc iL1NFTBridge
     */
    function finalizeNFTWithdrawal(
        address _l1Contract,
        address _l2Contract,
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    )
        external
        override
        onlyFromCrossDomainAccount(l2NFTBridge)
    {
        PairNFTInfo storage pairNFT = pairNFTInfo[_l1Contract];

        // When a withdrawal is finalized on L1, the L1 Bridge transfers the funds to the withdrawer
        IERC721(_l1Contract).safeTransferFrom(address(this), _to, _tokenId);

        emit NFTWithdrawalFinalized(_l1Contract, _l2Contract, _from, _to, _tokenId, _data);
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
