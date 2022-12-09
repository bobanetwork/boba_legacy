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
      'https://rpc.ankr.com/fantom_testnet'
    )
  })

  it('should get relayed message events', async () => {
    // These two events are from the same block
    const event_1 = await getRelayedMessageEventsFromGraph(
      provider,
      '0x1ab4456687fc99dbaf42fd88da031754fe13167fbca1922db2989e89151058e7',
      false
    )
    expect(event_1).to.have.lengthOf(1)

    const event_2 = await getRelayedMessageEventsFromGraph(
      provider,
      '0x75cdbb1106a93a5fefb47234c253da860f0114ed64a15f629c6fabb45170b222',
      false
    )
    expect(event_1).to.have.lengthOf(1)
    expect(event_2).to.have.lengthOf(1)
    expect(event_1[0].transactionHash).to.equal(event_2[0].transactionHash)
  })

  it('should get transaction and transaction receipt from event', async () => {
    const event = await getRelayedMessageEventsFromGraph(
      provider,
      '0x1ab4456687fc99dbaf42fd88da031754fe13167fbca1922db2989e89151058e7',
      false
    )
    const transactionReceipt = await event[0].getTransactionReceipt()
    expect(transactionReceipt).to.be.not.eq(null)

    const transaction = await event[0].getTransaction()
    expect(transaction).to.be.not.eq(null)
  })

  it('should get AddressSet events', async () => {
    provider = new ethers.providers.JsonRpcProvider(
      'https://api.avax-test.network/ext/bc/C/rpc'
    )
    const event = await getAddressSetEventsFromGraph(
      provider,
      'L2CrossDomainMessenger',
      11967648,
      11967648
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
