const L1StandardBridgeABI = [
  'function depositETH(uint32 _l2Gas, bytes calldata _data) external payable',
  'function depositETHTo(address _to, uint32 _l2Gas, bytes calldata _data) external payable',
  'function depositERC20(address _l1Token,address _l2Token, uint256 _amount, uint32 _l2Gas,bytes calldata _data) external',
  'function depositERC20To(address _l1Token, address _l2Token, address _to, uint256 _amount, uint32 _l2Gas,bytes calldata _data) external',
  'function depositNativeToken(uint32 _l2Gas, bytes calldata _data) external payable',
  'function depositNativeTokenTo(address _to,uint32 _l2Gas,bytes calldata _data) external payable'
]

export default L1StandardBridgeABI;
