import { expect } from './setup'

/* External Imports */
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import {
  getEventsFromGraph,
  countRelayMessageEventsFromGraph,
} from '../src/graph'

describe('graph', () => {
  let signer1: Signer

  before(async () => {
    ;[signer1] = await ethers.getSigners()
  })

  it('should receive events from subgraph', async () => {
    // This should return two evenets
    const relayedMessageEvents = await getEventsFromGraph(
      'relayedMessageEntities',
      1,
      14790018,
      14790018
    )
    expect(relayedMessageEvents.data.relayedMessageEntities.length).to.be.eq(2)
    // This should return two events
    const relayedMessageFastEvents = await getEventsFromGraph(
      'relayedMessageFastEntities',
      1,
      14699748,
      14699748
    )
    expect(
      relayedMessageFastEvents.data.relayedMessageFastEntities.length
    ).to.be.eq(2)
    // This should return zero event
    const failedRelayedMessageEvents = await getEventsFromGraph(
      'failedRelayedMessageEntities',
      1,
      0,
      14800048
    )
    expect(
      failedRelayedMessageEvents.data.failedRelayedMessageEntities.length
    ).to.be.eq(0)
    // This should return zero event
    const failedRelayedMessageFastEvents = await getEventsFromGraph(
      'failedRelayedMessageFastEntities',
      1,
      0,
      14800048
    )
    expect(
      failedRelayedMessageFastEvents.data.failedRelayedMessageFastEntities
        .length
    ).to.be.eq(0)
    // This should return 12 events
    const numberOfEvents = await countRelayMessageEventsFromGraph(
      signer1.provider,
      14799000,
      14800000,
      1
    )
    expect(numberOfEvents).to.be.eq(12)
  })

  it('should receive zero event from subgraph if chain ID is not whitelisted', async () => {
    const relayedMessageFastEvents = await getEventsFromGraph(
      'relayedMessageFastEntities',
      10,
      14699748,
      14699748
    )
    expect(typeof relayedMessageFastEvents.data).to.be.eq('undefined')
  })
})
