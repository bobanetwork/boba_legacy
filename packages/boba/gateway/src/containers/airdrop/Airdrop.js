import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'
import * as styles from './Airdrop.module.scss'
import { Box, Grid, Typography } from '@material-ui/core'
import PageHeader from 'components/pageHeader/PageHeader'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import AlertIcon from 'components/icons/AlertIcon'
import networkService from 'services/networkService'

class Airdrop extends React.Component {

  constructor(props) {

    super(props);

    const { claimDetails } = this.props.airdrop

    this.state = {
      claimDetails,
      //contracts,
      //ownerName: '',
      //tokenURI: '',
    }

  }

  componentDidMount() {
    //ToDo
  }

  componentDidUpdate(prevState) {

    const { claimDetails } = this.props.airdrop

    if (!isEqual(prevState.airdrop.claimDetails, claimDetails)) {
     this.setState({ claimDetails })
    }

  }

  render() {

    const {
      claimDetails,
    } = this.state

    console.log("claimDetails:",claimDetails)

    //const numberOfNFTs = Object.keys(list).length
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

          <Typography variant="h2" component="h2" sx={{fontWeight: "700"}}>Airdrop Status</Typography>
{/*
          {numberOfNFTs === 1 &&
            <Typography variant="body2" component="p" sx={{mt: 1, mb: 2}}>You have one NFT and it should be shown below.</Typography>
          }
          {numberOfNFTs > 1 &&
            <Typography variant="body2" component="p" sx={{mt: 1, mb: 2}}>You have {numberOfNFTs} NFTs and they should be shown below.</Typography>
          }
          {numberOfNFTs < 1 &&
            <Typography variant="body2" component="p" sx={{mt: 1, mb: 2}}>Scanning the blockchain for your NFTs...</Typography>
          }
*/}
        </Grid>

      </>
    )
  }
}

const mapStateToProps = state => ({
  airdrop: state.airdrop
})

export default connect(mapStateToProps)(Airdrop)
