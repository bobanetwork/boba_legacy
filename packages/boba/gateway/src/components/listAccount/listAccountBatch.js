import React from 'react'
import { connect } from 'react-redux'
import { isEqual } from 'lodash'

import { openModal } from 'actions/uiAction'
import Button from 'components/button/Button'

import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { Box, Typography, Fade } from '@material-ui/core'
import * as S from './ListAccount.styles'

import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import WalletPicker from 'components/walletpicker/WalletPicker'
import { getCoinImage } from 'util/coinImage'

class ListAccountBatch extends React.Component {

  constructor(props) {

    super(props)

    const {
      token,
      networkLayer,
      disabled,
      loading,
      accountEnabled,
    } = this.props

    this.state = {
      token,
      dropDownBox: false,
      networkLayer,
      disabled,
      loading,
      accountEnabled,
    }

  }

  componentDidUpdate(prevState) {

    const {
      token,
      networkLayer,
      disabled,
      loading
    } = this.props

    if (!isEqual(prevState.token, token)) {
      this.setState({ token })
    }

    if (!isEqual(prevState.networkLayer, networkLayer)) {
      this.setState({ networkLayer })
    }

    if (!isEqual(prevState.disabled, disabled)) {
      this.setState({ disabled })
    }

    if (!isEqual(prevState.loading, loading)) {
      this.setState({ loading })
    }

  }

  handleModalClick(modalName, token, fast) {
    this.props.dispatch(openModal(modalName, token, fast))
  }

  render() {

    const {
      token,
      dropDownBox,
      networkLayer,
      accountEnabled,
      disabled
    } = this.state

    const logoList = ['ETH', 'BOBA', 'OMG', 'USDC', 'USDT', 'DAI']

    return (
      <>
        <S.Content>
            <S.TableBody disabled={true}>

              <S.TableCell sx={{gap: "10px", justifyContent: "flex-start"}}>
                {logoList.map((token, index) => {
                    return <img key={index} src={getCoinImage(token)} alt="logo" width={42} height={42} style={index !== 0 ? {marginLeft: -20}:{}}/>
                  })
                }
              </S.TableCell>

              <S.TableCell sx={{justifyContent: "flex-start"}}>
              </S.TableCell>

              {(networkLayer === 'L2' || !accountEnabled) && 
                <S.TableCell
                  onClick={() => {
                    this.setState({
                      dropDownBox: !dropDownBox,
                      dropDownBoxInit: false
                    })
                  }}
                  sx={{cursor: "pointer", gap: "5px", justifyContent: "flex-end"}}
                >
                  <S.TextTableCell enabled={`${accountEnabled}`} variant="body2" component="div">
                    Batch Bridge
                  </S.TextTableCell>
                  <Box sx={{display: "flex", opacity: !accountEnabled ? "0.4" : "1.0", transform: dropDownBox ? "rotate(-180deg)" : ""}}>
                    <ExpandMoreIcon sx={{width: "12px"}}/>
                  </Box>
                </S.TableCell>
              }

              {networkLayer === 'L1' && accountEnabled && 
                <S.TableCell
                  sx={{cursor: "pointer", gap: "5px", justifyContent: "flex-end"}}
                >
                <Button
                  onClick={()=>{this.handleModalClick('depositBatchModal', token, true)}}
                  color='primary'
                  disabled={disabled}
                  variant="contained"
                  tooltip="A swap-based bridge to Boba. This option is only available if the pool balance is sufficient."
                  fullWidth
                >
                  Batch Bridge to Boba
                </Button>
                </S.TableCell>
              }

            </S.TableBody>

          {/*********************************************/
          /**************  Drop Down Box ****************/
          /**********************************************/
          }

          {dropDownBox ? (
          <Fade in={dropDownBox}>
            <S.DropdownWrapper>
              {networkLayer === 'L2' && accountEnabled && 
                <S.AccountAlertBox>
                  <Box sx={{flex: 1}}>
                    <Typography variant="body2" component="p" >
                      You are on L2. To use the L1 Batch Bridge, switch to Mainnet
                    </Typography>
                   </Box>
                   <Box sx={{ textAlign: 'center'}}>
                      <LayerSwitcher isButton={true}/>
                   </Box>
                </S.AccountAlertBox>
              }

              {!accountEnabled &&
                <S.AccountAlertBox>
                  <Box sx={{ flex: 1 }} >
                    <Typography variant="body2" component="p" >
                      Connect to MetaMask to use the Batch Bridge
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center'}}>
                    <WalletPicker />
                  </Box>
                </S.AccountAlertBox>
              }

            </S.DropdownWrapper>
          </Fade>
          ) : null}
        </S.Content>
      </>
    )
  }
}

const mapStateToProps = state => ({ })
export default connect(mapStateToProps)(ListAccountBatch)
