import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

import { ethers } from 'hardhat'
import { BigNumber, Contract, utils } from 'ethers'
import { solidity } from 'ethereum-waffle'
chai.use(solidity);
import TestERC20Json from './helper/TestERC20.json'

describe("ve Boba endToEnd tets", function () {
    let token;
    let ve_underlying;
    let ve;
    let ve_underlying_amount = ethers.BigNumber.from("1000000000000000000000");
    let gauges_factory;
    let voter;
    let dispatcher;
    let owner;
    let userOne;
    let userTwo;
    let gaugeOperator;
    let gaugeOne;
    let gaugeTwo;
    let dummyPoolAddressOne = '0x1234123412341234123412341234123412341234';
    let dummyPoolAddressTwo = '0x1234123412341234123412341234123412341233'

    before(async function () {
        [owner, userOne, userTwo, gaugeOperator] = await ethers.getSigners();
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

        await ve_underlying.approve(dispatcher.address, ve_underlying_amount)
        await dispatcher.initialize([], [], ve_underlying_amount)

        // set weekly emission
        await dispatcher.set_weekly_emission(utils.parseEther('1000'))
    });

    it("should create lock", async function () {
        // create a lock for userOne
        await ve_underlying.mint(userOne.address, ve_underlying_amount);
        await ve_underlying.connect(userOne).approve(ve.address, ve_underlying_amount);
        const lockDurationOne = 6 * 7 * 24 * 3600; // 6 weeks
    
        await ve.connect(userOne).create_lock(ve_underlying_amount, lockDurationOne);
        expect(await ve.ownerOf(1)).to.deep.eq(userOne.address);
        expect(await ve.balanceOf(userOne.address)).to.deep.eq(BigNumber.from(1));

        // create a lock for userTwo
        await ve_underlying.mint(userTwo.address, ve_underlying_amount);
        await ve_underlying.connect(userTwo).approve(ve.address, ve_underlying_amount);
        const lockDurationTwo = 8 * 7 * 24 * 3600; // 8 weeks
    
        await ve.connect(userTwo).create_lock(ve_underlying_amount, lockDurationTwo);
        expect(await ve.ownerOf(2)).to.deep.eq(userTwo.address);
        expect(await ve.balanceOf(userTwo.address)).to.deep.eq(BigNumber.from(1));
    });

    it("operator requests gauges", async function () {
        const listingFee = await voter.listing_fee()
        await ve_underlying.mint(gaugeOperator.address, listingFee.add(utils.parseEther('1000')));
        await ve_underlying.connect(gaugeOperator).approve(ve.address, listingFee.add(utils.parseEther('1000')));
        const lockDuration = 1 * 365 * 86400; // max time
        await ve.connect(gaugeOperator).create_lock(listingFee.add(utils.parseEther('1000')), lockDuration);

        const tokenId = 3
        await voter.connect(gaugeOperator).requestGauge(dummyPoolAddressOne, tokenId)
        expect(await voter.isRequested(dummyPoolAddressOne)).to.be.deep.eq(true)

        // request a second gauge
        await voter.connect(gaugeOperator).requestGauge(dummyPoolAddressTwo, tokenId)
        expect(await voter.isRequested(dummyPoolAddressTwo)).to.be.deep.eq(true)
    })

    it("owner whitelists gauges", async function () {
        const creationTx = await voter.createGauge(dummyPoolAddressOne, gaugeOperator.address)
        const receipt = await creationTx.wait()
        const event = receipt.events.find(event => event.event === 'GaugeCreated');
        gaugeOne = event.args.gauge
        expect(await voter.gauges(dummyPoolAddressOne)).to.be.deep.eq(gaugeOne)
        expect(await voter.isGauge(gaugeOne)).to.be.deep.eq(true)

        const creationTx2 = await voter.createGauge(dummyPoolAddressTwo, gaugeOperator.address)
        const receipt2 = await creationTx2.wait()
        const event2 = receipt2.events.find(event => event.event === 'GaugeCreated');
        gaugeTwo = event2.args.gauge
        expect(await voter.gauges(dummyPoolAddressTwo)).to.be.deep.eq(gaugeTwo)
        expect(await voter.isGauge(gaugeTwo)).to.be.deep.eq(true)
    })

    it("allocate votes to gauges", async function () {
        await voter.connect(userOne).vote(1, [dummyPoolAddressOne, dummyPoolAddressTwo], [5000, 5000])
        await voter.connect(userTwo).vote(2, [dummyPoolAddressOne], [5000])

        expect(await voter.totalWeight()).to.be.deep.eq((await voter.usedWeights(1)).add(await voter.usedWeights(2)));
        expect(await ve.voted(1)).to.be.deep.eq(true)
        expect(await ve.voted(2)).to.be.deep.eq(true)
    }) 

    it("distribute emission to gaugeOne", async function () {
        // move two weeks
        const twoWeek = 2 * 7 * 24 * 3600;
        ethers.provider.send("evm_increaseTime", [twoWeek]);
        ethers.provider.send("evm_mine", []);

        let priorGaugeBalance = await ve_underlying.balanceOf(gaugeOne)
        await voter["distribute(address)"](gaugeOne)
        let postVoterTotalBalance = await ve_underlying.balanceOf(voter.address)
        let postGaugeBalance = await ve_underlying.balanceOf(gaugeOne)

        expect(postGaugeBalance).to.be.gt(priorGaugeBalance)
        // the tokens for gaugeTwo should be present on the voter
        expect(postVoterTotalBalance).to.not.eq(0)
    }) 

    it("distribute emission to remaining gauges", async function () {
        let priorVoterTotalBalance = await ve_underlying.balanceOf(voter.address)
        let priorGaugeOneBalance = await ve_underlying.balanceOf(gaugeOne)
        let priorGaugeTwoBalance = await ve_underlying.balanceOf(gaugeTwo)
        await voter["distribute()"]()
        let postVoterTotalBalance = await ve_underlying.balanceOf(voter.address)
        let postGaugeOneBalance = await ve_underlying.balanceOf(gaugeOne)
        let postGaugeTwoBalance = await ve_underlying.balanceOf(gaugeTwo)

        expect(postVoterTotalBalance).to.be.lt(priorVoterTotalBalance)
        expect(postGaugeOneBalance).to.be.deep.eq(priorGaugeOneBalance)
        expect(postGaugeTwoBalance).to.be.gt(priorGaugeTwoBalance)
    }) 

    it("gauge operators can withdraw emissions", async function () {
        const Gauge = await ethers.getContractFactory('Gauge')
        const gaugeOneContract = new Contract(gaugeOne, Gauge.interface)
        
        // gaugeOne
        const priorGaugeOneBalance = await ve_underlying.balanceOf(gaugeOne)
        let priorGaugeOperatorBalance = await ve_underlying.balanceOf(gaugeOperator.address)
        await expect(gaugeOneContract.connect(owner).getReward(owner.address, ve_underlying.address)).to.be.reverted
        await gaugeOneContract.connect(gaugeOperator).getReward(gaugeOperator.address, ve_underlying.address)
        const postGaugeOneBalance = await ve_underlying.balanceOf(gaugeOne)
        let postGaugeOperatorBalance = await ve_underlying.balanceOf(gaugeOperator.address)
        expect(postGaugeOperatorBalance).to.be.deep.eq(priorGaugeOperatorBalance.add(priorGaugeOneBalance))
        expect(postGaugeOneBalance).to.be.deep.eq(0)

        // gaugeTwo
        const priorGaugeTwoBalance = await ve_underlying.balanceOf(gaugeTwo)
        priorGaugeOperatorBalance = await ve_underlying.balanceOf(gaugeOperator.address)
        const gaugeTwoContract = new Contract(gaugeTwo, Gauge.interface)
        await expect(gaugeTwoContract.connect(owner).getReward(owner.address, ve_underlying.address)).to.be.reverted
        await gaugeTwoContract.connect(gaugeOperator).getReward(gaugeOperator.address, ve_underlying.address)
        const postGaugeTwoBalance = await ve_underlying.balanceOf(gaugeTwo)
        postGaugeOperatorBalance = await ve_underlying.balanceOf(gaugeOperator.address)
        expect(postGaugeOperatorBalance).to.be.deep.eq(priorGaugeOperatorBalance.add(priorGaugeTwoBalance))
        expect(postGaugeTwoBalance).to.be.deep.eq(0)
    })

    it("should allow ve transfer and withdraw", async function () {
        const tokenId = 2
        await expect(ve.connect(userTwo).transferFrom(userTwo.address, userOne.address, tokenId)).to.be.revertedWith('attached');

        // poke
        const priorTotalWeight = await voter.totalWeight()
        const twoweeks = 14 * 24 * 3600;
        ethers.provider.send("evm_increaseTime", [twoweeks]);
        ethers.provider.send("evm_mine", []);
        await voter.poke(1)
        expect(await voter.totalWeight()).to.be.lt(priorTotalWeight)

        // reset and withdraw
        await voter.connect(userTwo).reset(tokenId)
        await ve.connect(userTwo).transferFrom(userTwo.address, userOne.address, tokenId)
        expect(await ve.ownerOf(tokenId)).to.be.deep.eq(userOne.address)

        const oneYear = 1 * 365 * 24 * 3600;
        ethers.provider.send("evm_increaseTime", [oneYear]);
        ethers.provider.send("evm_mine", []);

        await expect(ve.connect(userTwo).withdraw(tokenId)).to.be.reverted

        const priorUserOneBalance = await ve_underlying.balanceOf(userOne.address)
        await ve.connect(userOne).withdraw(tokenId)
        await voter.connect(userOne).reset(1)
        await ve.connect(userOne).withdraw(1)
        const postUserOneBalance = await ve_underlying.balanceOf(userOne.address)
        expect(postUserOneBalance).to.be.deep.eq(priorUserOneBalance.add(ve_underlying_amount.mul(2)))
    })
})