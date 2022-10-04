import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Fade, useMediaQuery, useTheme } from '@mui/material'
import { openModal } from 'actions/uiAction'

import Button from 'components/button/Button'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectLookupPrice } from 'selectors/lookupSelector'
import { amountToUsd, logAmount } from 'util/amountConvert'
import { getCoinImage } from 'util/coinImage'
import * as S from './listToken.styles'
import { BRIDGE_TYPE } from 'util/constant'

function ListToken({
  token,
  chain,
  networkLayer,
  disabled,
  loading
}) {
  const [ dropDownBox, setDropDownBox ] = useState(false)

  const theme = useTheme()

  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const dispatch = useDispatch();
  const enabled = (networkLayer === chain) ? true : false
  const logo = getCoinImage(token.symbol)
  const lookupPrice = useSelector(selectLookupPrice)

  const amountInNumber = token.symbol === 'ETH' ?
  Number(logAmount(token.balance, token.decimals, 3)):
  Number(logAmount(token.balance, token.decimals, 2))

  const amount = token.symbol === 'ETH' ?
    Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) :
    Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleModalClick = (modalName, token, fast) => {
    dispatch(openModal(modalName, token, fast))
  }

  if (isMobile) {
    return (
      <S.Content>
        <S.TableBody>
          <S.TableCell sx={{ gap: "10px" }}>
            <img src={logo} alt="logo" width={42} height={42} />

            <S.TextTableCell variant="body2" component="div">
              {token.symbol}
            </S.TextTableCell>
          </S.TableCell>
          <S.TableCell >
            <S.TextTableCell
              variant="body2"
              component="div"
              sx={{ fontWeight: '700' }}
            >
              {amount}
            </S.TextTableCell>
          </S.TableCell>
          <S.TableCell >
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
              setDropDownBox(!dropDownBox);
            }}
            isMobile={isMobile}>
            <S.TextTableCell
              variant="body2"
              component="div"
              sx={{ fontWeight: '700' }}
            >
              <Box sx={{ display: "flex", opacity: !enabled ? "0.4" : "1.0", transform: dropDownBox ? "rotate(-180deg)" : "" }}>
                <ExpandMoreIcon sx={{ width: "12px" }} />
              </Box>
            </S.TextTableCell>
          </S.TableCell>
        </S.TableBody>
        {isMobile && dropDownBox ? (
          <Fade in={dropDownBox}>
            <S.DropdownWrapper>

              {enabled && chain === 'L1' &&
                <>
                  <Button
                    onClick={() => { handleModalClick('depositModal', token, BRIDGE_TYPE.CLASSIC_BRIDGE) }}
                    color='neutral'
                    variant="outlined"
                    disabled={disabled}
                    tooltip="Classic Bridge to Boba L2. This option is always available but is generally more expensive than the swap-based system ('Fast Bridge')."
                    fullWidth
                  >
                    Bridge to L2
                  </Button>
                  <Button
                    onClick={() => { handleModalClick('depositModal', token, BRIDGE_TYPE.FAST_BRIDGE) }}
                    color='primary'
                    disabled={disabled}
                    variant="outlined"
                    tooltip="A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient."
                    fullWidth
                  >
                    Fast Bridge to L2
                </Button>
                {token.symbol === 'BOBA' &&
                  <Button
                    onClick={() => { handleModalClick('depositModal', token, BRIDGE_TYPE.MULTI_CHAIN_BRIDGE) }}
                    color='primary'
                    disabled={disabled}
                    variant="contained"
                    tooltip="A multi-chain bridge to Ethereum."
                    fullWidth
                  >
                    Bridge to Ethereum
                  </Button>
                }
              </>
              }

              {enabled && chain === 'L2' &&
                <>
                  <Button
                    onClick={() => { handleModalClick('exitModal', token, false) }}
                    color="primary"
                    variant="outlined"
                    disabled={disabled}
                    tooltip="Classic Bridge to L1. This option is always available but has a 7 day delay before receiving your funds."
                    fullWidth
                  >
                    Bridge to L1
                  </Button>

                  <Button
                    onClick={() => { handleModalClick('exitModal', token, true) }}
                    variant="outlined"
                    disabled={disabled}
                    tooltip="A swap-based bridge to L1 without a 7 day waiting period. There is a fee, however, and this option is only available if the pool balance is sufficient."
                    fullWidth
                  >
                    Fast Bridge to L1
                  </Button>

                  <Button
                    onClick={() => { handleModalClick('transferModal', token, false) }}
                    variant="contained"
                    color="primary"
                    disabled={disabled}
                    tooltip="Transfer funds from one L2 account to another L2 account."
                    fullWidth
                  >
                    Transfer
                  </Button>
                </>
              }

            </S.DropdownWrapper>
          </Fade>
        ) : null}
      </S.Content>
    )
  }

  return (
    <S.Content>
      <S.TableBody>
        <S.TableCell sx={{ gap: "10px", justifyContent: "flex-start" }}>
          <img src={logo} alt="logo" width={42} height={42} />
          <S.TextTableCell variant="body2" component="div">
            {token.symbol}
          </S.TextTableCell>
        </S.TableCell>
        <S.TableCell sx={{ justifyContent: "flex-start" }}>
          <S.TextTableCell
            variant="body2"
            component="div"
            sx={{ fontWeight: '700' }}
          >
            {amount}
          </S.TextTableCell>
        </S.TableCell>
        <S.TableCell sx={{ justifyContent: "flex-start" }}>
          <S.TextTableCell
            variant="body2"
            component="div"
            sx={{ fontWeight: '700' }}
          >
            {`$${amountToUsd(amountInNumber, lookupPrice, token).toFixed(2)}`}
          </S.TextTableCell>
        </S.TableCell>
        <S.TableCell
          sx={{
            gap: '5px',
            width: '40%',
            justifyContent: 'flex-start'
          }}
        >
          {enabled && chain === 'L1' &&
            <>
              <Button
                onClick={() => { handleModalClick('depositModal', token, BRIDGE_TYPE.CLASSIC_BRIDGE) }}
                color='neutral'
                variant="outlined"
                disabled={disabled}
                tooltip="Classic Bridge to Boba L2. This option is always available but is generally more expensive than the swap-based system ('Fast Bridge')."
                fullWidth
              >
                Bridge to L2
              </Button>

              <Button
                onClick={() => { handleModalClick('depositModal', token, BRIDGE_TYPE.FAST_BRIDGE) }}
                color='primary'
                disabled={disabled}
                variant="outlined"
                tooltip="A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient."
                fullWidth
              >
                Fast Bridge to L2
            </Button>
            {token.symbol === 'BOBA' &&

              <Button
                onClick={() => { handleModalClick('depositModal', token, BRIDGE_TYPE.MULTI_CHAIN_BRIDGE) }}
                color='primary'
                disabled={disabled}
                variant="contained"
                fullWidth
              >
                Bridge to Ethereum
              </Button>
            }
            </>
          }
          {enabled && chain === 'L2' &&
            <>
              <Button
                onClick={() => { handleModalClick('exitModal', token, false) }}
                color='primary'
                variant="outlined"
                disabled={disabled}
                tooltip="Classic Bridge to L1. This option is always available but has a 7 day delay before receiving your funds."
                fullWidth
              >
                Bridge to L1
              </Button>

              <Button
                onClick={() => { handleModalClick('exitModal', token, true) }}
                variant="outlined"
                disabled={disabled}
                tooltip="A swap-based bridge to L1 without a 7 day waiting period. There is a fee, however, and this option is only available if the pool balance is sufficient."
                fullWidth
              >
                Fast Bridge to L1
              </Button>


              <Button
                onClick={() => { handleModalClick('transferModal', token, false) }}
                variant="contained"
                color="primary"
                disabled={disabled}
                tooltip="Transfer funds from one L2 account to another L2 account."
                fullWidth
              >
                Transfer
              </Button>
            </>
          }
        </S.TableCell>
      </S.TableBody>
    </S.Content>
  )
}

export default React.memo(ListToken)
