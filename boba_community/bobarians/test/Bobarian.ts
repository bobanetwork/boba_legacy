import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('Lock', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  /*async function deployOneYearLockFixture() {
    const Lock = await ethers.getContractFactory('Lock')
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount })

    return { lock }
  }

  describe('Deployment', () => {
    it('Should set the right unlockTime', async () => {
      const { lock } = await loadFixture(deployOneYearLockFixture)

      expect(await lock.unlockTime()).to.equal(unlockTime)
    })
  })*/
})
