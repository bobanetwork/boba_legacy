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


class listNFT extends React.Component {

  constructor(props) {

    super(props);

    const {
      name,
      symbol,
      address,
      UUID,
      URL,
      meta
    } = this.props

    this.state = {
      name,
      symbol,
      address,
      UUID,
      URL,
      meta,
      isFlipped: false,
    }
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    this.setState(prevState => ({ isFlipped: !prevState.isFlipped }));
  }

  async handleRemove() {
    this.props.dispatch(removeNFT(this.state.UUID))
  }


  componentDidUpdate(prevState) {

    const {
      name, symbol, address,
      UUID, URL, meta
    } = this.props;

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

  }

  render() {

    const {
      // name,
      // symbol,
      URL,
      isFlipped,
      meta
    } = this.state

    let imgSource = URL
    if (URL.substring(0, 4) === '<svg') {
      imgSource = `data:image/svg+xml;utf8,${URL}`
    }

    return (
      <ReactCardFlip isFlipped={isFlipped} flipDirection="vertical" >
        <S.ListNFTItem item onClick={this.handleClick}>

          <img
            src={imgSource}
            alt="NFT URI"
            width={'100%'}
          />
          <div
            style={{
              padding: '10px 5px'
            }}
            className={styles.topContainer}>
            <Typography variant="body1">
              {/* {name} ({symbol}) */}
              {meta.name}
            </Typography>
          </div>
        </S.ListNFTItem>
        <S.ListNFTItem active={'true'} item onClick={this.handleClick}>
          <div className={styles.topContainer}>
            <Typography variant="body1">
            {meta.name}
            </Typography>
            <S.DividerLine />
          </div>

          <div className={styles.topContainer}>
            <div className={styles.Table2}>
              {meta.collection !== '' &&
                <Typography variant="body3">
                  Collection:
                    {meta.collection}
                </Typography>
              }
              {meta.rank !== '' &&
                <Typography variant="body3">
                  Rank:
                    {meta.rank}
                </Typography>
              }
              {meta.rarity_score !== '' &&
                <Typography variant="body3">
                  Rarity:
                    {meta.rarity_score}
                </Typography>
              }
              {(meta.attributes || []).map((attr, index) => {
                return (<Typography variant="body3" key={index}>{attr.trait_type}:
                    {attr.value}
                </Typography>)
              })}
              {(meta.traits || []).map((attr, index) => {
                return (<Typography variant="body3" key={index}>
                  {attr.trait_type}:
                    {attr.trait_value}
                </Typography>)
              })}
            </div>
            <S.DividerLine />
            <Button
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                this.handleRemove();
              }}
              size="small"
            >
              Remove
            </Button>
          </div>
        </S.ListNFTItem>
      </ReactCardFlip>

    )
  }
}

const mapStateToProps = state => ({
  nft: state.nft
})

export default connect(mapStateToProps)(listNFT)
