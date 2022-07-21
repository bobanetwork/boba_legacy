import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

import { ethers } from 'hardhat'
import { BigNumber, utils } from 'ethers'
import { solidity } from 'ethereum-waffle'
chai.use(solidity);
import TestERC20Json from './helper/TestERC20.json'

describe("voter", function () {
    let token;
    let ve_underlying;
    let ve;
    let ve_underlying_amount = ethers.BigNumber.from("1000000000000000000000");
    let gauges_factory;
    let voter;
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

        await ve.setVoter(voter.address);
    });

    it("request gauge", async function () {
        const listingFee = await voter.listing_fee()
        await ve_underlying.mint(owner.address, listingFee.add(utils.parseEther('1000')));
        await ve_underlying.approve(ve.address, listingFee.add(utils.parseEther('1000')));
        const lockDuration = 1 * 365 * 86400; // max time
        await ve.create_lock(listingFee.add(utils.parseEther('1000')), lockDuration);

        // request gauge
        const tokenId = 1
        const dummyPoolAddress = '0x1234123412341234123412341234123412341234'
        await voter.requestGauge(dummyPoolAddress, tokenId)
        expect(await voter.isRequested(dummyPoolAddress)).to.be.deep.eq(true)
    });

    it("request gauge without sufficient balance", async function () {
        const listingFee = await voter.listing_fee()
        await ve_underlying.mint(owner.address, listingFee);
        await ve_underlying.approve(ve.address, listingFee);
        const lockDuration = 24 * 7 * 24 * 3600; // 6 months
        await ve.create_lock(listingFee, lockDuration);

        // request gauge
        const tokenId = 1
        const dummyPoolAddress = '0x1234123412341234123412341234123412341234'
        await expect(voter.requestGauge(dummyPoolAddress, tokenId)).to.be.reverted
    });

    it("create gauge without request", async function () {
        const dummyPoolAddress = '0x1234123412341234123412341234123412341234'
        const operator = await (await ethers.getSigners())[1].getAddress()
        await expect(voter.createGauge(dummyPoolAddress, operator)).to.be.revertedWith('!requested')
    });

    it("create gauge", async function () {
        const listingFee = await voter.listing_fee()
        await ve_underlying.mint(owner.address, listingFee.add(utils.parseEther('1000')));
        await ve_underlying.approve(ve.address, listingFee.add(utils.parseEther('1000')));
        const lockDuration = 1 * 365 * 86400; // max time
        await ve.create_lock(listingFee.add(utils.parseEther('1000')), lockDuration);

        // request gauge
        const tokenId = 1
        const dummyPoolAddress = '0x1234123412341234123412341234123412341234'
        const operator = await (await ethers.getSigners())[1].getAddress()
        await voter.requestGauge(dummyPoolAddress, tokenId)
        expect(await voter.isRequested(dummyPoolAddress)).to.be.deep.eq(true)
        const creationTx = await voter.createGauge(dummyPoolAddress, operator)
        const receipt = await creationTx.wait()
        const event = receipt.events.find(event => event.event === 'GaugeCreated');
        const gaugeAddress = event.args.gauge
        expect(await voter.gauges(dummyPoolAddress)).to.be.deep.eq(gaugeAddress)
        expect(await voter.poolForGauge(gaugeAddress)).to.be.deep.eq(dummyPoolAddress)
        expect(await voter.isGauge(gaugeAddress)).to.be.deep.eq(true)
    });

    it("vote", async function () {
        const listingFee = await voter.listing_fee()
        await ve_underlying.mint(owner.address, listingFee.add(utils.parseEther('1000')));
        await ve_underlying.approve(ve.address, listingFee.add(utils.parseEther('1000')));
        const lockDuration = 1 * 365 * 86400; // max time
        await ve.create_lock(listingFee.add(utils.parseEther('1000')), lockDuration);

        // request gauge
        const tokenId = 1
        const dummyPoolAddress = '0x1234123412341234123412341234123412341234'
        const dummyPoolAddress2 = '0x1234123412341234123412341234123412341233'
        const operator = await (await ethers.getSigners())[1].getAddress()
        await voter.requestGauge(dummyPoolAddress, tokenId)
        await voter.createGauge(dummyPoolAddress, operator)
        await voter.requestGauge(dummyPoolAddress2, tokenId)
        await voter.createGauge(dummyPoolAddress2, operator)

        await voter.vote(1, [dummyPoolAddress, dummyPoolAddress2], [5000, 5000])

        expect(await voter.totalWeight()).to.be.deep.eq(await voter.usedWeights(tokenId));
        expect(await ve.voted(tokenId)).to.be.deep.eq(true)
        expect(await voter.totalWeight()).to.be.deep.eq((await voter.weights(dummyPoolAddress)).add(await voter.weights(dummyPoolAddress2)))
        expect(await voter.weights(dummyPoolAddress)).to.be.deep.eq(await voter.votes(tokenId, dummyPoolAddress))
        expect(await voter.weights(dummyPoolAddress2)).to.be.deep.eq(await voter.votes(tokenId, dummyPoolAddress2))
    });

    it("reset vote", async function () {
        const listingFee = await voter.listing_fee()
        await ve_underlying.mint(owner.address, listingFee.add(utils.parseEther('1000')));
        await ve_underlying.approve(ve.address, listingFee.add(utils.parseEther('1000')));
        const lockDuration = 1 * 365 * 86400; // max time
        await ve.create_lock(listingFee.add(utils.parseEther('1000')), lockDuration);

        // request gauge
        const tokenId = 1
        const dummyPoolAddress = '0x1234123412341234123412341234123412341234'
        const dummyPoolAddress2 = '0x1234123412341234123412341234123412341233'
        const operator = await (await ethers.getSigners())[1].getAddress()
        await voter.requestGauge(dummyPoolAddress, tokenId)
        await voter.createGauge(dummyPoolAddress, operator)
        await voter.requestGauge(dummyPoolAddress2, tokenId)
        await voter.createGauge(dummyPoolAddress2, operator)

        await voter.vote(tokenId, [dummyPoolAddress, dummyPoolAddress2], [5000, 5000])
        await voter.reset(tokenId)
        expect(await ve.voted(tokenId)).to.be.deep.eq(false)
        expect(await voter.totalWeight()).to.be.deep.eq(0)
        expect(await voter.usedWeights(tokenId)).to.be.deep.eq(0)
    });
})