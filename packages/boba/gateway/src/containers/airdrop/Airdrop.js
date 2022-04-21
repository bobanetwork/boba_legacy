
import React from 'react'
import { connect } from 'react-redux'

import { isEqual } from 'lodash'
import moment from 'moment'
import truncate from 'truncate-middle'

import { Box, Grid, Typography } from '@mui/material'

import * as S from './Airdrop.styles'

import Button from 'components/button/Button'
import PageTitle from 'components/pageTitle/PageTitle'

import networkService from 'services/networkService'

import { openAlert } from 'actions/uiAction'
import { initiateAirdrop, getAirdropL1, getAirdropL2 } from 'actions/airdropAction'

import { logAmount } from 'util/amountConvert'

import Connect from 'containers/connect/Connect'

class Airdrop extends React.Component {

  constructor(props) {

    super(props)

    const {
      claimDetailsL1,
      claimDetailsL2
    } = this.props.airdrop

    const {
      layer2,
    } = this.props.balance

    const {
      accountEnabled,
      netLayer
    } = this.props.setup

    this.state = {
      claimDetailsL1,
      claimDetailsL2,
      layer2,
      netLayer,
      accountEnabled,
      walletAddress: networkService.account ? truncate(networkService.account, 6, 4, '...') : ''
    }

  }

  componentDidUpdate(prevState) {

    const { claimDetailsL1, claimDetailsL2 } = this.props.airdrop
    const { layer2 } = this.props.balance
    const { accountEnabled, netLayer } = this.props.setup

    if (!isEqual(prevState.airdrop.claimDetailsL1, claimDetailsL1)) {
      this.setState({ claimDetailsL1 })
    }

    if (!isEqual(prevState.airdrop.claimDetailsL2, claimDetailsL2)) {
      this.setState({ claimDetailsL2 })
    }

    if (!isEqual(prevState.balance.layer2, layer2)) {
      this.setState({ layer2 })
    }

    if (!isEqual(prevState.setup.netLayer, netLayer)) {
      this.setState({ netLayer })
    }

    if (!isEqual(prevState.setup.accountEnabled, accountEnabled)) {
      this.setState({ accountEnabled })
    }

  }

  async initiateDrop() {

    console.log('initiateAirdrop:', this.state.claimDetailsL1)

    let res = await this.props.dispatch(initiateAirdrop(this.state.claimDetailsL1))

    if (res) {
      this.props.dispatch(openAlert(`Your claim for L1 snapshot balances has been initiated. You will receive your BOBA in 30 days.`))
    }

  }

  async airdropL1() {

    console.log('airdropL1:', this.state.claimDetailsL1)

    let res = await this.props.dispatch(getAirdropL1(this.state.claimDetailsL1))

    if (res) {
      this.props.dispatch(openAlert(`L1 claim successful.`))
    }

  }

  async airdropL2() {

    console.log('airdropL2')

    let res = await this.props.dispatch(getAirdropL2(this.state.claimDetailsL2))

    if (res) {
      this.props.dispatch(openAlert(`L2 claim successful.`))
    }

  }

  render() {

    const {
      claimDetailsL1,
      claimDetailsL2,
      layer2,
      walletAddress,
      netLayer,
      accountEnabled
    } = this.state

    let omgBalance = layer2.filter((i) => {
      if (i.symbol === 'OMG') return true
      return false
    })

    let omgWeiString = '0'
    if (typeof (omgBalance[ 0 ]) !== 'undefined') {
      console.log("omgBalance:", omgBalance[ 0 ])
      omgWeiString = omgBalance[ 0 ].balance.toString()
    }

    let l2BalanceOMG = Number(logAmount(omgWeiString, 18))

    let recordFoundL1 = false
    let snapValueL1 = 0
    let claimedL1 = false
    let claimedL1time = 0
    let unlockL1time = 0
    let isUnlocked = false
    if (claimDetailsL1 && claimDetailsL1.hasOwnProperty('amount') && claimDetailsL1.amount !== 0) {
      recordFoundL1 = true
      snapValueL1 = Number(logAmount(claimDetailsL1.amount, 18))
      console.log("L1 snapvalue:", snapValueL1)
    }
    if (claimDetailsL1 && claimDetailsL1.hasOwnProperty('claimed') && claimDetailsL1.claimed === 1) {
      claimedL1 = true
      claimedL1time = moment.unix(claimDetailsL1.claimedTimestamp).format('MM/DD/YYYY hh:mm a')
    }
    /*not yet claimed, but initiated*/
    if (claimDetailsL1 && claimDetailsL1.hasOwnProperty('claimUnlockTime') && claimDetailsL1.claimUnlockTime !== null && claimDetailsL1.claimed === 0) {
      unlockL1time = moment.unix(claimDetailsL1.claimUnlockTime).format('MM/DD/YYYY hh:mm a')
      isUnlocked = moment().isAfter(moment.unix(claimDetailsL1.claimUnlockTime))
    }

    let recordFoundL2 = false
    let snapValueL2 = 0
    let claimedL2 = false
    let claimedL2time = 0
    if (claimDetailsL2 && claimDetailsL2.hasOwnProperty('amount') && claimDetailsL2.amount !== 0) {
      recordFoundL2 = true
      snapValueL2 = Number(logAmount(claimDetailsL2.amount, 18))
    }
    if (claimDetailsL2 && claimDetailsL2.hasOwnProperty('claimed') && claimDetailsL2.claimed === 1) {
      claimedL2 = true
      claimedL2time = moment.unix(claimDetailsL2.claimedTimestamp).format('MM/DD/YYYY hh:mm a')
    }

    return (
      <S.AirDropPageContainer>
        <PageTitle title="Airdrop" />

        <Connect
          userPrompt={'Please connect to Boba claim your airdrop'}
          accountEnabled={accountEnabled}
          connectToBoba={true}
          layer={netLayer}
        />

        {netLayer === 'L2' &&
        <Grid item xs={12}>

          <Box>
            <Typography variant="h3" component="h3" sx={{ fontWeight: "700", marginBottom: '20px' }}>L1 Airdrop</Typography>
            <Box sx={{ background: 'rgba(255, 255, 255, 0.11)', padding: '10px', borderRadius: '3px' }}>

              {/* STATE 1 - NO OMG ON L1 DURING SNAPSHOT */}
              {!recordFoundL1 &&
                <Typography
                  variant="body2"
                  component="p"
                >
                  There is no record of OMG in this specific non-custodial address ({walletAddress}) on Ethereum during the snapshot.
                  <br /><br /><Typography component="span" color="secondary" fontWeight="700">If you had OMG on Ethereum during the snapshot,
                    but are getting this message, please double check to make sure that you are accessing the gateway with
                    the correct account/address.</Typography>
                  <br /><br />Be advised that this claim tab has nothing to do with the exchanges.
                  If you held OMG at an exchange during the L1 snapshot, the exchange, if it supported the airdrop, will
                  drop your BOBA to you.
                </Typography>
              }

              {/* STATE 2 - OMG ON L1 DURING SNAPSHOT AND NOT CLAIMED AND NOT INITIATED AND ENOUGH OMG ON L2 RIGHT NOW */}
              {recordFoundL1 && (snapValueL1 > 0) && (l2BalanceOMG > snapValueL1 * 0.97) && (claimedL1 === false) && (unlockL1time === 0) &&
                <>
                  <Typography
                    variant="body2"
                    component="p"
                    sx={{ color: 'green' }}
                  >
                    Yes, there was an OMG balance of {snapValueL1} on Ethereum during the snapshot.
                    <br />Also, you have enough OMG on Boba to claim your airdrop.
                  </Typography>
                  <Button
                    onClick={(i) => { this.initiateDrop() }}
                    color="primary"
                    size="large"
                    newStyle
                    variant="contained"
                  >
                    Initiate Airdrop
                  </Button>
                </>
              }

              {/* STATE 3 - OMG ON L1 DURING SNAPSHOT AND NOT CLAIMED AND NOT INITIATED BUT NOT ENOUGH OMG ON L2 */}
              {recordFoundL1 && (snapValueL1 > 0) && (l2BalanceOMG <= snapValueL1 * 0.97) && (claimedL1 === false) && (unlockL1time === 0) &&
                <Typography
                  variant="body2"
                  component="p"
                  sx={{ color: 'yellow' }}
                >
                  Yes, there was a balance of {snapValueL1} OMG on Ethereum during the snapshot.
                  <br />However, your current OMG balance on Boba is only {l2BalanceOMG}.
                  <br />Please bridge {(snapValueL1 - l2BalanceOMG) * 0.99} or more OMG to Boba to claim your airdrop.
                </Typography>
              }

              {/* STATE 4 - INITIATED BUT TOO EARLY */}
              {recordFoundL1 && (unlockL1time !== 0) && (isUnlocked === false) &&
                <>
                  <Typography
                    variant="body1"
                    component="p"
                    sx={{ color: 'green', fontWeight: '700' }}
                  >
                    Airdrop initiated
                  </Typography>
                  <Typography
                    variant="body2"
                    component="p"
                  >
                    The unlock time is {unlockL1time}.
                    <br />After that, you will be able to claim your L1 snapshot BOBA.
                  </Typography>
                </>
              }

              {/* STATE 5 - INITIATED AND READY TO AIRDROP */}
              {isUnlocked &&
                <>
                  <Typography
                    variant="body2"
                    component="p"
                  >
                    The unlock time of {unlockL1time} has passed. You can now claim your L1 snapshot BOBA.
                  </Typography>
                  <Button
                    onClick={(i) => { this.airdropL1() }}
                    color="primary"
                    size="large"
                    newStyle
                    variant="contained"
                  >
                    Claim my L1 snapshot BOBA!
                  </Button>
                </>
              }

              {/* STATE 6 - CLAIMED */}
              {!!claimedL1 &&
                <>
                  <Typography
                    variant="body1"
                    component="p"
                    sx={{ color: 'green', fontWeight: '700' }}
                  >
                    Airdrop completed
                  </Typography>
                  <Typography
                    variant="body2"
                    component="p"
                    sx={{ mt: 1, mb: 2 }}
                  >
                    You claimed your L1 snapshot BOBA at {claimedL1time}.
                  </Typography>
                </>
              }
            </Box>
          </Box>

          <Box sx={{ mt: 2}}>

            <Typography variant="h3" component="h3" sx={{ fontWeight: "700", marginBottom: '20px' }}>L2 Airdrop</Typography>

            <Box sx={{ background: 'rgba(255, 255, 255, 0.11)', padding: '10px', borderRadius: '3px' }}>

              {!recordFoundL2 &&
                <Typography
                  variant="body2"
                  component="p"
                >
                  There is no record of OMG in this specific non-custodial address ({walletAddress}) on Boba during the snapshot.
                  <br /><br /><Typography component="span" color="secondary" fontWeight="700" >If you had OMG on Boba during the snapshot,
                    but are getting this message, please double check to make sure that you are accessing the gateway with
                    the correct account/address.</Typography>
                  <br /><br />Be advised that this claim tab has nothing to do with the exchanges.
                  If you held OMG at an exchange during the L1 snapshot, the exchange, if it supported the airdrop, will
                  drop your BOBA to you.
                </Typography>
              }

              {recordFoundL2 && snapValueL2 > 0 && claimedL2 === false &&
                <>
                  <Typography
                    variant="body2"
                    component="p"
                  >
                    There was a balance of {snapValueL2 * (100 / 105)} OMG on Boba during the snapshot.
                    You will receive {snapValueL2} BOBA (OMG balance + 5%).
                  </Typography>
                  <Button
                    onClick={(i) => { this.airdropL2() }}
                    color="primary"
                    size="large"
                    newStyle
                    variant="contained"
                  >
                    Claim my L2 snapshot BOBA!
                  </Button>
                </>
              }

              {!!claimedL2 &&
                <>
                  <Typography
                    variant="body1"
                    component="p"
                    sx={{ color: 'green', fontWeight: '700' }}
                  >
                    Airdrop completed
                  </Typography>
                  <Typography
                    variant="body2"
                    component="p"
                  >
                    You claimed your L2 snapshot BOBA at {claimedL2time}.
                  </Typography>
                </>
              }
            </Box>
          </Box>
        </Grid>
      }
      </S.AirDropPageContainer>
    )
  }
}

const mapStateToProps = state => ({
  airdrop: state.airdrop,
  balance: state.balance,
  setup: state.setup,
})

export default connect(mapStateToProps)(Airdrop)
