import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import ListNFT from 'components/listNFT/listNFT'
import * as S from './Nft.styles'
import * as G from '../../Global.styles'

import { Box, Grid, Typography } from '@mui/material'

import Input from 'components/input/Input'
import Button from 'components/button/Button'

import networkService from 'services/networkService'
import BobaGlassIcon from 'components/icons/BobaGlassIcon'
import Connect from 'containers/connect/Connect'

class Nft extends React.Component {

  constructor(props) {

    super(props)

    const {
      list,
      monsterNumber,
      monsterInfo
    } = this.props.nft

    const {
      accountEnabled,
      netLayer,
      network,
      walletAddress
    } = this.props.setup

    this.state = {
      list,
      contractAddress: '',
      tokenID: '',
      loading: this.props.loading[ 'NFT/ADD' ],
      accountEnabled,
      netLayer,
      network,
      walletAddress,
      monsterNumber,
      monsterInfo
    }

  }

  componentDidUpdate(prevState) {

    const {
      list,
      monsterNumber,
      monsterInfo
    } = this.props.nft

    const {
      accountEnabled,
      netLayer,
      network,
      walletAddress
    } = this.props.setup

    if (!isEqual(prevState.nft.list, list)) {
      this.setState({ list })
    }

    if (!isEqual(prevState.nft.monsterNumber, monsterNumber)) {
      this.setState({ monsterNumber })
    }

    if (!isEqual(prevState.nft.monsterInfo, monsterInfo)) {
      this.setState({ monsterInfo })
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

    if (!isEqual(prevState.setup.network, network)) {
      this.setState({ network })
    }

    if (!isEqual(prevState.setup.walletAddress, walletAddress)) {
      this.setState({ walletAddress })
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

  async fetchMyMonsters() {
    networkService.fetchMyMonsters()
  }

  render() {

    const {
      list,
      contractAddress,
      tokenID,
      loading,
      netLayer,
      network,
      walletAddress,
      accountEnabled,
    } = this.state

    if (!netLayer) {

      return (
        <G.Container>
          <G.ContentEmpty>
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
          </G.ContentEmpty>
        </G.Container>
      )

    } else if (netLayer === 'L1') {
      return (
        <G.Container>
          <G.ContentEmpty>
            <Connect 
              userPrompt={'You are on Ethereum. To use Boba NFTs, connect to Boba'}
              accountEnabled={accountEnabled}
              connectToBoba={true}
              layer={netLayer}
            />
          </G.ContentEmpty>
        </G.Container>
      )
    }

    else {

      return (
        <G.Container>
          <S.NFTActionContent sx={{ boxShadow: 1 }}>
            <S.NFTFormContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <BobaGlassIcon />
                  <Typography variant="body1" >
                    Add NFT
                  </Typography>
                </Box>
                <G.DividerLine />
                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  <br/>Monsters can be autoadded to your wallet
                </Typography>
                <Button
                  type="primary"
                  variant="outlined"
                  fullWidth={true}
                  onClick={(i) => { this.fetchMyMonsters() }}
                  sx={{ flex: 1, marginTop: '20px' }}
                >
                  Fetch My Monsters
                </Button>
              </Box>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <G.DividerLine />
                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  Other NFTs must be added manually
                </Typography>
                <Input
                  placeholder='Contract address 0x...'
                  value={contractAddress}
                  onChange={this.handleInputAddress}
                // paste
                />
                <Input
                  placeholder='TokenID - e.g. 3'
                  value={tokenID}
                  onChange={this.handleInputID}
                // paste
                />
                <Button
                  type="primary"
                  variant="outlined"
                  fullWidth={true}
                  onClick={(i) => { this.addNFT() }}
                  disabled={loading || contractAddress === '' || tokenID === ''}
                  sx={{ flex: 1 }}
                >
                  {loading ? 'Adding NFT...' : 'Add NFT'}
                </Button>
              </Box>
            </S.NFTFormContent>
          </S.NFTActionContent>
          <S.NFTListContainer data-empty={Object.keys(list).length === 0} sx={{ boxShadow: 1 }}>
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
                  if(list[v].hasOwnProperty('account')) {
                    // new storage format - check for chain
                    if(list[v].network !== network) {
                      //console.log("NFT not on this network")
                      return null
                    }
                    if(list[v].layer !== netLayer) {
                      //console.log("NFT not on this layer")
                      return null
                    }
                    if(walletAddress && (list[v].account.toLowerCase() !== walletAddress.toLowerCase())) {
                      //console.log("NFT not owned by this wallet")
                      return null
                    }
                  }
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
        </G.Container>
    )}
  }
}

const mapStateToProps = state => ({
  nft: state.nft,
  loading: state.loading,
  setup: state.setup,
})

export default connect(mapStateToProps)(Nft)
