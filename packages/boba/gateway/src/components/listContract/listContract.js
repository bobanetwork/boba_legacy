import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'
import Button from 'components/button/Button'
import { Typography } from '@material-ui/core'
import * as S from "./ListContract.styles"
import { removeNFTContract } from 'actions/nftAction'

class ListContract extends React.Component {

  constructor(props) {

    super(props)

    const {
      contract,
    } = this.props

    this.state = {
      contract
    }

  }

  componentDidUpdate(prevState) {

    const { contract } = this.props

    if (!isEqual(prevState.contract, contract)) {
      this.setState({ contract })
    }

  }

  async handleRemove() {
    this.props.dispatch(removeNFTContract(this.state.contract.address))
  }

  render() {

    const {
      contract
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
                    <Typography variant="overline" style={{lineHeight: '1em'}}>{contract.name}</Typography>
                    <Typography variant="overline" style={{lineHeight: '1em', color: 'rgba(255, 255, 255, 0.3)'}}>{contract.address}</Typography>
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
