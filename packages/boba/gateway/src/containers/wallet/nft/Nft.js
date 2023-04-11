import React from 'react'
import { connect } from 'react-redux'
<<<<<<< HEAD
import isEqual from 'lodash/isEqual'
=======
import { isEqual } from 'util/lodash';
>>>>>>> 19f2eb6385e0e61b0256bf25b05495fb19a83274

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

    const { list } = this.props.nft

    const { accountEnabled, netLayer, network, walletAddress } =
      this.props.setup

    this.state = {
      list,
      contractAddress: '',
      tokenID: '',
      loading: this.props.loading['NFT/ADD'],
      accountEnabled,
      netLayer,
      network,
      walletAddress,
    }
  }

  componentDidUpdate(prevState) {
    const { list } = this.props.nft

    const { accountEnabled, netLayer, network, walletAddress } =
      this.props.setup

    if (!isEqual(prevState.nft.list, list)) {
      this.setState({ list })
    }

    if (!isEqual(prevState.loading['NFT/ADD'], this.props.loading['NFT/ADD'])) {
      this.setState({ loading: this.props.loading['NFT/ADD'] })
      if (this.props.loading['NFT/ADD']) {
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

  handleInputAddress = (event) => {
    this.setState({ contractAddress: event.target.value })
  }

  handleInputID = (event) => {
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
                alignItems: 'center',
              }}
            >
              <Connect accountEnabled={accountEnabled} />
            </Box>
          </G.ContentEmpty>
        </G.Container>
      )
    } else if (netLayer === 'L1') {
      return (
        <G.Container>
          <G.ContentEmpty>
            <Connect
              userPrompt={
                'You are on Ethereum. To use Boba NFTs, connect to Boba'
              }
              accountEnabled={accountEnabled}
              connectToBoba={true}
              layer={netLayer}
            />
          </G.ContentEmpty>
        </G.Container>
      )
    } else {
      return (
        <G.Container>
          <S.NFTActionContent sx={{ boxShadow: 1 }}>
            <S.NFTFormContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <BobaGlassIcon />
                  <Typography variant="body1">Add NFT</Typography>
                </Box>
                <G.DividerLine />
                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  <br />
                  Monsters can be autoadded to your wallet
                </Typography>
                <Button
                  type="primary"
                  variant="outlined"
                  fullWidth={true}
                  onClick={(i) => {
                    this.fetchMyMonsters()
                  }}
                  sx={{ flex: 1, marginTop: '20px' }}
                >
                  Fetch My Monsters
                </Button>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <G.DividerLine />
                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  Other NFTs must be added manually
                </Typography>
                <Input
                  placeholder="Contract address 0x..."
                  value={contractAddress}
                  onChange={this.handleInputAddress}
                  // paste
                />
                <Input
                  placeholder="TokenID - e.g. 3"
                  value={tokenID}
                  onChange={this.handleInputID}
                  // paste
                />
                <Button
                  type="primary"
                  variant="outlined"
                  fullWidth={true}
                  onClick={(i) => {
                    this.addNFT()
                  }}
                  disabled={loading || contractAddress === '' || tokenID === ''}
                  sx={{ flex: 1 }}
                >
                  {loading ? 'Adding NFT...' : 'Add NFT'}
                </Button>
              </Box>
            </S.NFTFormContent>
          </S.NFTActionContent>
          <S.NFTListContainer
            data-empty={Object.keys(list).length === 0}
            sx={{ boxShadow: 1 }}
          >
            {Object.keys(list).length === 0 ? (
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.65 }}>
                  Please enter the contract address and TokenID to display an
                  NFT.
                  <br />
                  If you don't know your TokenID, you can look it up in the
                  blockexplorer.
                  <br />
                  It's shown for mint or transfer events.
                </Typography>
              </Box>
            ) : (
              <Grid container direction="row" item sx={{ gap: '10px' }}>
                {Object.keys(list).map((v, i) => {
                  const key_UUID = `nft_` + i
                  if (list[v].hasOwnProperty('account')) {
                    // new storage format - check for chain
                    if (list[v].network !== network) {
                      //console.log("NFT not on this network")
                      return null
                    }
                    if (list[v].layer !== netLayer) {
                      //console.log("NFT not on this layer")
                      return null
                    }
                    if (
                      walletAddress &&
                      list[v].account.toLowerCase() !==
                        walletAddress.toLowerCase()
                    ) {
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
                    />
                  )
                })}
              </Grid>
            )}
          </S.NFTListContainer>
        </G.Container>
      )
    }
  }
}

const mapStateToProps = (state) => ({
  nft: state.nft,
  loading: state.loading,
  setup: state.setup,
})

export default connect(mapStateToProps)(Nft)
