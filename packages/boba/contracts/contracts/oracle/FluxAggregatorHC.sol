/**
Credit - This is Chainlink's FluxAggreagtor with some changes
original contract - https://github.com/smartcontractkit/chainlink/blob/master/contracts/src/v0.6/FluxAggregator.sol
*/
// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import "@chainlink/contracts/src/v0.6/SafeMath128.sol";
import "@chainlink/contracts/src/v0.6/SafeMath32.sol";
import "@chainlink/contracts/src/v0.6/SafeMath64.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV2V3Interface.sol";
import "@chainlink/contracts/src/v0.6/vendor/SafeMathChainlink.sol";

import "./SafeMath80.sol";
import "./interfaces/IHybirdComputeHelper.sol";

/**
 * @title The HC Aggregator contract
 */
contract FluxAggregatorHC is AggregatorV2V3Interface {
  using SafeMathChainlink for uint256;
  using SafeMath128 for uint128;
  using SafeMath80 for uint80;
  using SafeMath64 for uint64;
  using SafeMath32 for uint32;

  struct Round {
    int256 answer;
    uint64 startedAt;
    uint64 updatedAt;
    uint80 answeredInRound;
  }

  address public owner;

  uint8 public override decimals;
  string public override description;
  int256 public minSubmissionValue;
  int256 public maxSubmissionValue;

  uint256 constant public override version = 1;

  // An error specific to the Aggregator V3 Interface, to prevent possible
  // confusion around accidentally reading unset values as reported values.
  string constant private V3_NO_DATA_ERROR = "No data present";

  uint80 internal latestRoundId;
  uint80 public staringRoundId;
  uint256 public chainLinkLatestRoundId;

  address private oracleAddress;
  address private oracleAdmin;

  address public HCHelperAddr;
  IHybirdComputeHelper HCHelper;
  string public HCUrl;
  address public HCChainLinkPriceFeedAddr;

  mapping(uint80 => Round) internal rounds;

  event OracleAdminUpdated(
    address indexed prevAdmin,
    address indexed newAdmin
  );
  event OracleSet(
    address indexed oracle,
    address admin,
    uint80 startingRound
  );
  event ChainLinkQuoteGot(
    string indexed HCUrl,
    uint256 indexed CLRoundId,
    int256 CLSubmission,
    uint256 CLLatestRoundId
  );
  event HCDebug(
    bytes response
  );
  event HCUrlUpdated(
    string prevHCUrl,
    string newHCUrl
  );
  event HCHelperUpdated(
    address prevHCHelperAddr,
    address newHCHelperAddr
  );
  event HCChainLinkPriceFeedAddrUpdated(
    address prevHCChainLinkPriceFeedAddr,
    address newHCChainLinkPriceFeedAddr
  );
  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );


  modifier onlyOwner() {
    require(msg.sender == owner, 'Caller is not the owner');
    _;
  }

  modifier onlyOracleAdmin {
    require(msg.sender == oracleAdmin, 'Caller is not the oracle owner');
    _;
  }

  modifier onlyNotInitialized() {
    require(address(owner) == address(0), "Contract has been initialized");
    _;
  }

  modifier onlyInitialized() {
    require(address(owner) != address(0), "Contract has not yet been initialized");
    _;
  }

  /**
   * @notice set up the aggregator with initial configuration
   * @param _minSubmissionValue is an immutable check for a lower bound of what
   * submission values are accepted from an oracle
   * @param _maxSubmissionValue is an immutable check for an upper bound of what
   * submission values are accepted from an oracle
   * @param _decimals represents the number of decimals to offset the answer by
   * @param _description a short description of what is being reported
   * @param _HCHelperAddr address of hybird compute helper
   * @param _HCUrl url of hybird compute endpoint
   * @param _HCChainLinkPriceFeedAddr address of chainlink price feed
   */
  function initialize(
    int256 _minSubmissionValue,
    int256 _maxSubmissionValue,
    uint8 _decimals,
    string calldata _description,
    address _HCHelperAddr,
    string calldata _HCUrl,
    address _HCChainLinkPriceFeedAddr
  )
    external
    onlyNotInitialized
  {
    minSubmissionValue = _minSubmissionValue;
    maxSubmissionValue = _maxSubmissionValue;
    decimals = _decimals;
    description = _description;
    HCHelperAddr = _HCHelperAddr;
    HCHelper = IHybirdComputeHelper(_HCHelperAddr);
    HCUrl = _HCUrl;
    HCChainLinkPriceFeedAddr = _HCChainLinkPriceFeedAddr;
    owner = msg.sender;
  }

  /**
   * @notice called by oracle when they have witnessed a need to update
   * @param _roundId is the ID of the round this submission pertains to
   */
  function submit(uint256 _roundId)
    external
    onlyOracleAdmin
  {
    require(_roundId == latestRoundId.add(1), "invalid roundId to initialize");

    (uint256 _CLRoundId, int256 _CLSubmission, uint256 _CLLatestRoundId) = getChainLinkQuote(_roundId);

    require(_CLRoundId == _roundId, "ChainLink roundId not match");
    require(_CLLatestRoundId >= _roundId && _CLLatestRoundId >= chainLinkLatestRoundId, "ChainLink latestRoundId is invalid");
    require(_CLSubmission >= minSubmissionValue, "value below minSubmissionValue");
    require(_CLSubmission <= maxSubmissionValue, "value above maxSubmissionValue");

    updateRoundAnswer(uint80(_roundId), _CLSubmission);
    chainLinkLatestRoundId = _CLLatestRoundId;
  }

  /**
   * @notice called by owner when they have witnessed a need to update
   * @param _roundId is the ID of the round this submission pertains to
   * @param _submission is the updated data that the oracle is submitting
   * @param _CLLatestRoundId is the chainlink latest round id
   */
  function emergencySubmit(uint256 _roundId, int256 _submission, uint256 _CLLatestRoundId)
    external
    onlyOracleAdmin
  {
    require(_roundId == latestRoundId.add(1), "invalid roundId to initialize");
    require(_CLLatestRoundId >= _roundId && _CLLatestRoundId >= chainLinkLatestRoundId, "ChainLink latestRoundId is invalid");
    require(_submission >= minSubmissionValue, "value below minSubmissionValue");
    require(_submission <= maxSubmissionValue, "value above maxSubmissionValue");

    updateRoundAnswer(uint80(_roundId), _submission);
    chainLinkLatestRoundId = _CLLatestRoundId;
  }

  /**
   * @notice called by the owner to set a new oracle as well as
   * Set the admin address for the new oracle
   * @param _added is the address of the new Oracle being added
   * @param _addedAdmin is the admin address for the new respective _added
   * @param _roundId that we use to override the starting round id
   * list.
   */
  function setOracle(
    address _added,
    address _addedAdmin,
    uint80 _roundId
  )
    external
    onlyOwner
  {
    require(oracleAddress == address(0), "oracleAddress already set");
    require(_added != address(0), "oracleAddress cannot be zero address");
    oracleAddress = _added;
    oracleAdmin = _addedAdmin;
    staringRoundId = _roundId;
    latestRoundId = _roundId;

    emit OracleSet(_added, _addedAdmin, _roundId);
  }


  /**
   * @notice returns the oracle address
   */
  function getOracles() external view returns (address[] memory) {
    address[] memory oracleAddresses;
    oracleAddresses[0] = oracleAddress;
    return oracleAddresses;
  }

  /**
   * @notice get the most recently reported answer
   *
   * @dev #[deprecated] Use latestRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended latestRoundData
   * instead which includes better verification information.
   */
  function latestAnswer()
    public
    view
    virtual
    override
    returns (int256)
  {
    return rounds[latestRoundId].answer;
  }

  /**
   * @notice get the most recent updated at timestamp
   *
   * @dev #[deprecated] Use latestRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended latestRoundData
   * instead which includes better verification information.
   */
  function latestTimestamp()
    public
    view
    virtual
    override
    returns (uint256)
  {
    return rounds[latestRoundId].updatedAt;
  }

  /**
   * @notice get the ID of the last updated round
   *
   * @dev #[deprecated] Use latestRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended latestRoundData
   * instead which includes better verification information.
   */
  function latestRound()
    public
    view
    virtual
    override
    returns (uint256)
  {
    return latestRoundId;
  }

  /**
   * @notice get past rounds answers
   * @param _roundId the round number to retrieve the answer for
   *
   * @dev #[deprecated] Use getRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended getRoundData
   * instead which includes better verification information.
   */
  function getAnswer(uint256 _roundId)
    public
    view
    virtual
    override
    returns (int256)
  {
    return rounds[uint80(_roundId)].answer;
  }

  /**
   * @notice get timestamp when an answer was last updated
   * @param _roundId the round number to retrieve the updated timestamp for
   *
   * @dev #[deprecated] Use getRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended getRoundData
   * instead which includes better verification information.
   */
  function getTimestamp(uint256 _roundId)
    public
    view
    virtual
    override
    returns (uint256)
  {
    return rounds[uint80(_roundId)].updatedAt;
  }

  /**
   * @notice get data about a round. Consumers are encouraged to check
   * that they're receiving fresh data by inspecting the updatedAt and
   * answeredInRound return values.
   * @param _roundId the round ID to retrieve the round data for
   * @return roundId is the round ID for which data was retrieved
   * @return answer is the answer for the given round
   * @return startedAt is the timestamp when the round was started. This is 0
   * if the round hasn't been started yet.
   * @return updatedAt is the timestamp when the round last was updated (i.e.
   * answer was last computed)
   * @return answeredInRound is the round ID of the round in which the answer
   * was computed. answeredInRound may be smaller than roundId when the round
   * timed out. answeredInRound is equal to roundId when the round didn't time out
   * and was completed regularly.
   * @dev Note that for in-progress rounds (i.e. rounds that haven't yet received
   * maxSubmissions) answer and updatedAt may change between queries.
   */
  function getRoundData(uint80 _roundId)
    public
    view
    virtual
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    Round memory r = rounds[uint80(_roundId)];

    require(r.answeredInRound > 0, V3_NO_DATA_ERROR);

    return (
      _roundId,
      r.answer,
      r.startedAt,
      r.updatedAt,
      r.answeredInRound
    );
  }

  /**
   * @notice get data about the latest round. Consumers are encouraged to check
   * that they're receiving fresh data by inspecting the updatedAt and
   * answeredInRound return values. Consumers are encouraged to
   * use this more fully featured method over the "legacy" latestRound/
   * latestAnswer/latestTimestamp functions. Consumers are encouraged to check
   * that they're receiving fresh data by inspecting the updatedAt and
   * answeredInRound return values.
   * @return roundId is the round ID for which data was retrieved
   * @return answer is the answer for the given round
   * @return startedAt is the timestamp when the round was started. This is 0
   * if the round hasn't been started yet.
   * @return updatedAt is the timestamp when the round last was updated (i.e.
   * answer was last computed)
   * @return answeredInRound is the round ID of the round in which the answer
   * was computed. answeredInRound may be smaller than roundId when the round
   * timed out. answeredInRound is equal to roundId when the round didn't time
   * out and was completed regularly.
   * @dev Note that for in-progress rounds (i.e. rounds that haven't yet
   * received maxSubmissions) answer and updatedAt may change between queries.
   */
   function latestRoundData()
    public
    view
    virtual
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    return getRoundData(latestRoundId);
  }

  /**
   * @notice get the admin address of the oracle
   */
  function getAdmin()
    external
    view
    returns (address)
  {
    return oracleAdmin;
  }

  /**
   * @notice accept the admin address transfer for an oracle
   * @param _oracleAdmin is the address of the oracle whose admin is being transferred
   */
  function transferOracleAdmin(address _oracleAdmin)
    external
    onlyOracleAdmin
  {
    require(_oracleAdmin != address(0), "Cannot transfer oracle admin to 0x address");
    address prevOracleAdmin = oracleAdmin;
    oracleAdmin = _oracleAdmin;

    emit OracleAdminUpdated(prevOracleAdmin, _oracleAdmin);
  }

  /**
   * @notice method to update url
   */
  function updateHCUrl(string memory _HCUrl)
    public
    onlyOwner
  {
    string memory prevHCUrl = HCUrl;
    HCUrl = _HCUrl;
    emit HCUrlUpdated(prevHCUrl, HCUrl);
  }

  /**
   * @notice method to update HCHelper contract
   */
  function updateHCHelper(address _HCHelperAddr)
    public
    onlyOwner
  {
    require(_HCHelperAddr != address(0), "Cannot set HCHelper to 0x address");
    address prevHCHelperAddr = HCHelperAddr;
    HCHelperAddr = _HCHelperAddr;
    HCHelper = IHybirdComputeHelper(_HCHelperAddr);
    emit HCHelperUpdated(prevHCHelperAddr, HCHelperAddr);
  }

  /**
   * @notice method to update ChainLink's contract address
   */
  function updateHCChainLinkPriceFeedAddr(address _HCChainLinkPriceFeedAddr)
    public
    onlyOwner
  {
    require(_HCChainLinkPriceFeedAddr != address(0), "Cannot set HCChainLinkPriceFeed to 0x address");
    address prevHCChainLinkPriceFeedAddr = HCChainLinkPriceFeedAddr;
    HCChainLinkPriceFeedAddr = _HCChainLinkPriceFeedAddr;
    emit HCChainLinkPriceFeedAddrUpdated(prevHCChainLinkPriceFeedAddr, HCChainLinkPriceFeedAddr);
  }

  /**
   * @notice method to get ChainLink's quote via HC
   */
  function getChainLinkQuote(uint256 _roundId)
    public
    onlyOwner
    returns (uint256 , int256, uint256)
  {
    bytes memory encRequest = abi.encode(HCChainLinkPriceFeedAddr, _roundId);
    bytes memory encResponse = HCHelper.TuringTx(HCUrl, encRequest);

    emit HCDebug(encResponse);

    (uint256 _CLRoundId, int256 _CLSubmission, uint256 _CLLatestRoundId) = abi.decode(encResponse,(uint256,int256,uint256));

    emit ChainLinkQuoteGot(HCUrl, _CLRoundId, _CLSubmission, _CLLatestRoundId);

    return (_CLRoundId, _CLSubmission, _CLLatestRoundId);
  }

  /**
   * @notice transfer ownership
   *
   * @param _newOwner new admin owner of this contract
   */
  function transferOwnership(
    address _newOwner
  )
    external
    onlyOwner
  {
    require(_newOwner != address(0), 'New owner cannot be the zero address');
    address prevOwner = owner;
    owner = _newOwner;
    emit OwnershipTransferred(prevOwner, _newOwner);
 }

  /**
   * Private
   */
  function updateRoundAnswer(uint80 _roundId, int256 _submission)
    private
  {
    rounds[_roundId].startedAt = uint64(block.timestamp);
    rounds[_roundId].answer = _submission;
    rounds[_roundId].updatedAt = uint64(block.timestamp);
    rounds[_roundId].answeredInRound = _roundId;
    latestRoundId = _roundId;

    emit AnswerUpdated(_submission, _roundId, now);
  }
}
