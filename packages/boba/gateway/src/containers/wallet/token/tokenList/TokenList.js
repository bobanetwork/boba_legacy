import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Fade, Link, Slider, Typography, useMediaQuery, useTheme } from '@mui/material';
import { settle_v0 } from 'actions/networkAction';
import { openModal } from 'actions/uiAction';
import Button from 'components/button/Button';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectLookupPrice } from 'selectors/lookupSelector';
import { amountToUsd, logAmount } from 'util/amountConvert';
import { getCoinImage } from 'util/coinImage';
import * as S from './TokenList.styles';

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


function TokenList({
  token,
  chain,
  networkLayer,
  disabled,
  loading
}) {
  const [ dropDownBox, setDropDownBox ] = useState(false);
  const [ sliderValue, setSliderValue ] = useState(55);


  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const dispatch = useDispatch();
  const enabled = (networkLayer === chain) ? true : false
  const logo = getCoinImage(token.symbol)
  const lookupPrice = useSelector(selectLookupPrice)

  const amount = token.symbol === 'ETH' ?
    Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) :
    Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })


  const WAGMI_v0 = 1 + (sliderValue / 100)
  const TVL = Number(300 + (sliderValue / 100) * 700)


  const handleModalClick = (modalName, token, fast) => {
    dispatch(openModal(modalName, token, fast))
  }

  const handleSliderChange = (e) => {
    setSliderValue(e.target.value)
  }

  const settleV0 = () => {
    dispatch(settle_v0())
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
              {`$${amountToUsd(amount, lookupPrice, token).toFixed(2)}`}
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
                    onClick={() => { this.handleModalClick('depositModal', token, false) }}
                    color='neutral'
                    variant="outlined"
                    disabled={disabled}
                    tooltip="Classic Bridge to Boba L2. This option is always available but is generally more expensive than the swap-based system ('Fast Bridge')."
                    fullWidth
                  >
                    Bridge to L2
                  </Button>

                  <Button
                    onClick={() => { this.handleModalClick('depositModal', token, true) }}
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

              {enabled && chain === 'L2' && token.symbol !== 'OLO' && token.symbol !== 'WAGMIv0' &&
                <>
                  <Button
                    onClick={() => { this.handleModalClick('exitModal', token, false) }}
                    variant="outlined"
                    disabled={disabled}
                    tooltip="Classic Bridge to L1. This option is always available but has a 7 day delay before receiving your funds."
                    fullWidth
                  >
                    Bridge to L1
                  </Button>

                  <Button
                    onClick={() => { this.handleModalClick('exitModal', token, true) }}
                    variant="contained"
                    disabled={disabled}
                    tooltip="A swap-based bridge to L1 without a 7 day waiting period. There is a fee, however, and this option is only available if the pool balance is sufficient."
                    fullWidth
                  >
                    Fast Bridge to L1
                  </Button>

                  <Button
                    onClick={() => { this.handleModalClick('transferModal', token, false) }}
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
                    onClick={() => { this.handleModalClick('transferModal', token, false) }}
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
                    onChange={handleSliderChange}
                    aria-label="WAGMIv0"
                    step={10}
                    marks={marks}
                  />
                  <Button
                    onClick={() => { settleV0() }}
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
            {`$${amountToUsd(amount, lookupPrice, token).toFixed(2)}`}
          </S.TextTableCell>
        </S.TableCell>
        <S.TableCell
          sx={{
            gap: '5px',
            width: '40%'
          }}
        >
          {enabled && chain === 'L1' &&
            <>
              <Button
                onClick={() => { handleModalClick('depositModal', token, false) }}
                color='neutral'
                variant="outlined"
                disabled={disabled}
                tooltip="Classic Bridge to Boba L2. This option is always available but is generally more expensive than the swap-based system ('Fast Bridge')."
                fullWidth
              >
                Bridge to L2
              </Button>

              <Button
                onClick={() => { handleModalClick('depositModal', token, true) }}
                color='primary'
                disabled={disabled}
                variant="outlined"
                tooltip="A swap-based bridge to Boba L2. This option is only available if the pool balance is sufficient."
                fullWidth
              >
                Fast Bridge to L2
              </Button>
            </>
          }
          {enabled && chain === 'L2' && token.symbol !== 'OLO' && token.symbol !== 'WAGMIv0' &&
            <>
              <Button
                onClick={() => { handleModalClick('exitModal', token, false) }}
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
                sx={{ whiteSpace: 'nowrap' }}
              >
                Fast Bridge to L1
              </Button>
              <Button
                onClick={() => { handleModalClick('transferModal', token, false) }}
                variant="outlined"
                disabled={disabled}
                tooltip="Transfer funds from one L2 account to another L2 account."
                fullWidth
              >
                Transfer
              </Button> </>}
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
                onChange={handleSliderChange}
                aria-label="WAGMIv0"
                step={10}
                marks={marks}
              />
              <Button
                onClick={() => { settleV0() }}
                variant="contained"
                disabled={true}
                tooltip="Settle your WAGMv0 long options."
                fullWidth
              >
                Settle
              </Button>
            </div>
          }
        </S.TableCell>
      </S.TableBody>
    </S.Content>
  )
}

export default React.memo(TokenList);
