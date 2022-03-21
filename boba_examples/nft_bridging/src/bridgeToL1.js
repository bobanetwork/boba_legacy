const { utils, ethers } = require('ethers')

const bridgeToL1 = async (L2ERC721, L2NFTBridge, tokenId) => {
  // check if NFT is base L2
  // check if L1StandardERC721 contract exists for the pair
  const L1NFT = await L2NFTBridge.pairNFTInfo(L2ERC721.address)
  if (
    L1NFT.l1Contract !== ethers.constants.AddressZero &&
    L1NFT.baseNetwork === 1
  ) {
    const approveTx = await L2ERC721.approve(L2NFTBridge.address, tokenId)
    await approveTx.wait()
    console.log('Approved Bridge')

    console.log('Sending tx to withdraw NFT to L1..')
    const withdrawTx = await L2NFTBridge.withdraw(
      L2ERC721.address, // L2 NFT Contract
      tokenId, // tokenId
      9999999, // sample l1 gas for the xDomain tx
      utils.formatBytes32String('') // data
    )

    await withdrawTx.wait()
    return withdrawTx.hash
  } else {
    return []
  }
}

module.exports = { bridgeToL1 }
