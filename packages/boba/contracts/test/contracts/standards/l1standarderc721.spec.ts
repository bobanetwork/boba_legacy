import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { expect } from '../../setup'

const deployL1StandardERC721 = async (
  l1Bridge,
  l2ERC721,
  name,
  symbol,
  baseUri
): Promise<Contract> => {
  return (await ethers.getContractFactory('L1StandardERC721')).deploy(
    l1Bridge,
    l2ERC721,
    name,
    symbol,
    baseUri
  )
}

describe('L1 Standard ERC721 Tests', () => {
  it('should deploy and check supportsInterface', async () => {
    const l1Bridge: Signer = (await ethers.getSigners())[0]
    const l2ERC721: Signer = (await ethers.getSigners())[1]
    const l1StandardERC721: Contract = await deployL1StandardERC721(
      await l1Bridge.getAddress(),
      await l2ERC721.getAddress(),
      'Test',
      'TST',
      ''
    )
    const erc165 = '0x01ffc9a7'
    expect(await l1StandardERC721.supportsInterface(erc165)).to.equal(true)
    const erc721 = '0x80ac58cd'
    expect(await l1StandardERC721.supportsInterface(erc721)).to.equal(true)
    const erc721bridgable = '0x3899b238'
    expect(await l1StandardERC721.supportsInterface(erc721bridgable)).to.equal(
      true
    )
  })
})
