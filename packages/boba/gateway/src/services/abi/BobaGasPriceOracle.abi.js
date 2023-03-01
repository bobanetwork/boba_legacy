const BobaGasPriceOracleABI = [
  'function secondaryFeeTokenMinimum() public view returns (uint256)',
  'function priceRatio() public view returns (uint256)',
  'function bobaFeeTokenUsers(address) public view returns (bool user)',
  'function secondaryFeeTokenUsers(address) public view returns (bool user)',
  'function getBOBAForSwap() public view returns (uint256)',
  'function getSecondaryFeeTokenForSwap() public view returns (uint256)',
  'function useBobaAsFeeToken() public',
  'function useETHAsFeeToken() public',
  'function useSecondaryFeeTokenAsFeeToken() public',
]

export default BobaGasPriceOracleABI;
