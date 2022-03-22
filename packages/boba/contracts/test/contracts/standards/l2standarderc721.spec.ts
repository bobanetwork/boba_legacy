import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { expect } from '../../setup'

const deployL2StandardERC721 = async (
  l2Bridge,
  l1ERC721,
  name,
  symbol,
  baseUri
): Promise<Contract> => {
  return (await ethers.getContractFactory('L2StandardERC721')).deploy(
    l2Bridge,
    l1ERC721,
    name,
    symbol,
    baseUri
  )
}

describe('L2 Standard ERC721 Tests', () => {
  it('should deploy and check supportsInterface', async () => {
    const l2Bridge: Signer = (await ethers.getSigners())[0]
    const l1ERC721: Signer = (await ethers.getSigners())[1]
    const l2StandardERC721: Contract = await deployL2StandardERC721(
      await l2Bridge.getAddress(),
      await l1ERC721.getAddress(),
      'Test',
      'TST',
      ''
    )
    const erc165 = '0x01ffc9a7'
    expect(await l2StandardERC721.supportsInterface(erc165)).to.equal(true)
    const erc721 = '0x80ac58cd'
    expect(await l2StandardERC721.supportsInterface(erc721)).to.equal(true)
    const erc721bridgable = '0x646dd6ec'
    expect(await l2StandardERC721.supportsInterface(erc721bridgable)).to.equal(
      true
    )
  })
})
