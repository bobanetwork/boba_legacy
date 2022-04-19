import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import ListNFT from 'components/listNFT/listNFT'
import * as S from './Monster.styles'

import { Box, Typography, Grid } from '@mui/material'

import PageTitle from 'components/pageTitle/PageTitle'
import networkService from 'services/networkService'
import BobaGlassIcon from 'components/icons/BobaGlassIcon'
import Connect from 'containers/connect/Connect'

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
      netLayer,
      monsterInfo,
      accountEnabled
    } = this.state

    let tokenIDverified = null

    //figure out which monster type we are dealing with
    let monsterType = 'Monster'

    // since it uses FIND, this code will only find one of your monsters
    // FIX ME to show the 'top' monster for this wallet if you have several 
    // in which case you are lucky. 
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

    return (

      <S.StakePageContainer>

        <PageTitle title={'MonsterVerse'} />

        <Connect 
          userPrompt={'Please connect to Boba'}
          accountEnabled={accountEnabled}
          connectToBoba={true}
          layer={netLayer}
        />

        <Grid container spacing={1} sx={{ my: 2 }}>

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
                    You have one or more Turing Monsters, but you have not added them to your NFT page (<strong>Wallet>NFT>Add NFT</strong>). 
                    Please add them to join the MonsterVerse.
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
                      small={"true"}
                    />)
                  } else {
                    return null
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
      </Grid>
    </S.StakePageContainer>

    )
  }
}

const mapStateToProps = state => ({
  nft: state.nft,
  loading: state.loading,
  setup: state.setup,
})

export default connect(mapStateToProps)(Monster)
