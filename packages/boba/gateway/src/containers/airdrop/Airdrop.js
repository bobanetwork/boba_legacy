import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'
import * as styles from './Airdrop.module.scss'
import { Box, Grid, Typography } from '@material-ui/core'
import Button from 'components/button/Button'
import PageHeader from 'components/pageHeader/PageHeader'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import AlertIcon from 'components/icons/AlertIcon'
import networkService from 'services/networkService'
import moment from 'moment'

import { openAlert } from 'actions/uiAction'
import { initiateAirdrop, getAirdropL1, getAirdropL2 } from 'actions/airdropAction'
import { logAmount, amountToUsd, toWei_String } from 'util/amountConvert'

class Airdrop extends React.Component {

  constructor(props) {

    super(props)

    const { 
      claimDetailsL1, 
      claimDetailsL2 
    } = this.props.airdrop
    
    const { layer2 } = this.props.balance

    this.state = {
      claimDetailsL1,
      claimDetailsL2,
      layer2
    }

  }

  componentDidMount() {
    //ToDo
  }

  componentDidUpdate(prevState) {

    const { claimDetailsL1, claimDetailsL2 } = this.props.airdrop
    const { layer2 } = this.props.balance

    if (!isEqual(prevState.airdrop.claimDetailsL1, claimDetailsL1)) {
     this.setState({ claimDetailsL1 })
    }

    if (!isEqual(prevState.airdrop.claimDetailsL2, claimDetailsL2)) {
     this.setState({ claimDetailsL2 })
    }

    if (!isEqual(prevState.balance.layer2, layer2)) {
     this.setState({ layer2 })
    }

  }

  async initiateDrop() {

    console.log('initiateDrop')

    let res = await this.props.dispatch(initiateAirdrop())

    if (res) {
      this.props.dispatch(openAlert(`Your airdrop for L1 snapshot balances has been initiated. You will receive your Boba in 30 days.`))
    }

  }

  async airdropL1() {

    console.log('airdropL1')

    let res = await this.props.dispatch(getAirdropL1({
      test: 'test'
    }))

    if (res) {
      this.props.dispatch(openAlert(`L1 airdrop claim successfull.`))
    }

  }

  async airdropL2() {

    console.log('airdropL2')

    let res = await this.props.dispatch(getAirdropL2(this.state.claimDetailsL2))

    if (res) {
      this.props.dispatch(openAlert(`L2 airdrop claim successfull.`))
    }

  }

  render() {

    const {
      claimDetailsL1,
      claimDetailsL2,
      layer2
    } = this.state

    console.log("claimDetails:",claimDetailsL1)
    console.log("claimDetails:",claimDetailsL2)
    console.log("layer2:",layer2)

    //just for testing use ETH balance 
    let omgBalance = layer2.filter((i) => {
      if (i.symbol === 'OMG') return true
      return false
    })

    let omgWeiString = '0'

    if (typeof(omgBalance[0]) !== 'undefined') {
      console.log("omgBalance:",omgBalance[0])
      omgWeiString = omgBalance[0].balance.toString()
    }

    console.log("omgWeiString:",omgWeiString)

    let l2BalanceOMG = Number(logAmount(omgWeiString, 18))

    l2BalanceOMG = 10

    let recordFoundL1 = false
    let snapValueL1 = 0
    let claimedL1 = false
    let claimedL1time = 0
    let unlockL1time = 0
    let isUnlocked = false
    if(claimDetailsL1.hasOwnProperty('amount') && claimDetailsL1.amount !== 0) {
      recordFoundL1 = true
      snapValueL1 = Number(logAmount(claimDetailsL1.amount, 18))
    }
    if(claimDetailsL1.hasOwnProperty('claimed') && claimDetailsL1.claimed === 1) {
      claimedL1 = true
      claimedL1time = moment.unix(claimDetailsL1.claimTimestamp).format('MM/DD/YYYY hh:mm a') 
    }
    /*not yet claimed, but initiated*/
    if(claimDetailsL1.hasOwnProperty('claimUnlockTime') && claimDetailsL1.claimUnlockTime !== null && claimDetailsL1.claimed === 0) {
      unlockL1time = moment.unix(claimDetailsL1.claimUnlockTime).format('MM/DD/YYYY hh:mm a')
      isUnlocked = moment().isAfter(moment.unix(claimDetailsL1.claimUnlockTime)) 
    }

    let recordFoundL2 = false
    let snapValueL2 = 0
    let claimedL2 = false
    let claimedL2time = 0
    if(claimDetailsL2.hasOwnProperty('amount') && claimDetailsL2.amount !== 0) {
      recordFoundL2 = true
      snapValueL2 = Number(logAmount(claimDetailsL2.amount, 18))
    }
    if(claimDetailsL2.hasOwnProperty('claimed') && claimDetailsL2.claimed === 1) {
      claimedL2 = true
      claimedL2time = moment.unix(claimDetailsL2.claimTimestamp).format('MM/DD/YYYY hh:mm a') 
    }

    const layer = networkService.L1orL2

    if(layer === 'L1') {
        return <div className={styles.container}>
            <PageHeader title="Airdrop" />
            <div className={styles.content}>
                <Box
                  sx={{
                    //background: theme.palette.background.secondary,
                    borderRadius: '12px',
                    margin: '20px 5px',
                    padding: '10px 20px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <AlertIcon />
                    <Typography
                      sx={{ wordBreak: 'break-all', marginLeft: '10px' }}
                      variant="body1"
                      component="p"
                    >
                      You are on L1. To claim Boba, SWITCH LAYER to L2
                    </Typography>
                  </div>
                    <LayerSwitcher isButton={true} />
                </Box>
            </div>
        </div>
    }

    return (
      <>
        <PageHeader title="Airdrop" />

        <Grid item xs={12}>

          <Typography variant="h3" component="h3" sx={{fontWeight: "700"}}>L1 Airdrop</Typography>

          {/* STATE 1 - NO OMG ON L1 DURING SNAPSHOT */}
          {!recordFoundL1 &&
              <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2}}
            >
              There is no record of OMG in this wallet on Ethereum during the snapshot.
            </Typography>
          }

          {/* STATE 2 - OMG ON L1 DURING SNAPSHOT AND NOT CLAIMED AND NOT INITIATED AND ENOUGH OMG ON L2 RIGHT NOW */}
          {recordFoundL1 && (snapValueL1 > 0) && (l2BalanceOMG > snapValueL1 * 0.97) && (claimedL1 === false) && (unlockL1time === 0) &&
            <>
            <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2, color: 'green'}}
            >
              Yes, there was an OMG balance of {snapValueL1} on Ethereum during the snapshot. 
              <br/>Also, you have enough OMG on Boba to initiate your airdrop. 
            </Typography>
            <Button
              onClick={(i)=>{this.initiateDrop()}}
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
              sx={{mt: 1, mb: 2, color: 'yellow'}}
            >
              Yes, there was an OMG balance of {snapValueL1} on Ethereum during the snapshot.
              <br/>However, your current OMG balance on Boba is only {l2BalanceOMG}. 
              <br/>Please bridge {(snapValueL1 - l2BalanceOMG)*0.99} or more OMG to Boba to initiate your airdrop.
            </Typography>
          }

          {/* STATE 4 - INITIATED BUT TOO EARLY */}
          {recordFoundL1 && (unlockL1time !== 0) && (isUnlocked === false) && 
            <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2, color: 'green'}}
            >
              Airdrop initiated.
              <br/>The unlock time is {unlockL1time}. 
              <br/>After that, you will be able to airdrop your Boba based on your L1 OMG snapshot balance.
            </Typography>
          }

          {/* STATE 5 - INITIATED AND READY TO AIRDROP */}
          {isUnlocked && 
            <>
              <Typography 
                variant="body2" 
                component="p" 
                sx={{mt: 1, mb: 2, color: 'green'}}
              >
                The unlock time of {unlockL1time} has passed. You can now airdrop your L1 snapshot Boba.
              </Typography>
              <Button
                onClick={(i)=>{this.airdropL1()}}
                color="primary"
                size="large"
                newStyle
                variant="contained"
              >
                Airdrop my L1 snapshot Boba!
              </Button>
            </>
          }
           
          {/* STATE 6 - CLAIMED */}
          {!!claimedL1 &&
            <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2}}
            >
              You airdropped your L1 snapshot Boba at {claimedL1time}.
            </Typography>
          }

          <Typography variant="h3" component="h3" sx={{fontWeight: "700", marginTop: '30px'}}>L2 Airdrop</Typography>

          {!recordFoundL2 &&
              <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2}}
            >
              There is no record of OMG in this wallet on Boba during the snapshot.
            </Typography>
          }

          {recordFoundL2 && snapValueL2 > 0 && claimedL2 === false &&
            <>
            <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2}}
            >
              Yes, there was an OMG balance of {snapValueL2} on Boba during the snapshot.
            </Typography>
            <Button
              onClick={(i)=>{this.airdropL2()}}
              color="primary"
              size="large"
              newStyle
              variant="contained"
            >
              Airdrop my L2 snapshot Boba!
            </Button>
            </>
          }

          {!!claimedL2 &&
            <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2}}
            >
              You airdropped your L2 snapshot Boba at {claimedL2time}.
            </Typography>
          }

        </Grid>

      </>
    )
  }
}

const mapStateToProps = state => ({
  airdrop: state.airdrop,
  balance: state.balance
})

export default connect(mapStateToProps)(Airdrop)
