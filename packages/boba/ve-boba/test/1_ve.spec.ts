import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import { solidity } from 'ethereum-waffle'
chai.use(solidity);
import TestERC20Json from './helper/TestERC20.json'

describe("ve", function () {
    let token;
    let ve_underlying;
    let ve;
    let owner;
    let ve_underlying_amount = ethers.BigNumber.from("1000000000000000000000");

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
    });

    it("create lock", async function () {
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const lockDuration = 7 * 24 * 3600; // 1 week
    
        // Balance should be zero before and 1 after creating the lock
        expect(await ve.balanceOf(owner.address)).to.deep.eq(BigNumber.from(0));
        await ve.create_lock(ve_underlying_amount, lockDuration);
        expect(await ve.ownerOf(1)).to.deep.eq(owner.address);
        expect(await ve.balanceOf(owner.address)).to.deep.eq(BigNumber.from(1));
    });

    it("create lock outside allowed zones", async function () {
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const oneWeek = 7 * 24 * 3600;
        const oneYear = 1 * 365 * 24 * 3600;
        await expect(ve.create_lock(ve_underlying_amount, oneYear + oneWeek)).to.be.revertedWith('Voting lock can be 1 year max');
    });

    it("Withdraw", async function () {
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const lockDuration = 7 * 24 * 3600; // 1 week
        await ve.create_lock(ve_underlying_amount, lockDuration);
    
        // Try withdraw early
        const tokenId = 1;
        await expect(ve.withdraw(tokenId)).to.be.reverted;
        // Now try withdraw after the time has expired
        ethers.provider.send("evm_increaseTime", [lockDuration]);
        ethers.provider.send("evm_mine", []); // mine the next block
        await ve.withdraw(tokenId);
    
        expect(await ve_underlying.balanceOf(owner.address)).to.equal(ve_underlying_amount);
        // Check that the NFT is burnt
        expect(await ve.balanceOfNFT(tokenId)).to.equal(0);
        expect(await ve.ownerOf(tokenId)).to.equal(ethers.constants.AddressZero);
    });

    it("check tokenURI calls", async function () {
        // tokenURI should not work for non-existent token ids
        await expect(ve.tokenURI(999)).to.be.reverted;
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const lockDuration = 7 * 24 * 3600; // 1 week
        await ve.create_lock(ve_underlying_amount, lockDuration);
    
        const tokenId = 1;
        ethers.provider.send("evm_increaseTime", [lockDuration]);
        ethers.provider.send("evm_mine", []); // mine the next block
    
        // Just check that this doesn't revert
        await ve.tokenURI(tokenId);
    
        // Withdraw, which destroys the NFT
        await ve.withdraw(tokenId);
    
        // tokenURI should not work for this anymore as the NFT is burnt
        await expect(ve.tokenURI(tokenId)).to.be.reverted;
    });

    it("Confirm supportsInterface works with expected interfaces", async function () {
        // Check that it supports all the expected interfaces.
        const ERC165_INTERFACE_ID = 0x01ffc9a7;
        const ERC721_INTERFACE_ID = 0x80ac58cd;
        const ERC721_METADATA_INTERFACE_ID = 0x5b5e139f;
    
        expect(await ve.supportsInterface(ERC165_INTERFACE_ID)).to.be.true;
        expect(await ve.supportsInterface(ERC721_INTERFACE_ID)).to.be.true;
        expect(await ve.supportsInterface(ERC721_METADATA_INTERFACE_ID)).to.be.true;
      });

    it("Check supportsInterface handles unsupported interfaces correctly", async function () {
        const ERC721_FAKE = 0x780e9d61;
        expect(await ve.supportsInterface(ERC721_FAKE)).to.be.false;
    });

    it("merge ve locks", async function () {
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const lockDuration = 7 * 24 * 3600; // 1 week
    
        await ve.create_lock(ve_underlying_amount.div(2), lockDuration);
        await ve.create_lock(ve_underlying_amount.div(2), lockDuration);


        await ve.merge(1, 2);
        // check token 1 is burned
        expect(await ve.balanceOfNFT(1)).to.equal(0);
        expect(await ve.ownerOf(1)).to.equal(ethers.constants.AddressZero);
        // check balance of token 2
        expect((await ve.locked(1)).amount).to.deep.eq(BigNumber.from(0))
        expect((await ve.locked(2)).amount).to.deep.eq(ve_underlying_amount)
    });

    it("increase ve lock time", async function () {
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const lockDuration = 7 * 24 * 3600; // 1 week
    
        const tokenId = 1;
        const oneWeek = 7 * 24 * 3600;
        await ve.create_lock(ve_underlying_amount, lockDuration);
        const priorEnd = await ve.locked__end(tokenId)
        const priorAmount = (await ve.locked(tokenId)).amount
        await ve.increase_unlock_time(tokenId, lockDuration + oneWeek);
        expect(await ve.locked__end(tokenId)).to.be.deep.eq(priorEnd.add(oneWeek));
        expect((await ve.locked(tokenId)).amount).to.be.deep.eq(priorAmount);
    });

    it("increase ve amount", async function () {
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const lockDuration = 7 * 24 * 3600; // 1 week
    
        const tokenId = 1;
        await ve.create_lock(ve_underlying_amount.div(2), lockDuration);
        const priorEnd = await ve.locked__end(tokenId)
        const priorAmount = (await ve.locked(tokenId)).amount
        await ve.increase_amount(tokenId, ve_underlying_amount.div(2));
        expect((await ve.locked(tokenId)).amount).to.be.deep.eq(priorAmount.add(ve_underlying_amount.div(2)));
        expect(await ve.locked__end(tokenId)).to.be.deep.eq(priorEnd)
    });

    it("check transfer", async function () {
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const lockDuration = 7 * 24 * 3600; // 1 week
        await ve.create_lock(ve_underlying_amount, lockDuration);
        
        const address2 = await (await ethers.getSigners())[1].getAddress()
        // Transfer token
        const tokenId = 1;
        await ve.transferFrom(owner.address, address2, tokenId)

        expect(await ve.ownerOf(1)).to.deep.eq(address2);
    });

    it("check ve voting power at timestamp with amount update", async function () {
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const lockDuration = 1 * 365 * 86400; // max time
        const five_weeks = 5 * 7 * 24 * 3600;
        await ve.create_lock(ve_underlying_amount, lockDuration);

        const tokenId = 1
        const initVotingPower = await ve.balanceOfNFT(tokenId)

        const timestampCreation = await ve.user_point_history__ts(tokenId, 1)

        ethers.provider.send("evm_increaseTime", [five_weeks]);
        ethers.provider.send("evm_mine", []); // mine the next block

        const veBalanceFirstRound = await ve.balanceOfNFT(tokenId)
        expect(veBalanceFirstRound).to.be.lt(initVotingPower)
        let blockNum = await ethers.provider.getBlockNumber();
        let block = await ethers.provider.getBlock(blockNum);
        const timestampOne = block.timestamp - 100;
        const veTimestampOne = await ve.ve_for_at(tokenId, timestampOne)
        expect(await ve.ve_for_at(tokenId, timestampOne)).to.be.gt(veBalanceFirstRound);

        // add more to ve lock
        await ve_underlying.mint(owner.address, ve_underlying_amount);
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        await ve.increase_amount(tokenId, ve_underlying_amount);
        const veBalanceSecondRound = await ve.balanceOfNFT(tokenId)
        expect(veBalanceSecondRound).to.be.gt(veBalanceFirstRound);
        blockNum = await ethers.provider.getBlockNumber();
        block = await ethers.provider.getBlock(blockNum);
        const timestampTwo = block.timestamp - 100;
        // this should be less because amount increase should only increase voting power
        // from the subsequent ts
        expect(await ve.ve_for_at(tokenId, timestampTwo)).to.be.lt(veBalanceSecondRound);
        // check older timestamp still has same ve power
        expect(await ve.ve_for_at(tokenId, timestampOne)).to.be.deep.eq(veTimestampOne)

        // ve before lock should be 0
        expect(await ve.ve_for_at(tokenId, timestampCreation - 1)).to.be.deep.eq(BigNumber.from(0))
        // ve after lock end should be 0
        const locked_end = await ve.locked__end(tokenId)
        expect(await ve.ve_for_at(tokenId, locked_end - 1)).to.be.not.eq(BigNumber.from(0))
        expect(await ve.ve_for_at(tokenId, locked_end)).to.be.deep.eq(BigNumber.from(0))
        expect(await ve.ve_for_at(tokenId, locked_end + 1)).to.be.deep.eq(BigNumber.from(0))
    });

    it("check ve voting power at timestamp with expiry update", async function () {
        await ve_underlying.approve(ve.address, ve_underlying_amount);
        const lockDuration = 1 * 365 * 86400; // max time
        const five_weeks = 5 * 7 * 24 * 3600;
        await ve.create_lock(ve_underlying_amount, lockDuration);

        const tokenId = 1
        const initVotingPower = await ve.balanceOfNFT(tokenId)

        const timestampCreation = await ve.user_point_history__ts(tokenId, 1)

        ethers.provider.send("evm_increaseTime", [five_weeks]);
        ethers.provider.send("evm_mine", []); // mine the next block

        const veBalanceFirstRound = await ve.balanceOfNFT(tokenId)
        expect(veBalanceFirstRound).to.be.lt(initVotingPower)
        let blockNum = await ethers.provider.getBlockNumber();
        let block = await ethers.provider.getBlock(blockNum);
        const timestampOne = block.timestamp - 100;
        const veTimestampOne = await ve.ve_for_at(tokenId, timestampOne)
        expect(await ve.ve_for_at(tokenId, timestampOne)).to.be.gt(veBalanceFirstRound);

        // extend ve lock
        await ve.increase_unlock_time(tokenId, lockDuration);
        const veBalanceSecondRound = await ve.balanceOfNFT(tokenId)
        expect(veBalanceSecondRound).to.be.gt(veBalanceFirstRound);
        blockNum = await ethers.provider.getBlockNumber();
        block = await ethers.provider.getBlock(blockNum);
        const timestampTwo = block.timestamp - 100;
        // this should be less because amount increase should only increase voting power
        // from the subsequent ts
        expect(await ve.ve_for_at(tokenId, timestampTwo)).to.be.lt(veBalanceSecondRound);
        // check older timestamp still has same ve power
        expect(await ve.ve_for_at(tokenId, timestampOne)).to.be.deep.eq(veTimestampOne)

        // ve before lock should be 0
        expect(await ve.ve_for_at(tokenId, timestampCreation - 1)).to.be.deep.eq(BigNumber.from(0))
        // ve after lock end should be 0
        const locked_end = await ve.locked__end(tokenId)
        expect(await ve.ve_for_at(tokenId, locked_end - 1)).to.be.not.eq(BigNumber.from(0))
        expect(await ve.ve_for_at(tokenId, locked_end)).to.be.deep.eq(BigNumber.from(0))
        expect(await ve.ve_for_at(tokenId, locked_end + 1)).to.be.deep.eq(BigNumber.from(0))
    });
});