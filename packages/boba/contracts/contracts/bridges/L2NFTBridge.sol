// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;
pragma experimental ABIEncoderV2;

/* Interface Imports */
import { iL1NFTBridge } from "./interfaces/iL1NFTBridge.sol";
import { iL2NFTBridge } from "./interfaces/iL2NFTBridge.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/* Library Imports */
import { ERC165Checker } from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import { CrossDomainEnabled } from "@eth-optimism/contracts/contracts/libraries/bridge/CrossDomainEnabled.sol";
import { ERC721Holder } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@eth-optimism/contracts/contracts/libraries/constants/Lib_PredeployAddresses.sol";

/* Contract Imports */
import { IL2StandardERC721 } from "../standards/IL2StandardERC721.sol";

/* External Imports */
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@eth-optimism/contracts/contracts/L2/predeploys/OVM_GasPriceOracle.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 * @title L2NFTBridge
 * @dev The L2 NFT bridge is a contract which works together with the L1 Standard bridge to
 * enable ERC721 transitions between L1 and L2.
 * This contract acts as a minter for new tokens when it hears about deposits into the L1 Standard
 * bridge.
 * This contract also acts as a burner of the tokens intended for withdrawal, informing the L1
 * bridge to release L1 funds.
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
 // add is interface
contract L2NFTBridge is iL2NFTBridge, CrossDomainEnabled, ERC721Holder, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeMath for uint256;

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
        Network baseNetwork; // L1 or L2
    }

    // Maps L2 token to tokenId to L1 token contract deposited for the native L2 NFT
    mapping(address => mapping (uint256 => address)) public exits;
    // Maps L2 NFT address to NFTInfo
    mapping(address => PairNFTInfo) public pairNFTInfo;

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

    modifier onlyGasPriceOracleOwner() {
        require(msg.sender == OVM_GasPriceOracle(Lib_PredeployAddresses.OVM_GAS_PRICE_ORACLE).owner(), 'Caller is not the gasPriceOracle owner');
        _;
    }

    modifier onlyInitialized() {
        require(address(messenger) != address(0), "Contract has not yet been initialized");
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
     * @param _extraGasRelay The extra gas for exiting L2
     */
    function configureExtraGasRelay(
        uint256 _extraGasRelay
    )
        public
        onlyGasPriceOracleOwner()
        onlyInitialized()
    {
        extraGasRelay = _extraGasRelay;
    }

    /***
     * @dev Add the new NFT pair to the pool
     * DO NOT add the same NFT token more than once.
     *
     * @param _l1Contract L1 NFT contract address
     * @param _l2Contract L2 NFT contract address
     * @param _baseNetwork Network where the NFT contract was created
     *
     */
    function registerNFTPair(
        address _l1Contract,
        address _l2Contract,
        string memory _baseNetwork
    )
        public
        onlyOwner()
    {
        //create2 would prevent this check
        //require(_l1Contract != _l2Contract, "Contracts should not be the same");
        bytes4 erc721 = 0x80ac58cd;
        require(ERC165Checker.supportsInterface(_l2Contract, erc721), "L2 NFT is not ERC721 compatible");
        bytes32 bn = keccak256(abi.encodePacked(_baseNetwork));
        bytes32 l1 = keccak256(abi.encodePacked("L1"));
        bytes32 l2 = keccak256(abi.encodePacked("L2"));
        // l1 NFT address equal to zero, then pair is not registered yet.
        // use with caution, can register only once
        PairNFTInfo storage pairNFT = pairNFTInfo[_l2Contract];
        require(pairNFT.l1Contract == address(0), "L1 NFT address already registered");
        // _baseNetwork can only be L1 or L2
        require(bn == l1 || bn == l2, "Invalid Network");
        Network baseNetwork;
        if (bn == l1) {
            require(ERC165Checker.supportsInterface(_l2Contract, 0x646dd6ec), "L2 contract is not bridgable");
            baseNetwork = Network.L1;
        }
        else {
            baseNetwork = Network.L2;
        }

        pairNFTInfo[_l2Contract] =
            PairNFTInfo({
                l1Contract: _l1Contract,
                l2Contract: _l2Contract,
                baseNetwork: baseNetwork
            });
    }

    /***************
     * Withdrawing *
     ***************/

    /**
     * @inheritdoc iL2NFTBridge
     */
    function withdraw(
        address _l2Contract,
        uint256 _tokenId,
        uint32 _l1Gas,
        bytes calldata _data
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
            _data
        );
    }

    /**
     * @inheritdoc iL2NFTBridge
     */
    function withdrawTo(
        address _l2Contract,
        address _to,
        uint256 _tokenId,
        uint32 _l1Gas,
        bytes calldata _data
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
            _data
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
     * @param _data Optional data to forward to L1. This data is provided
     *        solely as a convenience for external contracts. Aside from enforcing a maximum
     *        length, these contracts provide no guarantees about its content.
     */
    function _initiateWithdrawal(
        address _l2Contract,
        address _from,
        address _to,
        uint256 _tokenId,
        uint32 _l1Gas,
        bytes calldata _data
    )
        internal
    {
        uint256 startingGas = gasleft();
        require(startingGas > extraGasRelay, "Insufficient Gas For a Relay Transaction");

        uint256 desiredGasLeft = startingGas.sub(extraGasRelay);
        uint256 i;
        while (gasleft() > desiredGasLeft) {
            i++;
        }

        PairNFTInfo storage pairNFT = pairNFTInfo[_l2Contract];
        require(pairNFT.l1Contract != address(0), "Can't Find L1 NFT Contract");

        if (pairNFT.baseNetwork == Network.L1) {
            address l1Contract = IL2StandardERC721(_l2Contract).l1Contract();
            require(pairNFT.l1Contract == l1Contract, "L1 NFT Contract Address Error");

            // When a withdrawal is initiated, we burn the withdrawer's funds to prevent subsequent L2
            // usage
            address NFTOwner = IL2StandardERC721(_l2Contract).ownerOf(_tokenId);
            require(
                msg.sender == NFTOwner || IL2StandardERC721(_l2Contract).getApproved(_tokenId) == msg.sender ||
                IL2StandardERC721(_l2Contract).isApprovedForAll(NFTOwner, msg.sender)
            );

            IL2StandardERC721(_l2Contract).burn(_tokenId);

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
        } else {
            //  This check could be bypassed by a malicious contract via initcode,
            // but it takes care of the user error we want to avoid.
            require(!Address.isContract(msg.sender), "Account not EOA");
            // When a native NFT is withdrawn on L2, the L1 Bridge mints the funds to itself for future
            // withdrawals. safeTransferFrom also checks if the contract has code, so this will fail if
            // _from is an EOA or address(0).
            IERC721(_l2Contract).safeTransferFrom(
                _from,
                address(this),
                _tokenId
            );

            // Construct calldata for _l2Contract.finalizeDeposit(_to, _amount)
            bytes memory message = abi.encodeWithSelector(
                iL1NFTBridge.finalizeNFTWithdrawal.selector,
                pairNFT.l1Contract,
                _l2Contract,
                _from,
                _to,
                _tokenId,
                _data
            );

            // Send calldata into L2
            sendCrossDomainMessage(
                l1NFTBridge,
                _l1Gas,
                message
            );

            exits[_l2Contract][_tokenId] = pairNFT.l1Contract;
        }
        emit WithdrawalInitiated(pairNFT.l1Contract, _l2Contract, msg.sender, _to, _tokenId, _data);
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
        bytes calldata _data
    )
        external
        virtual
        override
        onlyFromCrossDomainAccount(l1NFTBridge)
    {
        PairNFTInfo storage pairNFT = pairNFTInfo[_l2Contract];

        if (pairNFT.baseNetwork == Network.L1) {
            // Check the target token is compliant and
            // verify the deposited token on L1 matches the L2 deposited token representation here
            if (
                // check with interface of IL2StandardERC721
                ERC165Checker.supportsInterface(_l2Contract, 0x646dd6ec) &&
                _l1Contract == IL2StandardERC721(_l2Contract).l1Contract()
            ) {
                // When a deposit is finalized, we credit the account on L2 with the same amount of
                // tokens.
                IL2StandardERC721(_l2Contract).mint(_to, _tokenId);
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
        } else {
            // needs to verify comes from correct l1Contract
            require(exits[_l2Contract][_tokenId] == _l1Contract, "Incorrect Deposit");
            // When a deposit is finalized on L2, the L2 Bridge transfers the NFT to the depositer
            IERC721(_l2Contract).safeTransferFrom(
                address(this),
                _to,
                _tokenId
            );
            emit DepositFinalized(_l1Contract, _l2Contract, _from, _to, _tokenId, _data);
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
