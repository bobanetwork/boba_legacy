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

import { logAmount, amountToUsd, toWei_String } from 'util/amountConvert'

class Airdrop extends React.Component {

  constructor(props) {

    super(props);

    const { claimDetailsL1, claimDetailsL2 } = this.props.airdrop
    const { layer2 } = this.props.balance

    this.state = {
      claimDetailsL1,
      claimDetailsL2,
      layer2
      //contracts,
      //ownerName: '',
      //tokenURI: '',
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

  initiateDrop() {
    console.log('initiateDrop')
  }

  airdrop() {
    console.log('airdrop')
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

    let omgBalance = layer2.filter((i) => {
      if (i.symbol === 'ETH') return true
      return false
    })

    let omgWeiString = '0'

    if (typeof(omgBalance[0]) !== 'undefined') {
      console.log("omgBalance:",omgBalance[0])
      omgWeiString = omgBalance[0].balance.toString()
    }

    console.log("omgWeiString:",omgWeiString)

    const OMG_float = Number(logAmount(omgWeiString, 18))

    let recordFoundL1 = false
    let balanceL1 = 0
    if(claimDetailsL1.hasOwnProperty('merkleProof') && claimDetailsL1.merkleProof.amount !== null) {
      recordFoundL1 = true
      balanceL1 = Number(logAmount(claimDetailsL1.merkleProof.amount.toString(), 18))
    }

    let recordFoundL2 = false
    let balanceL2 = 0
    if(claimDetailsL2.hasOwnProperty('merkleProof') && claimDetailsL2.merkleProof.amount !== null) {
      recordFoundL2 = true
      balanceL2 = Number(logAmount(claimDetailsL2.merkleProof.amount.toString(), 18))
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

          <Typography 
            variant="body2" 
            component="p" 
            sx={{mt: 1, mb: 2}}
          >
            You have {OMG_float} OMG on Boba
          </Typography>

          {!recordFoundL1 &&
              <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2}}
            >
              There is no record of OMG in this wallet on Ethereum in the snapshot block.
            </Typography>
          }

          {recordFoundL1 && balanceL1 > 0 && OMG_float > balanceL1 * 0.97 &&
            <>
              <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2, color: 'green'}}
            >
              Yes, there is an OMG balance of {balanceL1} on Ethereum in the snapshot block. 
              <br/>Also, you have enough OMG on Boba to initiate your airdrop. 
            </Typography>
            <Button
              onClick={this.initiateDrop}
              color="neutral"
              size="large"
            >
              Initiate Airdrop
            </Button>
            </>
          }

          {recordFoundL1 && balanceL1 > 0 && OMG_float <= balanceL1 * 0.97 &&
              <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2, color: 'yellow'}}
            >
              Yes, there is an OMG balance of {balanceL1} on Ethereum in the snapshot block.
              <br/>However, your current OMG balance on Boba is only {OMG_float}. 
              <br/>Please bridge {(balanceL1 - OMG_float)*0.99} or more OMG to Boba to initiate your airdrop.
            </Typography>
          }

          <Typography variant="h3" component="h3" sx={{fontWeight: "700"}}>L2 Airdrop</Typography>

          {!recordFoundL2 &&
              <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2}}
            >
              There is no record of OMG in this wallet on Boba in the snapshot block.
            </Typography>
          }

          {recordFoundL2 && balanceL2 > 0 &&
            <>
            <Typography 
              variant="body2" 
              component="p" 
              sx={{mt: 1, mb: 2}}
            >
              Yes, there is an OMG balance of {balanceL2} on Boba in the snapshot block.
            </Typography>
            <Button
                onClick={this.airdrop}
                color="neutral"
                size="large"
              >
                Airdrop my Boba!
            </Button>
            </>
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
