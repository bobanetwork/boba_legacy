const { utils, ethers } = require('ethers')

const bridgeBackToL2 = async (L1StandardERC721, L1NFTBridge, tokenId) => {
  // check if NFT is base L2
  // check if L1StandardERC721 is registered for the pair
  const L1NFT = await L1NFTBridge.pairNFTInfo(L1StandardERC721.address)
  if (
    L1NFT.l1Contract !== ethers.constants.AddressZero &&
    L1NFT.baseNetwork === 1
  ) {
    console.log('Sending tx to deposit NFT back to L2..')
    const depositTx = await L1NFTBridge.depositNFT(
      L1StandardERC721.address, // L1NFT address
      tokenId, // tokenId
      9999999 // sample l1 gas for the xDomain tx
    )
    await depositTx.wait()
    return depositTx.hash
  } else {
    return []
  }
}

module.exports = { bridgeBackToL2 }
