import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import ListNFT from 'components/listNFT/listNFT'

import * as S from './Nft.styles'
// import * as styles from './Nft.module.scss'

import { Box, Grid, Typography } from '@mui/material'

import Input from 'components/input/Input'
import Button from 'components/button/Button'

import networkService from 'services/networkService'

// import ListContract from 'components/listContract/listContract'

import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import AlertIcon from 'components/icons/AlertIcon'
import WalletPicker from 'components/walletpicker/WalletPicker'
import BobaGlassIcon from 'components/icons/BobaGlassIcon'

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
      loading: this.props.loading[ 'NFT/ADD' ]
    }

  }

  componentDidUpdate(prevState) {

    const { list } = this.props.nft

    if (!isEqual(prevState.nft.list, list)) {
      this.setState({ list })
    }

    if (!isEqual(prevState.loading[ 'NFT/ADD' ], this.props.loading[ 'NFT/ADD' ])) {
      this.setState({ loading: this.props.loading[ 'NFT/ADD' ] })
      if (this.props.loading[ 'NFT/ADD' ]) {
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

    if (layer === 'L1') {
      return <S.LayerAlert>
        <S.AlertInfo>
          <AlertIcon />
          <S.AlertText
            variant="body2"
            component="p"
            align="center"
          >
            You are on Ethereum Mainnet. To use Boba NFTs, SWITCH to Boba
          </S.AlertText>
        </S.AlertInfo>
        <LayerSwitcher isButton={true} />
      </S.LayerAlert>
    }

    if (!layer) {
      return <S.LayerAlert>
        <S.AlertInfo>
          <AlertIcon />
          <S.AlertText
            variant="body2"
            component="p"
          >
            Connect your wallet to see your NFTs
          </S.AlertText>
        </S.AlertInfo>
        <WalletPicker />
      </S.LayerAlert>
    }

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
                  Token Id
                </Typography>
                <Input
                  placeholder='tokenID - e.g. 3'
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
            {/* <S.NFTFormContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ mb: 2, px: 1, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" >
                    Guess you need
                  </Typography>
                </Box>
                <S.DividerLine />
              </Box>
            </S.NFTFormContent> */}
          </S.NFTActionContent>
          <S.NFTListContainer dataempty={Object.keys(list).length === 0}>
            {Object.keys(list).length === 0 ?
              <Box>
                  <Typography variant="body2"  sx={{opacity: 0.65}} >
                    Please enter the contract address and tokenID to add NFT for display. 
                  </Typography>  
                  <Typography variant="body2"  sx={{opacity: 0.65}} >
                    If you don't know your tokenID, you can look it up in blockexplorer. It's shown for mint or transfer events.
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
                      name={list[ v ].name}
                      symbol={list[ v ].symbol}
                      address={list[ v ].address}
                      UUID={list[ v ].UUID}
                      URL={list[ v ].url}
                      meta={list[ v ].meta}
                      tokenID={list[ v ].tokenID}
                    />)
                })
                }
              </Grid>}
          </S.NFTListContainer>
        </S.NFTPageContainer>
    )
  }
}

const mapStateToProps = state => ({
  nft: state.nft,
  loading: state.loading
})

export default connect(mapStateToProps)(Nft)