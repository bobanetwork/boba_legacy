import React from 'react'
import { connect } from 'react-redux'
import { logAmount } from 'util/amountConvert'
import { isEqual } from 'lodash'

import { openModal } from 'actions/uiAction'
import Button from 'components/button/Button'

import { settle_v0 } from 'actions/networkAction'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { Box, Typography, Link, Fade, Slider } from '@mui/material'
import * as S from './ListAccount.styles'

import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher'
import { getCoinImage } from 'util/coinImage'

class ListAccount extends React.Component {

  constructor(props) {

    super(props)
    
    const { 
      token, 
      chain, 
      networkLayer, 
      disabled,
      loading 
    } = this.props
    
    this.state = {
      token,
      chain,
      dropDownBox: false,
      networkLayer,
      disabled,
      loading,
      sliderValue: 55,
    }

  }

  componentDidUpdate(prevState) {

    const { 
      token, 
      chain, 
      networkLayer, 
      disabled,
      loading 
    } = this.props

    if (!isEqual(prevState.token, token)) {
      this.setState({ token })
    }

    if (!isEqual(prevState.chain, chain)) {
      this.setState({ chain })
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

  handleSliderChange = (e) => {
    this.setState({sliderValue: e.target.value})
  }

  settle_v0() {
    this.props.dispatch(settle_v0())
    // if ( token.address && recipient )
    // {
    //   try {
    //     console.log("Amount to transfer:", value_Wei_String)
    //     const transferResponseGood = await dispatch(
    //       transfer(recipient, value_Wei_String, token.address)
    //     )
    //     if (transferResponseGood) {
    //       dispatch(openAlert('Transaction submitted'))
    //     }
    //     handleClose()
    //   } catch (err) {
    //     //guess not really?
    //   }
    // }
  }

  render() {

    const {
      token,
      chain,
      dropDownBox,
      networkLayer,
      disabled,
      sliderValue
    } = this.state

    const enabled = (networkLayer === chain) ? true : false
    const logo = getCoinImage(token.symbol)

    const amount = token.symbol === 'ETH' ? 
      Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(undefined, {minimumFractionDigits: 3,maximumFractionDigits:3}) :
      Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(undefined, {minimumFractionDigits: 2,maximumFractionDigits:2})

    const WAGMI_v0 = 1 + (sliderValue / 100)
    const TVL = Number(300 + (sliderValue / 100) * 700)

    const marks = [
      {
        value: 30,
        label: '500M',
      },
      {
        value: 50,
        label: '650M',
      },
      {
        value: 70,
        label: '800M',
      },
    ];

    return (
      <>
        <S.Content>
            <S.TableBody disabled={true}>

              <S.TableCell sx={{gap: "10px", justifyContent: "flex-start"}}>
                <img src={logo} alt="logo" width={42} height={42} />

                <S.TextTableCell enabled={`${enabled}`} variant="body2" component="div">
                  {token.symbol}
                </S.TextTableCell>
              </S.TableCell>

              <S.TableCell sx={{justifyContent: "flex-start"}}>
                <S.TextTableCell 
                  enabled={`${enabled}`} 
                  variant="body2" 
                  component="div" 
                  sx={{fontWeight:'700'}}
                >
                  {amount}
                </S.TextTableCell>
              </S.TableCell>

              <S.TableCell
                onClick={() => {
                  this.setState({
                    dropDownBox: !dropDownBox,
                    dropDownBoxInit: false
                  })
                }}
                sx={{cursor: "pointer", gap: "5px", justifyContent: "flex-end"}}
              >
                {chain === 'L1' &&
                  <S.TextTableCell enabled={`${enabled}`} variant="body2" component="div">
                    Bridge
                  </S.TextTableCell>
                }
                {chain === 'L2' && token.symbol !== 'xBOBA' && token.symbol !== 'WAGMIv0' &&
                  <S.TextTableCell enabled={`${enabled}`} variant="body2" component="div">
                    Bridge/Transfer
                  </S.TextTableCell>
                }
                {chain === 'L2' && token.symbol === 'WAGMIv0' &&
                  <S.TextTableCell enabled={`${enabled}`} variant="body2" component="div">
                    Settle
                  </S.TextTableCell>
                }
                {token.symbol !== 'xBOBA' &&
                  <Box sx={{display: "flex", opacity: !enabled ? "0.4" : "1.0", transform: dropDownBox ? "rotate(-180deg)" : ""}}>
                    <ExpandMoreIcon sx={{width: "12px"}}/>
                  </Box>
                }
              </S.TableCell>
            </S.TableBody>

          {/*********************************************/
          /**************  Drop Down Box ****************/
          /**********************************************/
          }

          {dropDownBox ? (
          <Fade in={dropDownBox}>
            <S.DropdownWrapper>

              {!enabled && chain === 'L1' &&
                <S.AccountAlertBox>
                  <Box
                      sx={{
                        flex: 1,
                      }}
                    >
                      <Typography variant="body2" component="p" >
                        Wrong Network. Please connect to Boba.
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center'}}>
                      <LayerSwitcher isButton={true} />
                    </Box>
                </S.AccountAlertBox>
              }

              {!enabled && chain === 'L2' &&
                <S.AccountAlertBox>
                  <Box
                       sx={{
                         flex: 1,
                       }}
                     >
                       <Typography variant="body2" component="p" >
                         Wrong network. Please connect to Ethereum.
                       </Typography>
                     </Box>
                     <Box sx={{ textAlign: 'center'}}>
                       <LayerSwitcher isButton={true} />
                     </Box>
                </S.AccountAlertBox>
              }

              {enabled && chain === 'L1' &&
              <>
                <Button
                  onClick={()=>{this.handleModalClick('depositModal', token, false)}}
                  color='neutral'
                  variant="outlined"
                  disabled={disabled}
                  tooltip="Classic Bridge to Boba L2. This option is always available but is generally more expensive than the swap-based system ('Fast Bridge')."
                  fullWidth
                >
                  Bridge to L2
                </Button>

                <Button
                  onClick={()=>{this.handleModalClick('depositModal', token, true)}}
                  color='primary'
                  disabled={disabled}
                  variant="contained"
                  tooltip="A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient."
                  fullWidth
                >
                  Fast Bridge to L2
                </Button>
              </>
              }

              {enabled && chain === 'L2' && token.symbol !== 'OLO' &&  token.symbol !== 'WAGMIv0' &&
                <>
                  <Button
                    onClick={()=>{this.handleModalClick('exitModal', token, false)}}
                    variant="outlined"
                    disabled={disabled}
                    tooltip="Classic Bridge to L1. This option is always available but has a 7 day delay before receiving your funds."
                    fullWidth
                  >
                    Bridge to L1
                  </Button>

                  <Button
                    onClick={()=>{this.handleModalClick('exitModal', token, true)}}
                    variant="contained"
                    disabled={disabled}
                    tooltip="A swap-based bridge to L1 without a 7 day waiting period. There is a fee, however, and this option is only available if the pool balance is sufficient."
                    fullWidth
                  >
                    Fast Bridge to L1
                  </Button>

                  <Button
                    onClick={()=>{this.handleModalClick('transferModal', token, false)}}
                    variant="contained"
                    disabled={disabled}
                    tooltip="Transfer funds from one L2 account to another L2 account."
                    fullWidth
                  >
                    Transfer
                  </Button>
                </>
              }

              {enabled && chain === 'L2' && token.symbol === 'OLO' &&
                <>
                  <Link 
                    color="inherit" 
                    variant="body2" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    href={'https://cbridge.celer.network/#/transfer'}
                  >
                    CELER BRIDGE
                  </Link>
                  <Button
                    onClick={()=>{this.handleModalClick('transferModal', token, false)}}
                    variant="contained"
                    disabled={disabled}
                    tooltip="Transfer funds from one L2 account to another L2 account."
                    fullWidth
                  >
                    Transfer
                  </Button>
                </>
              }

              {enabled && chain === 'L2' && token.symbol === 'WAGMIv0' &&
                <div style={{  
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  <Typography variant="body3" component="p" >
                    At a TVL of {TVL}M each WAGMI will settle for {WAGMI_v0} BOBA 
                  </Typography>
                  <Slider 
                    min={0}
                    max={100}
                    value={sliderValue} 
                    onChange={this.handleSliderChange} 
                    aria-label="WAGMIv0" 
                    step={10}
                    marks={marks} 
                  />
                  <Button
                    onClick={()=>{this.settle_v0()}}
                    variant="contained"
                    disabled={true}
                    tooltip="Settle your WAGMv0 long options."
                    fullWidth
                  >
                    Settle
                  </Button>
                </div>
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
export default connect(mapStateToProps)(ListAccount)
