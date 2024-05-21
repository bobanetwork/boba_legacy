import { expect } from 'chai'
import { ethers } from 'ethers'
import {
  getRelayedMessageEventsFromGraph,
  getAddressSetEventsFromGraph,
  getStateBatchAppendedEventByBatchIndexFromGraph,
} from '../../src'

describe('subgraph tests', () => {
  let provider: ethers.providers.Provider
  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcProvider(
      'https://data-seed-prebsc-2-s2.bnbchain.org:8545'
    )
  })

  it('should get relayed message events', async () => {
    // These two events are from the same block
    const event_1 = await getRelayedMessageEventsFromGraph(
      provider,
      '0xeb2f76016d0029df16a0ebc7abba5c4afe2b424b0c0ea3cb1bf5ead5f92bf2d0',
      false
    )
    expect(event_1).to.have.lengthOf(1)

    const event_2 = await getRelayedMessageEventsFromGraph(
      provider,
      '0x2d2ce68e715e0dae0fef636d67383cdbb976a1624db62ebc2ee0d892228f30f4',
      false
    )
    expect(event_1).to.have.lengthOf(1)
    expect(event_2).to.have.lengthOf(1)
    expect(event_1[0].transactionHash).to.equal(event_2[0].transactionHash)
  })

  it('should get transaction and transaction receipt from event', async () => {
    const event = await getRelayedMessageEventsFromGraph(
      provider,
      '0xeb2f76016d0029df16a0ebc7abba5c4afe2b424b0c0ea3cb1bf5ead5f92bf2d0',
      false
    )
    const transactionReceipt = await event[0].getTransactionReceipt()
    expect(transactionReceipt).to.be.not.eq(null)

    const transaction = await event[0].getTransaction()
    expect(transaction).to.be.not.eq(null)
  })

  it('should get AddressSet events', async () => {
    provider = new ethers.providers.JsonRpcProvider(
      'https://data-seed-prebsc-2-s2.bnbchain.org:8545'
    )
    const event = await getAddressSetEventsFromGraph(
      provider,
      'L2ERC1155Bridge',
      30863106,
      30863106
    )
    expect(event).to.have.lengthOf(1)

    const transactionReceipt = await event[0].getTransactionReceipt()
    expect(transactionReceipt).to.be.not.eq(null)

    const transaction = await event[0].getTransaction()
    expect(transaction).to.be.not.eq(null)
  })

  it('should get StateBatchAppended events', async () => {
    const event = await getStateBatchAppendedEventByBatchIndexFromGraph(
      provider,
      13
    )
    expect(event).to.have.lengthOf(1)

    const transactionReceipt = await event[0].getTransactionReceipt()
    expect(transactionReceipt).to.be.not.eq(null)

    const transaction = await event[0].getTransaction()
    expect(transaction).to.be.not.eq(null)
  })
})
