import {getUsdValueOfTokenViaDisbursements, getUsdValueOfTokenViaIDs} from "../src/utils/coingecko";
import {expect} from "chai";
import {ethers} from "hardhat";
import {Asset, BobaChains} from "../src";
import {BigNumber} from "ethers";

describe('coingecko', () => {

  it('should get usd value of single asset', async () => {
    const assetKey = 'boba-network'
    const res = await getUsdValueOfTokenViaIDs([assetKey])
    expect(res).to.be.not.null
    expect(res[assetKey]?.usd).to.be.not.null
    expect(res[assetKey]?.usd).to.be.gt(0)
  })

  it('should get usd value of multiple assets', async () => {
    const assetKeys = [Asset.BOBA, Asset.ETH]
    const res = await getUsdValueOfTokenViaIDs(assetKeys)
    expect(res).to.be.not.null
    for (const assetKey of assetKeys) {
      expect(res[assetKey]?.usd).to.be.not.null
      expect(res[assetKey]?.usd).to.be.gt(0)
    }
    expect(res[assetKeys[0]].usd).to.be.lt(res[assetKeys[1]].usd, "BOBA is expected to be worth less than ETH")
  })

  it('should get usd value of tokens from disbursements', async () => {
    const ownSupportedAssets = BobaChains[2888].supportedAssets
    const disbursements = [
      {
        token: ethers.constants.AddressZero,
        amount: BigNumber.from('1000000000000000000').toString(),
        addr: '0x',
        depositId: 0,
        sourceChainId: 5,
      }
    ]
    const res = await getUsdValueOfTokenViaDisbursements(ownSupportedAssets, disbursements)
    expect(res[ethers.constants.AddressZero].usd).to.be.gt(200) // assuming ETH won't fall below 200$
  })


})
