import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import ListNFT from 'components/listNFT/listNFT'
import * as S from './Monster.styles'

import { Box, Grid, Typography } from '@mui/material'

import Input from 'components/input/Input'
import Button from 'components/button/Button'

import networkService from 'services/networkService'
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import AlertIcon from 'components/icons/AlertIcon'
import BobaGlassIcon from 'components/icons/BobaGlassIcon'
import Copy from 'components/copy/Copy'
import WalletPicker from 'components/walletpicker/WalletPicker'

import truncate from 'truncate-middle'

class Monster extends React.Component {

  constructor(props) {

    super(props)

    const {
      list,
      monsterNumber,
      monsterInfo
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
      netLayer
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
      monsterInfo,
      monsterNumber
    } = this.state

    let tokenIDverified = null

    //figure out which monster type we are dealing with
    let monsterType = 'Monster'
    if(monsterInfo.length > 0) {
      tokenIDverified = monsterInfo.find(e => e.tokenID)
      if(typeof(tokenIDverified) !== 'undefined') {
        tokenIDverified = Number(monsterInfo.find(e => e.tokenID).tokenID)
      } else {
        tokenIDverified = null
      }

      const type = monsterInfo.find(e => e.monsterType).monsterType

      if(type === 'crowned') {
        monsterType = 'Crowned Monster'
      } 
      else if (type === 'wizard') {
        monsterType = 'Wizard Monster'
      }
      else if (type === 'crowned wizard') {
        monsterType = 'Crowned Wizard'
      }
    }

    if (!netLayer) {

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
                  Not connected. To access the MonsterVerse, CONNECT to Boba
                </S.AlertText>
              </S.AlertInfo>
              <WalletPicker label="Connect to Boba"/>
            </S.LayerAlert>
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
                  You are on Ethereum. To access the MonsterVerse, SWITCH to Boba
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
                    MonsterVerse
                  </Typography>
                </Box>
                <S.DividerLine />
                <Typography variant="body1" >
                  <br/>Welcome, esteemed {monsterType} {tokenIDverified}
                </Typography>
                {tokenIDverified === null && 
                  <Typography variant="body3" sx={{ opacity: 0.65 }}>
                    <br/>You have one or more Turing Monsters, but you have not added them to your NFT page (Wallet>NFT>Add NFT). Please add them to join the MonsterVerse.
                  </Typography>
                }
              </Box>
              {Object.keys(list).map((v, i) => {
                  const key_UUID = `nft_` + i
                  if(tokenIDverified === Number(list[v].tokenID)) {
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
                  }
                })
              }
            </S.NFTFormContent>
          </S.NFTActionContent>
          <S.NFTListContainer>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                paddingTop: '10px'
              }}>
                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                  Meetups
                </Typography>

                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  Turing monster holders will be invited to meetups in different regions, such as Amsterdam, Dubai, and Hong Kong. 
                  If you would like to host a meetup, or would like to propose one in your city, let us know - a signup system will 
                  go live later in April. 
                </Typography>

                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                  First look: Experimental Features
                </Typography>

                <Typography variant="body3" sx={{ opacity: 0.65 }}>
                  Here is where we will showcase new features and projects, for you to see first.
                </Typography>

              </Box>
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

export default connect(mapStateToProps)(Monster)
