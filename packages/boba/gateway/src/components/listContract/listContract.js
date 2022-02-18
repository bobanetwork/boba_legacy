import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'
import Button from 'components/button/Button'
import { Typography } from '@mui/material'
import * as S from "./ListContract.styles"
import { removeNFT } from 'actions/nftAction'

class ListContract extends React.Component {

  constructor(props) {

    super(props)

    const {
      address,
      UUID,
      symbol,
      tokenID,
    } = this.props

    this.state = {
      address,
      UUID,
      symbol,
      tokenID,
    }

  }

  componentDidUpdate(prevState) {

    const { symbol, address, UUID, tokenID } = this.props

    if (!isEqual(prevState.UUID, UUID)) {
      this.setState({ UUID })
    }

    if (!isEqual(prevState.address, address)) {
      this.setState({ address })
    }

    if (!isEqual(prevState.symbol, symbol)) {
      this.setState({ symbol })
    }

    if (!isEqual(prevState.tokenID, tokenID)) {
      this.setState({ tokenID })
    }

  }

  async handleRemove() {
    this.props.dispatch(removeNFT(this.state.UUID))
  }

  render() {

    const {
      address,
      symbol,
      tokenID
    } = this.state

    return (
      <S.Wrapper>

          <S.GridContainer 
            container
            spacing={2}
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
          >

              <S.GridItemTag item
                xs={10}
                md={10}
                style={{
                  justifyContent: 'flex-start',
                  alignItems:'center',
                }}
              >
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems:'center'}}>
                  <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems:'flex-start', paddingLeft: '8px'}}>
                    <Typography variant="overline" style={{lineHeight: '1em'}}>{symbol} TokenID: {tokenID}</Typography>
                    <Typography variant="overline" style={{lineHeight: '1em', color: 'rgba(255, 255, 255, 0.3)'}}>{address}</Typography>
                  </div>
                </div>
              </S.GridItemTag>

              <S.GridItemTag item
                xs={2}
                md={2}
              >
                <Button
                  variant="contained"
                  disabled={false}
                  onClick={()=>{this.handleRemove()}}
                  sx={{flex: 1}}
                >
                  Remove
                </Button>
              </S.GridItemTag>

          </S.GridContainer>
 
      </S.Wrapper>
    )
  }
}

const mapStateToProps = state => ({
})

export default connect(mapStateToProps)(ListContract)
