import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

import { Contract, ContractFactory, BigNumber } from 'ethers'

import { getBobaContractAt, deployBobaContractCore } from '@boba/contracts'

import { OptimismEnv } from './shared/env'

describe('NFT Test\n', async () => {
  let env: OptimismEnv

  let ERC721: Contract
  let ERC721_D: Contract

  let ERC721Reg: Contract

  let a1a: string
  let a2a: string
  let a3a: string

  const nftName_D = 'TestNFT_D'
  const nftSymbol_D = 'TST_D'

  before(async () => {
    env = await OptimismEnv.new()

    a1a = env.l2Wallet.address
    a2a = env.l2Wallet_2.address
    a3a = env.l2Wallet_3.address

    ERC721 = await getBobaContractAt(
      'ERC721Genesis',
      env.addressesBOBA.L2ERC721,
      env.l2Wallet
    )

    ERC721Reg = await getBobaContractAt(
      'ERC721Registry',
      env.addressesBOBA.L2ERC721Reg,
      env.l2Wallet
    )
  })

  it('should have a name', async () => {
    const tokenName = await ERC721.name()
    expect(tokenName).to.equal('TestNFT')
  })

  it('should generate a new ERC721 for Alice (a2a)', async () => {
    let meta = 'https://boredapeyachtclub.com/api/mutants/111'

    //mint one NFT for Alice
    let nft = await ERC721.mintNFT(a2a, meta)
    await nft.wait()
    const TID_1 = await ERC721.getLastTID()

    //mint a second NFT, this time for a3a
    meta = 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/6190'
    nft = await ERC721.mintNFT(a3a, meta)
    await nft.wait()
    const TID_2 = await ERC721.getLastTID()

    //mint a third NFT, this time for a2a
    meta = 'https://boredapeyachtclub.com/api/mutants/121'
    nft = await ERC721.mintNFT(a2a, meta)
    await nft.wait()
    const TID_3 = await ERC721.getLastTID()

    expect(await ERC721.balanceOf(a1a)).to.deep.eq(BigNumber.from(String(0)))

    expect(await ERC721.ownerOf(TID_1.sub(1))).to.deep.eq(a2a)
    expect(await ERC721.ownerOf(TID_2.sub(1))).to.deep.eq(a3a)
    expect(await ERC721.ownerOf(TID_3.sub(1))).to.deep.eq(a2a)

    // Token 100 should not exist (at this point)
    expect(
      ERC721.ownerOf(BigNumber.from(String(100)))
    ).to.be.eventually.rejectedWith('ERC721: owner query for nonexistent token')
  })

  it('should derive an NFT Factory from a genesis NFT', async () => {
    //Alice (a2a) Account #2 wishes to create a derivative NFT factory from a genesis NFT
    const tokenID = await ERC721.tokenOfOwnerByIndex(a2a, 0)
    //determine the UUID
    const UUID =
      ERC721.address.substring(1, 6) +
      '_' +
      tokenID.toString() +
      '_' +
      a2a.substring(1, 6)

    ERC721_D = await deployBobaContractCore(
      'ERC721Genesis',
      [
        nftName_D,
        nftSymbol_D,
        BigNumber.from(String(0)), //starting index for the tokenIDs
        ERC721.address,
        UUID,
        'BOBA_Goerli_2888'
      ],
      env.l2Wallet
    )
    const meta =
      'http://blogs.bodleian.ox.ac.uk/wp-content/uploads/sites/163/2015/10/AdaByron-1850-1000x1200-e1444805848856.jpg'

    const nft = await ERC721_D.mintNFT(a3a, meta)
    await nft.wait()
  })

  it('should register the NFTs address in users wallet', async () => {
    await ERC721Reg.registerAddress(a2a, ERC721.address)
    //but, a3a should have two flavors of NFT...
    await ERC721Reg.registerAddress(a3a, ERC721.address)
    await ERC721Reg.registerAddress(a3a, ERC721_D.address)
  })
})
