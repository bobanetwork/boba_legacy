/* eslint-disable quotes */
/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import { Typography } from '@mui/material'
import { isEqual } from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import ReactCardFlip from 'react-card-flip'
import * as styles from './listNFT.module.scss'
import * as S from './listNFT.styles'
import { removeNFT } from 'actions/nftAction'
import Button from 'components/button/Button'
import { openModal } from 'actions/uiAction'

class listNFT extends React.Component {

  constructor(props) {

    super(props)

    const {
      name,
      symbol,
      address,
      UUID,
      URL,
      meta,
      tokenID
    } = this.props

    this.state = {
      name,
      symbol,
      address,
      UUID,
      URL,
      meta,
      tokenID,
      isFlipped: false,
    }
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    this.setState(prevState => ({ isFlipped: !prevState.isFlipped }));
  }

  async handleTransfer() {

    const token ={
      address: this.state.address,
      tokenID: this.state.tokenID,
    }

    console.log("setting nft details:", token)

    this.props.dispatch(openModal('transferNFTModal', token))
  }

  async handleRemove() {
    this.props.dispatch(removeNFT(this.state.UUID))
  }


  componentDidUpdate(prevState) {

    const {
      name, symbol, address,
      UUID, URL, meta, tokenID
    } = this.props

    if (!isEqual(prevState.name, name)) {
      this.setState({ name })
    }

    if (!isEqual(prevState.symbol, symbol)) {
      this.setState({ symbol })
    }

    if (!isEqual(prevState.address, address)) {
      this.setState({ address })
    }

    if (!isEqual(prevState.UUID, UUID)) {
      this.setState({ UUID })
    }

    if (!isEqual(prevState.URL, URL)) {
      this.setState({ URL })
    }

    if (!isEqual(prevState.meta, meta)) {
      this.setState({ meta })
    }

    if (!isEqual(prevState.tokenID, tokenID)) {
      this.setState({ tokenID })
    }

  }

  render() {

    const {
      symbol,
      URL,
      isFlipped,
      meta,
      tokenID
    } = this.state

    //console.log("meta:", meta)
    //console.log("URL:", URL)

    let rarity = ''
    if(meta && meta.hasOwnProperty("attributes")) {
      if(meta.attributes.length === 5){
        if(meta.attributes[3].trait_type === 'Top') {
          rarity = 'Basic'
          console.log(meta.attributes[3].value)
          console.log(meta.attributes[4].value)
          if(meta.attributes[3].value === 'crown' && meta.attributes[4].value === 'wizzard') {
            rarity = 'Rarest (2/1000)' // 1000 * 5/256 * 20/256
          } else if (meta.attributes[3].value === 'crown') {
            rarity = 'Very rare (20/1000)' // 1000 * 5/256
          } else if (meta.attributes[4].value === 'wizzard') {
            rarity = 'Rare (78/1000)' // 1000 * 20/256
          }
        }
      }
    }

    let imgSource = URL
    if (URL.substring(0, 4) === '<svg') {
      imgSource = `data:image/svg+xml;utf8,${URL}`
    }

    return (
      <ReactCardFlip isFlipped={isFlipped} flipDirection="vertical" >
        <S.ListNFTItem 
          item 
          onClick={this.handleClick}
        >
          <img
            src={imgSource}
            alt="NFT URI"
            width={'100%'}
          />
          <div
            style={{padding: '10px 5px'}}
            className={styles.topContainer}>
            <Typography variant="body1">
              {meta.name}{' '}({symbol})
            </Typography>
            <Typography variant="body3">TokenID:{' '}{tokenID}</Typography>
          </div>
        </S.ListNFTItem>
        <S.ListNFTItem 
          active={'true'} 
          item 
          onClick={this.handleClick}
        >
          {meta.collection !== ''   && <Typography variant="body3">Collection:{' '}{meta.collection}</Typography>}
          {meta.rank !== ''         && <Typography variant="body3">Rank:{' '}{meta.rank}</Typography>}
          {meta.rarity_score !== '' && <Typography variant="body3">Rarity:{' '}{meta.rarity_score}</Typography>}
          {rarity !== ''            && <Typography variant="body3">Rarity:{' '}{rarity}</Typography>}
          {(meta.attributes || []).map((attr, index) => {
            return (
              <Typography variant="body3" key={index}>
                {attr.trait_type}:{' '}{attr.value}
              </Typography>
            )
          })}
          {(meta.traits || []).map((attr, index) => {
            return (
              <Typography variant="body3" key={index}>
                {attr.trait_type}:{' '}{attr.trait_value}
              </Typography>
            )
          })}
          <Button
            type="primary"
            variant="contained"
            style={{marginTop: '10px', marginBottom: '10px'}}
            onClick={(e) => {this.handleTransfer()}}
            size="small"
          >
            Transfer
          </Button>
          <Button
            type="primary"
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              this.handleRemove();
            }}
            size="small"
          >
            Remove
          </Button>
        </S.ListNFTItem>
      </ReactCardFlip>
    )
  }
}

const mapStateToProps = state => ({
  nft: state.nft
})

export default connect(mapStateToProps)(listNFT)
