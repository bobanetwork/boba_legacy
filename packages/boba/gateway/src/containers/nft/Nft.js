import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import ListNFT from 'components/listNFT/listNFT'

import * as S from './Nft.styles'
import * as styles from './Nft.module.scss'

import { Grid, Typography } from '@mui/material'
import PageHeader from 'components/pageHeader/PageHeader'

import Input from 'components/input/Input'
import Button from 'components/button/Button'

import networkService from 'services/networkService'

//import { addNFT } from 'actions/nftAction'

import ListContract from 'components/listContract/listContract'

import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import AlertIcon from 'components/icons/AlertIcon'

class Nft extends React.Component {

  constructor(props) {

    super(props)

    const { 
      list
    } = this.props.nft

    this.state = {
      list,
      contractAddress: '',
      tokenID: '',
      loading: this.props.loading['NFT/ADD']
    }

  }

  componentDidUpdate(prevState) {

    const { list } = this.props.nft

    if (!isEqual(prevState.nft.list, list)) {
     this.setState({ list })
    }

    if (!isEqual(prevState.loading['NFT/ADD'], this.props.loading['NFT/ADD'])) {
     this.setState({ loading: this.props.loading['NFT/ADD'] })
     if(this.props.loading['NFT/ADD']) {
       this.setState({ contractAddress: '' })
     }
    }

  }

  handleInputAddress = event => {
    this.setState({ contractAddress: event.target.value })
  }

  handleInputID = event => {
    this.setState({ tokenID: event.target.value })
  }

  async addNFT() {
    networkService.addNFT(this.state.contractAddress, this.state.tokenID)
  }
  
  render() {

    const {
      list,
      contractAddress,
      tokenID,
      loading
    } = this.state

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

          <Typography variant="h2" component="h2" sx={{fontWeight: "700", marginTop: '20px'}}>Your NFTs</Typography>

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
                  tokenID={list[v].tokenID}
                />)
              })
            }
          </Grid>
        </Grid>

        <Grid item xs={12} sx={{marginTop: '20px', borderRadius: '4px', border: 'solid 1px rgba(255,255,255,0.2)', padding: '10px'}}>

          <Typography variant="h3" component="h3" sx={{fontWeight: "700", marginBottom: '20px'}}>Add NFTs</Typography>
          {Object.keys(list).map((v, i) => {
            const key_UUID = `nft_` + i
            return (
              <ListContract
                key={key_UUID}
                address={list[v].address}
                tokenID={list[v].tokenID}
                symbol={list[v].symbol}
                UUID={list[v].UUID}
              />)
          })}

          <Typography variant="body3" component="p" sx={{mt: 1, mb: 2, fontSize: '0.7em', marginTop: '20px', marginRight: '40px'}}>
            To add an NFT, please add its address and tokenID and click 'Add NFT'. If you do not know your tokenID,
            you can look it up in the blockexplorer. It is shown as a parameter in the mint or transfer event. 
          </Typography>

          <Input
            placeholder='Address 0x...'
            value={contractAddress}
            onChange={this.handleInputAddress}
            paste
          />

          <Input
            sx={{marginTop: '20px'}}
            placeholder='tokenID - e.g. 3'
            value={tokenID}
            onChange={this.handleInputID}
            paste
          />

          <Button
            variant="contained"
            onClick={(i)=>{this.addNFT()}}
            disabled={loading || contractAddress === '' || tokenID === ''}
            sx={{flex: 1, marginTop: '20px', marginBottom: '20px'}}
          >
            {loading ? 'Adding NFT...' : 'Add NFT'}
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
