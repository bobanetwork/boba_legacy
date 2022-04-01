import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import ListNFT from 'components/listNFT/listNFT'
import * as S from './Nft.styles'

import { Box, Grid, Typography } from '@mui/material'

import Input from 'components/input/Input'
import Button from 'components/button/Button'

import networkService from 'services/networkService'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import AlertIcon from 'components/icons/AlertIcon'
import BobaGlassIcon from 'components/icons/BobaGlassIcon'
import Copy from 'components/copy/Copy'

class Nft extends React.Component {

  constructor(props) {

    super(props)

    const {
      list
    } = this.props.nft

    const {
      accountEnabled,
      netLayer
    } = this.props.setup

    this.state = {
      list,
      contractAddress: '',
      tokenID: '',
      loading: this.props.loading[ 'NFT/ADD' ],
      accountEnabled,
      netLayer,
    }

  }

  componentDidUpdate(prevState) {

    const { list } = this.props.nft

    const {
      accountEnabled,
      netLayer
    } = this.props.setup

    if (!isEqual(prevState.nft.list, list)) {
      this.setState({ list })
    }

    if (!isEqual(prevState.loading[ 'NFT/ADD' ], this.props.loading[ 'NFT/ADD' ])) {
      this.setState({ loading: this.props.loading[ 'NFT/ADD' ] })
      if (this.props.loading[ 'NFT/ADD' ]) {
        this.setState({ contractAddress: '' })
      }
    }

    if (!isEqual(prevState.setup.accountEnabled, accountEnabled)) {
      this.setState({ accountEnabled })
    }

    if (!isEqual(prevState.setup.netLayer, netLayer)) {
      this.setState({ netLayer })
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
      loading,
      netLayer,
    } = this.state

    if (!netLayer) {

      return (
        <S.TokenPageContainer>
          <S.TokenPageContentEmpty>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.1204 2.66504C7.51906 2.66504 5.37107 4.63837 5.37107 7.12371V24.8731C5.37107 27.3585 7.51906 29.3318 10.1204 29.3318H21.9551C24.5564 29.3318 26.7044 27.3585 26.7044 24.8731C26.7044 24.0051 26.7044 14.4757 26.7044 11.9984C26.7044 11.9851 26.7044 11.9704 26.7044 11.9571C26.7044 7.20638 22.1191 2.66504 17.3711 2.66504C11.7524 2.66504 11.7391 2.66504 10.1204 2.66504ZM10.1204 5.33171C11.4417 5.33171 12.9364 5.33171 16.0377 5.33171V8.87307C16.0377 11.3584 18.1857 13.3317 20.7871 13.3317H24.0377C24.0377 16.7144 24.0377 24.0944 24.0377 24.8731C24.0377 25.8251 23.1391 26.6651 21.9551 26.6651H10.1204C8.93639 26.6651 8.03773 25.8251 8.03773 24.8731V7.12371C8.03773 6.17171 8.93639 5.33171 10.1204 5.33171ZM18.7044 5.49838C21.0671 6.12505 23.2591 8.30906 23.8711 10.6651H20.7871C19.6017 10.6651 18.7044 9.82507 18.7044 8.87307V5.49838ZM12.0377 10.6651C11.3017 10.6651 10.7044 11.2624 10.7044 11.9984C10.7044 12.7344 11.3017 13.3317 12.0377 13.3317H13.3711C14.1071 13.3317 14.7044 12.7344 14.7044 11.9984C14.7044 11.2624 14.1071 10.6651 13.3711 10.6651H12.0377ZM12.0377 15.9984C11.3017 15.9984 10.7044 16.5957 10.7044 17.3318C10.7044 18.0678 11.3017 18.6651 12.0377 18.6651H20.0377C20.7737 18.6651 21.3711 18.0678 21.3711 17.3318C21.3711 16.5957 20.7737 15.9984 20.0377 15.9984H12.0377ZM12.0377 21.3318C11.3017 21.3318 10.7044 21.9291 10.7044 22.6651C10.7044 23.4011 11.3017 23.9984 12.0377 23.9984H20.0377C20.7737 23.9984 21.3711 23.4011 21.3711 22.6651C21.3711 21.9291 20.7737 21.3318 20.0377 21.3318H12.0377Z" fill="white" fillOpacity="0.65" />
              </svg>
              <Typography variant="body3" sx={{ opacity: 0.65 }}>
                No Data
              </Typography>
            </Box>
          </S.TokenPageContentEmpty>
        </S.TokenPageContainer>
      )

    } else if (netLayer === 'L1') {

      return (
        <S.TokenPageContainer>
          <S.TokenPageContentEmpty>
            <S.LayerAlert>
              <S.AlertInfo>
                <AlertIcon />
                <S.AlertText
                  variant="body2"
                  component="p"
                  align="center"
                >
                  You are on Ethereum. To use Boba NFTs, SWITCH to Boba
                </S.AlertText>
              </S.AlertInfo>
              <LayerSwitcher isButton={true} />
            </S.LayerAlert>
          </S.TokenPageContentEmpty>
        </S.TokenPageContainer>
      )
    }

    else {

      return (
        <S.NFTPageContainer>
          <S.NFTActionContent>
            <S.NFTFormContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <BobaGlassIcon />
                  <Typography variant="body1" >
                    Add NFT
                  </Typography>
                </Box>
                <S.DividerLine />
                <Typography variant="body1" >
                  <br/>Useful addresses
                </Typography>
                <Typography variant="body2" >
                  Turing monsters:
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body3" >
                    0xce458FC7cfC322cDd65eC77Cf7B6410002E2D793
                  </Typography>
                  <Copy value={'0xce458FC7cfC322cDd65eC77Cf7B6410002E2D793'} light={false} />
                </Box>
              </Box>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  Contract Address
                </Typography>

                <Input
                  placeholder='Address 0x...'
                  value={contractAddress}
                  onChange={this.handleInputAddress}
                // paste
                />

                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  Token ID
                </Typography>
                <Input
                  placeholder='TokenID - e.g. 3'
                  value={tokenID}
                  onChange={this.handleInputID}
                // paste
                />
              </Box>
              <Button
                type="primary"
                variant="contained"
                fullWidth={true}
                onClick={(i) => { this.addNFT() }}
                disabled={loading || contractAddress === '' || tokenID === ''}
                sx={{ flex: 1, marginTop: '20px', marginBottom: '20px' }}
              >
                {loading ? 'Adding NFT...' : 'Add NFT'}
              </Button>
            </S.NFTFormContent>
          </S.NFTActionContent>
          <S.NFTListContainer  data-empty={Object.keys(list).length === 0}>
            {Object.keys(list).length === 0 ?
              <Box>
                <Typography variant="body2"  sx={{opacity: 0.65}} >
                  Please enter the contract address and TokenID to display an NFT.<br/>
                  If you don't know your TokenID, you can look it up in the blockexplorer.<br/>
                  It's shown for mint or transfer events.
                </Typography>
              </Box>
              : <Grid
                container
                direction="row"
                item
                sx={{ gap: '10px' }}
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
              </Grid>}
          </S.NFTListContainer>
        </S.NFTPageContainer>
    )}
  }
}

const mapStateToProps = state => ({
  nft: state.nft,
  loading: state.loading,
  setup: state.setup,
})

export default connect(mapStateToProps)(Nft)
