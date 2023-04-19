import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Fade, Link, useMediaQuery, useTheme } from '@mui/material'
import { openModal } from 'actions/uiAction'

import {
  settle_v0,
  settle_v1,
  settle_v2,
  settle_v2OLO,
  settle_v3,
  settle_v3OLO,
} from 'actions/networkAction'

import Button from 'components/button/Button'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectLookupPrice } from 'selectors/lookupSelector'
import { amountToUsd, logAmount } from 'util/amountConvert'
import { getCoinImage } from 'util/coinImage'
import * as S from './listToken.styles'
import { BRIDGE_TYPE } from 'util/constant'
import { BN } from 'bn.js'
import {Text} from 'components/global/text'
import {IconLabel} from 'components/global/IconLabel';
import {TableContent} from 'components/global/table'
import {Row} from 'components/global/containers'


function ListToken({ token, chain, networkLayer, disabled, loading,
  showBalanceToken
}) {
  const [dropDownBox, setDropDownBox] = useState(false)

  const theme = useTheme()

  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const dispatch = useDispatch()
  const enabled = networkLayer === chain ? true : false
  const logo = getCoinImage(token.symbol)
  const lookupPrice = useSelector(selectLookupPrice)
  const {name, symbol, address,  decimals} = token;

  const amountInNumber =
    token.symbol === 'ETH'
      ? Number(logAmount(token.balance, token.decimals, 3))
      : Number(logAmount(token.balance, token.decimals, 2))

  const amount =
    symbol === 'ETH'
      ? Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(
          undefined,
          { minimumFractionDigits: 3, maximumFractionDigits: 3 }
        )
      : Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(
          undefined,
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )

  const handleModalClick = (modalName, token, fast) => {
    dispatch(openModal(modalName, token, fast))
  }

  async function doSettle_v0() {
    await dispatch(settle_v0())
  }

  async function doSettle_v1() {
    await dispatch(settle_v1())
  }

  async function doSettle_v2() {
    await dispatch(settle_v2())
  }

  async function doSettle_v2OLO() {
    await dispatch(settle_v2OLO())
  }

  async function doSettle_v3() {
    await dispatch(settle_v3())
  }

  async function doSettle_v3OLO() {
    await dispatch(settle_v3OLO())
  }

  if (showBalanceToken && token.balance.lte(new BN(1000000))) {
    return null;
  }

  /*if (isMobile) {
    return (
      <S.Content>
        <S.TableBody>
          <S.TableCell sx={{ gap: '10px' }}>
            <img src={logo} alt="logo" width={42} height={42} />

            <S.TextTableCell variant="body2" component="div">
              {symbol}
            </S.TextTableCell>
          </S.TableCell>
          <S.TableCell>
            <S.TextTableCell
              variant="body2"
              component="div"
              sx={{ fontWeight: '700' }}
            >
              {amount}
            </S.TextTableCell>
          </S.TableCell>
          <S.TableCell>
            <S.TextTableCell
              variant="body2"
              component="div"
              sx={{ fontWeight: '700' }}
            >
              {`$${amountToUsd(amountInNumber, lookupPrice, token).toFixed(2)}`}
            </S.TextTableCell>
          </S.TableCell>
          <S.TableCell
            onClick={() => {
              setDropDownBox(!dropDownBox)
            }}
            isMobile={isMobile}
          >
            <S.TextTableCell
              variant="body2"
              component="div"
              sx={{ fontWeight: '700' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  opacity: !enabled ? '0.4' : '1.0',
                  transform: dropDownBox ? 'rotate(-180deg)' : '',
                }}
              >
                <ExpandMoreIcon sx={{ width: '12px' }} />
              </Box>
            </S.TextTableCell>
          </S.TableCell>
        </S.TableBody>
        {isMobile && dropDownBox ? (
          <Fade in={dropDownBox}>
            <S.DropdownWrapper>
              {enabled && chain === 'L1' && (
                <>
                  <Button
                    onClick={() => {
                      handleModalClick(
                        'depositModal',
                        token,
                        BRIDGE_TYPE.CLASSIC_BRIDGE
                      )
                    }}
                    color="primary"
                    variant="outlined"
                    disabled={disabled}
                    tooltip="Classic Bridge to Boba L2. This option is always available but is generally more expensive than the swap-based system ('Fast Bridge')."
                    fullWidth
                  >
                    Bridge
                  </Button>
                  <Button
                    onClick={() => {
                      handleModalClick(
                        'depositModal',
                        token,
                        BRIDGE_TYPE.FAST_BRIDGE
                      )
                    }}
                    color="secondary"
                    disabled={disabled}
                    variant="contained"
                    tooltip="A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient."
                    fullWidth
                  >
                    Fast Bridge
                  </Button>
                  {token === 'BOBA' && (
                    <Button
                      onClick={() => {
                        handleModalClick(
                          'depositModal',
                          token,
                          BRIDGE_TYPE.MULTI_CHAIN_BRIDGE
                        )
                      }}
                      color="secondary"
                      disabled={disabled}
                      variant="contained"
                      tooltip="A multi-chain bridge to Alt L1."
                      fullWidth
                    >
                      Bridge
                    </Button>
                  )}
                </>
              )}

              {enabled &&
                chain === 'L2' &&
                symbol !== 'OLO' &&
                symbol !== 'xBOBA' &&
                symbol !== 'WAGMIv0' &&
                symbol !== 'WAGMIv1' &&
                symbol !== 'WAGMIv2' &&
                symbol !== 'WAGMIv2-Oolong' &&
                symbol !== 'WAGMIv3' &&
                symbol !== 'WAGMIv3-Oolong' && (
                  <>
                    <Button
                      onClick={() => {
                        handleModalClick('exitModal', token, false)
                      }}
                      variant="outlined"
                      color="secondary"
                      disabled={disabled}
                      tooltip="Classic Bridge to L1. This option is always available but has a 7 day delay before receiving your funds."
                      fullWidth
                    >
                      Bridge
                    </Button>

                    <Button
                      onClick={() => {
                        handleModalClick('exitModal', token, true)
                      }}
                      variant="outlined"
                      color="secondary"
                      disabled={disabled}
                      tooltip="A swap-based bridge to L1 without a 7 day waiting period. There is a fee, however, and this option is only available if the pool balance is sufficient."
                      fullWidth
                    >
                      Fast Bridge
                    </Button>

                    <Button
                      onClick={() => {
                        handleModalClick('transferModal', token, false)
                      }}
                      variant="contained"
                      color="primary"
                      disabled={disabled}
                      tooltip="Transfer funds from one L2 account to another L2 account."
                      fullWidth
                    >
                      Transfer
                    </Button>
                  </>
                )}

              {enabled && chain === 'L2' && token.symbol === 'OLO' && (
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
                    onClick={() => {
                      handleModalClick('transferModal', token, false)
                    }}
                    variant="contained"
                    color="primary"
                    disabled={disabled}
                    tooltip="Transfer funds from one L2 account to another L2 account."
                    fullWidth
                  >
                    Transfer
                  </Button>
                </>
              )}

              {enabled && chain === 'L2' && token.symbol === 'WAGMIv0' && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <Button
                    onClick={() => {
                      doSettle_v0()
                    }}
                    variant="contained"
                    color="primary"
                    disabled={false}
                    tooltip="Settle your WAGMv0 long options."
                    fullWidth
                  >
                    Settle
                  </Button>
                </div>
              )}

              {enabled && chain === 'L2' && token.symbol === 'WAGMIv1' && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <Button
                    onClick={() => {
                      doSettle_v1()
                    }}
                    variant="contained"
                    disabled={false}
                    tooltip="Settle your WAGMv1 long options."
                    fullWidth
                  >
                    Settle
                  </Button>
                </div>
              )}
              {enabled && chain === 'L2' && token.symbol === 'WAGMIv2' && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <Button
                    onClick={() => {
                      doSettle_v2()
                    }}
                    variant="contained"
                    disabled={false}
                    tooltip="Settle your WAGMv2 long options."
                    fullWidth
                  >
                    Settle
                  </Button>
                </div>
              )}
              {enabled &&
                chain === 'L2' &&
                token.symbol === 'WAGMIv2-Oolong' && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <Button
                      onClick={() => {
                        doSettle_v2OLO()
                      }}
                      variant="contained"
                      disabled={false}
                      tooltip="Settle your WAGMv2-Oolong long options."
                      fullWidth
                    >
                      Settle
                    </Button>
                  </div>
                )}
              {enabled && chain === 'L2' && token.symbol === 'WAGMIv3' && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <Button
                    onClick={() => {
                      doSettle_v3()
                    }}
                    variant="contained"
                    disabled={true}
                    tooltip="Settle your WAGMv3 long options."
                    fullWidth
                  >
                    Settle
                  </Button>
                </div>
              )}
              {enabled &&
                chain === 'L2' &&
                token.symbol === 'WAGMIv3-Oolong' && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <Button
                      onClick={() => {
                        doSettle_v3OLO()
                      }}
                      variant="contained"
                      disabled={true}
                      tooltip="Settle your WAGMv3-Oolong long options."
                      fullWidth
                    >
                      Settle
                    </Button>
                  </div>
                )}
            </S.DropdownWrapper>
          </Fade>
        ) : null}
      </S.Content>
    )
  }
  */
  const configActions = {
    OLO : {
      link: { 
        label: 'CELER BRIDGE',
        url: 'https://cbridge.celer.network/#/transfer'
      },
      button: {
        label:'Transfer',
        action: handleModalClick('transferModal', token, false),
        tooltip: 'Transfer funds from one L2 account to another L2 account.'
      }
    },
    WAGMIv0: {
      button: {
        action: doSettle_v0(),
        tooltip : "Settle your WAGMIv0 long options",
      }
    },
    WAGMIv1: {
      button: {
        action: doSettle_v1(),
        tooltip : "Settle your WAGMIv1 long options",
      }     
    },
    WAGMIv2: {
      button: {
        action: doSettle_v2(),
        tooltip : "Settle your WAGMIv2 long options",
      }     
    },
    'WAGMIv2-Oolong': {
      button: {
        action: doSettle_v2OLO(),
        tooltip : "Settle your WAGMIv2-Oolong long options",
      }     
    },
    'WAGMIv3': {
      button: {
        action: doSettle_v3(),
        tooltip : "Settle your WAGMIv3 long options",
      }     
    },
    'WAGMIv3-Oolong': {
      button: {
        action: doSettle_v3OLO(),
        tooltip : "Settle your WAGMIv3-Oolong long options",
      }     
    }

  }

  const excludedSymbols = ['OLO','xBOBA','WAGMIv0','WAGMIv1','WAGMIv2','WAGMIv2-Oolong','WAGMIv3', 'WAGMIv3-Oolong']
  const Actions = () => {
    return(
    <>
      {enabled && chain === 'L1' && (
        <>
          <Button
            onClick={() => {
              handleModalClick(
                'depositModal',
                token,
                BRIDGE_TYPE.CLASSIC_BRIDGE
              )
            }}
            color="secondary"
            variant="outlined"
            disabled={disabled}
            tooltip="Classic Bridge to Boba L2. This option is always available but is generally more expensive than the swap-based system ('Fast Bridge')."
            fullWidth
          >
            Bridge
          </Button>

          <Button
            onClick={() => {
              handleModalClick(
                'depositModal',
                token,
                BRIDGE_TYPE.FAST_BRIDGE
              )
            }}
            color="secondary"
            disabled={disabled}
            variant="outlined"
            tooltip="A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient."
            fullWidth
          >
            Fast Bridge
          </Button>
          {symbol === 'BOBA' && (
            <Button
              onClick={() => {
                handleModalClick(
                  'depositModal',
                  token,
                  BRIDGE_TYPE.MULTI_CHAIN_BRIDGE
                )
              }}
              color="secondary"
              disabled={disabled}
              variant="contained"
              fullWidth
            >
              Bridge
            </Button>
          )}
        </>
      )}
      {enabled && chain === 'L2' && !excludedSymbols.includes(symbol) && (
          <>
            <Button
              onClick={() => {
                handleModalClick('exitModal', token, false)
              }}
              variant="outlined"
              color="secondary"
              disabled={disabled}
              tooltip="Classic Bridge to L1. This option is always available but has a 7 day delay before receiving your funds."
              fullWidth
            >
              Bridge
            </Button>
            <Button
              onClick={() => {
                handleModalClick('exitModal', token, true)
              }}
              variant="outlined"
              color="secondary"
              disabled={disabled}
              tooltip="A swap-based bridge to L1 without a 7 day waiting period. There is a fee, however, and this option is only available if the pool balance is sufficient."
              fullWidth
              sx={{ whiteSpace: 'nowrap' }}
            >
              Fast Bridge
            </Button>
            <Button
              onClick={() => {
                handleModalClick('transferModal', token, false)
              }}
              variant="outlined"
              color="secondary"
              disabled={disabled}
              tooltip="Transfer funds from one L2 account to another L2 account."
              fullWidth
            >
              Transfer
            </Button>
          </>
      )}

      { enabled && chain === 'L2' && excludedSymbols.includes(symbol) && (
        <Row>
          {configActions?.[symbol]?.link?.label &&
            <Link
              color="inherit"
              variant="body2"
              target="_blank"
              rel="noopener noreferrer"
              href={configActions?.[symbol]?.link?.url}
            >
              {configActions?.[symbol]?.link?.label}
            </Link>
          }
           <Button
              onClick={() => configActions?.[symbol]?.button.action}
              variant="contained"
              color="primary"
              disabled={false}
              tooltip={configActions?.[symbol]?.tooltip}
              fullWidth
            >
              {configActions?.[symbol]?.button.label || "Settle" }
            </Button>
        </Row>
      )

      }
    </>
    )
 };

 const actionView = () => {
  if(!isMobile) {
    return  <Row gap="0px 10px"> {Actions()} </Row>
  }
  if(isMobile) {
    return <Row gap="0px 10px"
      > <ExpandMoreIcon sx={{ width: '12px' }} /> </Row>


  }
 }

  const tableOptions = [
    { content: <IconLabel token={{ name, symbol, address, chainId:chain, decimals }} />, width:275 },
    { content: <Text> {amount}</Text>,width:145 },
    { content: <Text> {`$${amountToUsd(amountInNumber, lookupPrice, token).toFixed(2)}`} </Text>,width:115 },
    { content: actionView() ,width:350 },
  ];


  return (
    <div  onClick={() => {
      setDropDownBox(!dropDownBox)
    }}>
      <TableContent options={tableOptions} mobileOptions={[0,3]}/> 
      {isMobile && dropDownBox && (
        <Fade in={dropDownBox}>
          <S.DropdownWrapper>
            {Actions()}
          </S.DropdownWrapper>
        </Fade>
      )}
    </div>
  )
}

export default React.memo(ListToken)
