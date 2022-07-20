import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

import { ethers } from 'hardhat'
import { BigNumber, utils } from 'ethers'
import { solidity } from 'ethereum-waffle'
chai.use(solidity);
import TestERC20Json from './helper/TestERC20.json'

describe("emissions", function () {
    let token;
    let ve_underlying;
    let ve;
    let ve_underlying_amount = ethers.BigNumber.from("1000000000000000000000");
    let gauges_factory;
    let voter;
    let dispatcher;
    let owner;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();
        token = new ethers.ContractFactory(
            TestERC20Json.abi,
            TestERC20Json.bytecode,
            owner
        )
        ve_underlying = await token.deploy();
        await ve_underlying.deployed();
        await ve_underlying.mint(owner.address, ve_underlying_amount);
        let vecontract = await ethers.getContractFactory("contracts/ve.sol:ve");
        ve = await vecontract.deploy(ve_underlying.address);
        await ve.deployed();

        const BaseV1GaugeFactory = await ethers.getContractFactory("BaseV1GaugeFactory");
        gauges_factory = await BaseV1GaugeFactory.deploy();
        await gauges_factory.deployed();

        const BaseV1Voter = await ethers.getContractFactory("BaseV1Voter");
        voter = await BaseV1Voter.deploy(ve.address, gauges_factory.address);
        await voter.deployed();

        const BaseV1Dispatcher = await ethers.getContractFactory("BaseV1Dispatcher")
        dispatcher = await BaseV1Dispatcher.deploy(voter.address, ve.address)
        await dispatcher.deployed()

        await ve.setVoter(voter.address);
        
        await voter.initialize([], dispatcher.address)
    });

    it("initial ve allocations without funds", async function () {
        const addressOne = await (await ethers.getSigners())[1].getAddress()
        const addressTwo = await (await ethers.getSigners())[2].getAddress()
        const initAmountOne = ve_underlying_amount.div(3)
        const initAmountTwo = ve_underlying_amount.div(2)
        await expect(dispatcher.initialize([addressOne, addressTwo], [initAmountOne, initAmountTwo], ve_underlying_amount)).to.be.reverted
    })

    it("initial ve allocations", async function () {
        // transfer ve_underlying_amount to dispatcher while initializing
        // approve to use funds
        await ve_underlying.approve(dispatcher.address, ve_underlying_amount)

        const priorActivePeriod = await dispatcher.active_period()
        const addressOne = await (await ethers.getSigners())[1].getAddress()
        const addressTwo = await (await ethers.getSigners())[2].getAddress()
        const initAmountOne = ve_underlying_amount.div(3)
        const initAmountTwo = ve_underlying_amount.div(2)
        await dispatcher.initialize([addressOne, addressTwo], [initAmountOne, initAmountTwo], ve_underlying_amount)

        // check ve locks created
        expect(await ve.ownerOf(1)).to.deep.eq(addressOne);
        expect(await ve.balanceOf(addressOne)).to.deep.eq(BigNumber.from(1));

        expect(await ve.ownerOf(2)).to.deep.eq(addressTwo);
        expect(await ve.balanceOf(addressTwo)).to.deep.eq(BigNumber.from(1));
        // check active period changed
        expect(await dispatcher.active_period()).to.not.eq(priorActivePeriod)
    })

    it("weekly emission", async function () {
        await ve_underlying.approve(dispatcher.address, ve_underlying_amount)

        const addressOne = await (await ethers.getSigners())[1].getAddress()
        const addressTwo = await (await ethers.getSigners())[2].getAddress()
        const initAmountOne = ve_underlying_amount.div(3)
        const initAmountTwo = ve_underlying_amount.div(2)
        await dispatcher.initialize([addressOne, addressTwo], [initAmountOne, initAmountTwo], ve_underlying_amount)

        await dispatcher.set_weekly_emission(utils.parseEther('100'))
        const updatedWeeklyEmission = await dispatcher.weekly_emission()
        expect(updatedWeeklyEmission).to.be.deep.eq(utils.parseEther('100'))
    })

    it("weekly emissions should decay", async function () {
        await ve_underlying.approve(dispatcher.address, ve_underlying_amount)

        const addressOne = await (await ethers.getSigners())[1].getAddress()
        const addressTwo = await (await ethers.getSigners())[2].getAddress()
        const initAmountOne = ve_underlying_amount.div(3)
        const initAmountTwo = ve_underlying_amount.div(2)
        await dispatcher.initialize([addressOne, addressTwo], [initAmountOne, initAmountTwo], ve_underlying_amount)

        // add a gauge
        const listingFee = await voter.listing_fee()
        await ve_underlying.mint(owner.address, listingFee.add(utils.parseEther('1000')));
        await ve_underlying.approve(ve.address, listingFee.add(utils.parseEther('1000')));
        const lockDuration = 1 * 365 * 86400; // max time
        await ve.create_lock(listingFee.add(utils.parseEther('1000')), lockDuration);
        const tokenId = 3
        const dummyPoolAddress = '0x1234123412341234123412341234123412341234'
        const operator = await (await ethers.getSigners())[1].getAddress()
        await voter.requestGauge(dummyPoolAddress, tokenId)
        await voter.createGauge(dummyPoolAddress, operator)
        await voter.vote(3, [dummyPoolAddress], [5000])

        await dispatcher.set_weekly_emission(utils.parseEther('10'))
        const updatedWeeklyEmission = await dispatcher.weekly_emission()
        expect(updatedWeeklyEmission).to.be.deep.eq(utils.parseEther('10'))
        
        const oneWeek = 1 * 7 * 24 * 3600;
        const twoWeeks = oneWeek * 2;
        // contract activates one week after initialization
        // emission starts after one week from activation, thus two weeks in the beginning
        ethers.provider.send("evm_increaseTime", [twoWeeks]);
        ethers.provider.send("evm_mine", []); // mine the next block
        await dispatcher.update_period()
        const currentWeeklyEmission = await dispatcher.weekly_emission()
        expect(currentWeeklyEmission).to.be.deep.eq(utils.parseEther('9.9'))

        // next week
        ethers.provider.send("evm_increaseTime", [oneWeek]);
        ethers.provider.send("evm_mine", []); // mine the next block
        await dispatcher.update_period()
        const weeklyEmissionNextWeek = await dispatcher.weekly_emission()
        expect(weeklyEmissionNextWeek).to.be.deep.eq(utils.parseEther('9.801'))
    })

    it("cannot update period within time", async function () {
        await ve_underlying.approve(dispatcher.address, ve_underlying_amount)

        const addressOne = await (await ethers.getSigners())[1].getAddress()
        const addressTwo = await (await ethers.getSigners())[2].getAddress()
        const initAmountOne = ve_underlying_amount.div(3)
        const initAmountTwo = ve_underlying_amount.div(2)
        await dispatcher.initialize([addressOne, addressTwo], [initAmountOne, initAmountTwo], ve_underlying_amount)

        const priorActivePeriod = await dispatcher.active_period()
        await dispatcher.update_period()
        expect(await dispatcher.active_period()).to.deep.eq(priorActivePeriod)
    })

    it("should update period and send funds", async function () {
        await ve_underlying.approve(dispatcher.address, ve_underlying_amount)

        const addressOne = await (await ethers.getSigners())[1].getAddress()
        const addressTwo = await (await ethers.getSigners())[2].getAddress()
        const initAmountOne = ve_underlying_amount.div(3)
        const initAmountTwo = ve_underlying_amount.div(2)
        await dispatcher.initialize([addressOne, addressTwo], [initAmountOne, initAmountTwo], ve_underlying_amount)

        // add a gauge
        const listingFee = await voter.listing_fee()
        await ve_underlying.mint(owner.address, listingFee.add(utils.parseEther('1000')));
        await ve_underlying.approve(ve.address, listingFee.add(utils.parseEther('1000')));
        const lockDuration = 1 * 365 * 86400; // max time
        await ve.create_lock(listingFee.add(utils.parseEther('1000')), lockDuration);
        const tokenId = 3
        const dummyPoolAddress = '0x1234123412341234123412341234123412341234'
        const operator = await (await ethers.getSigners())[1].getAddress()
        await voter.requestGauge(dummyPoolAddress, tokenId)
        await voter.createGauge(dummyPoolAddress, operator)
        await voter.vote(3, [dummyPoolAddress], [5000])

        // set weekly emission
        await dispatcher.set_weekly_emission(utils.parseEther('100'))

        // fast forwards 2 weeks (approx 1 week after active period)
        const twoWeek = 2 * 7 * 24 * 3600;
        ethers.provider.send("evm_increaseTime", [twoWeek]);
        ethers.provider.send("evm_mine", []); // mine the next block
        await dispatcher.update_period()
        expect(await ve_underlying.balanceOf(voter.address)).to.be.eq(utils.parseEther('100')) 
        // updating further does nothing for the same week
        await dispatcher.update_period()
        expect(await ve_underlying.balanceOf(voter.address)).to.be.eq(utils.parseEther('100')) 
    })
})