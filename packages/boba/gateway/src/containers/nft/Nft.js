import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import ListNFT from 'components/listNFT/listNFT'

import * as styles from './Nft.module.scss'

import { Box, Grid, Typography } from '@material-ui/core'
import PageHeader from 'components/pageHeader/PageHeader'

import Input from 'components/input/Input'
import Button from 'components/button/Button'

import networkService from 'services/networkService'

import { addNFTContract } from 'actions/nftAction'

import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import AlertIcon from 'components/icons/AlertIcon'

class Nft extends React.Component {

  constructor(props) {

    super(props)

    const { 
      list,
      contracts
    } = this.props.nft

    this.state = {
      list,
      contracts,
      contractAddress: '',
      tokenURI: '',
      loading: this.props.loading['NFT/ADDCONTRACT']
    }

  }

  componentDidUpdate(prevState) {

    const { list, contracts } = this.props.nft

    if (!isEqual(prevState.nft.list, list)) {
     this.setState({ list })
    }

    if (!isEqual(prevState.nft.contracts, contracts)) {
     this.setState({ contracts })
    }

    if (!isEqual(prevState.loading['NFT/ADDCONTRACT'], this.props.loading['NFT/ADDCONTRACT'])) {
     this.setState({ loading: this.props.loading['NFT/ADDCONTRACT'] })
     if(this.props.loading['NFT/ADDCONTRACT']) {
       this.setState({ contractAddress: '' })
     }
    }

  }

  handleInput = event => {
    this.setState({ contractAddress: event.target.value })
  }

  addContract = event => {
    //console.log("adding contract:",this.state.contractAddress)
    this.props.dispatch(addNFTContract( this.state.contractAddress ))
  }
  
  render() {

    const {
      list,
      contracts,
      contractAddress,
      loading
    } = this.state

    const numberOfNFTs = Object.keys(list).length
    const layer = networkService.L1orL2

    if(layer === 'L1') {
        return <div className={styles.container}>
            <PageHeader title="NFT" />
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
                            You are on L1. To use Boba NFTs, SWITCH LAYER to L2
                        </Typography>
                    </div>
                    <LayerSwitcher isButton={true} />
                </Box>
            </div>
        </div>
    }

    return (
      <>
        <PageHeader title="NFT" />

        <Grid item xs={12} >

          <Typography variant="h2" component="h2" sx={{fontWeight: "700"}}>Your NFTs</Typography>

          <Typography variant="body2" component="p" sx={{mt: 1, mb: 2}}
          >
            To add an NFT, please add its contract address and click 'Add NFT contract' below. You only have to do this once per NFT family. 
            Once you have added the contract, it will take about 15 seconds to find your NFT(s). 
          </Typography>

          {numberOfNFTs === 1 &&
            <Typography variant="body2" component="p" sx={{mt: 1, mb: 2}}>You have one NFT and it should be shown below.</Typography>
          }
          {numberOfNFTs > 1 &&
            <Typography variant="body2" component="p" sx={{mt: 1, mb: 2}}>You have {numberOfNFTs} NFTs and they should be shown below.</Typography>
          }
          {numberOfNFTs < 1 &&
            <Typography variant="body2" component="p" sx={{mt: 1, mb: 2}}>Scanning the blockchain for your NFTs...</Typography>
          }

          <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            xs={12}
            item
          >
            {Object.keys(list).map((v, i) => {
              const key_UUID = `nft_` + i
              return (
                <ListNFT
                  key={key_UUID}
                  name={list[v].name}
                  symbol={list[v].symbol}
                  address={list[v].address}
                  UUID={list[v].UUID}
                  URL={list[v].url}
                  meta={list[v].meta}
                />)
              })
            }
          </Grid>
        </Grid>

        <Grid item xs={12} sx={{marginTop: '20px'}}>

          <Typography variant="h2" component="h2" sx={{fontWeight: "700"}}>Add NFTs</Typography>

          <Input
            placeholder='Address 0x...'
            paste
            value={contractAddress}
            onChange={this.handleInput}
          />

          <Button
            variant="contained"
            onClick={this.addContract}
            disabled={loading}
            //fullWidth
            sx={{flex: 1, marginTop: '20px', marginBottom: '20px'}}
          >
            {loading ? 'Adding contract...' : 'Add NFT contract'}
          </Button>

          <Typography variant="body2" sx={{fontWeight: "700"}} component="p">Your NFT Contracts</Typography>

          {Object.keys(contracts).map((contract, index) => {
            return (
            <Typography variant="body2" key={index}>
              {contracts[contract].name}:&nbsp; 
              <Typography variant="body2" component="span" className={styles.muted}>
                {contracts[contract].address}
              </Typography>
            </Typography>)
          })}

        </Grid>

      </>
    )
  }
}

const mapStateToProps = state => ({
  nft: state.nft,
  loading: state.loading
})

export default connect(mapStateToProps)(Nft)
