import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import ListNFT from 'components/listNFT/listNFT'

import * as S from './Nft.styles'
import * as styles from './Nft.module.scss'

import { Grid, Typography } from '@material-ui/core'
import PageHeader from 'components/pageHeader/PageHeader'

import Input from 'components/input/Input'
import Button from 'components/button/Button'

import networkService from 'services/networkService'

import { addNFTContract } from 'actions/nftAction'

import ListContract from 'components/listContract/listContract'

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
            <S.LayerAlert>
              <S.AlertInfo>
                <AlertIcon />
                <S.AlertText
                  variant="body2"
                  component="p"
                >
                  You are on Ethereum Mainnet. To use Boba NFTs, SWITCH to Boba
                </S.AlertText>
              </S.AlertInfo>
              <LayerSwitcher isButton={true} />
            </S.LayerAlert>
        </div>
    }

    return (
      <>
        <PageHeader title="NFT" />

        <Grid item xs={12} >

          <Typography variant="h2" component="h2" sx={{fontWeight: "700"}}>Your NFTs</Typography>

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

        <Grid item xs={12} sx={{marginTop: '20px', borderRadius: '4px', border: 'solid 1px rgba(255,255,255,0.2)', padding: '10px'}}>

          <Typography variant="h3" component="h3" sx={{fontWeight: "700", marginBottom: '20px'}}>Add NFT contracts</Typography>
          
          {Object.keys(contracts).map((contract, index) => {
            return (
              <ListContract
                key={index}
                contract={contracts[contract]}
              />)
          })}

          <Typography variant="body3" component="p" sx={{mt: 1, mb: 2, fontSize: '0.7em', marginTop: '20px', marginRight: '40px'}}>
            To add an NFT contract, please add its address and click 'Add NFT contract'. You only have to do this once per NFT family. 
            Once you have added the contract, it will take about 15 seconds to find your NFT(s). 
          </Typography>

          <Input
            placeholder='Address 0x...'
            value={contractAddress}
            onChange={this.handleInput}
            paste
          />

          <Button
            variant="contained"
            onClick={this.addContract}
            disabled={loading || contractAddress === ''}
            sx={{flex: 1, marginTop: '20px', marginBottom: '20px'}}
          >
            {loading ? 'Adding contract...' : 'Add NFT contract'}
          </Button>

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
