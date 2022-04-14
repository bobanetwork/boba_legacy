
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import { updateToken } from 'actions/bridgeAction'
import { closeModal } from 'actions/uiAction'
import Modal from 'components/modal/Modal'
import { isEqual } from 'lodash'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectlayer1Balance, selectlayer2Balance } from 'selectors/balanceSelector'
import { selectLayer } from 'selectors/setupSelector'
import { logAmount } from 'util/amountConvert'
import { getCoinImage } from 'util/coinImage'
import * as S from './TokenPickerModal.styles'

// the L2 token which can not be exited so exclude from dropdown in case of L2
const NON_EXITABLE_TOKEN = [
  'OLO','xBOBA', 'WAGMIv0', 'WAGMIv1', 'WAGMIv2', 'WAGMIv2-Oolong'
]

function TokenPickerModal({ open, tokenIndex }) {

  const layer = useSelector(selectLayer())
  const dispatch = useDispatch()

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const l1Balance = useSelector(selectlayer1Balance, isEqual)
  const l2Balance = useSelector(selectlayer2Balance, isEqual)

  let balances = l1Balance

  if (layer === 'L2') {
    balances = l2Balance
  }

  const handleClose = () => {
    dispatch(closeModal('tokenPicker'))
  }

  const addToken = (token) => {
    dispatch(updateToken({token, tokenIndex}));
    handleClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      minHeight={isMobile? "100%": "450px"}
      title={isMobile ? "Bridge-Select a token": "Select a token"}
      newStyle={true}
  >
      <S.TokenList>
        {balances.length > 0
          ? balances.filter((token) => {
            if (layer === 'L2') {
              return !(NON_EXITABLE_TOKEN.indexOf(token.symbol) > 0);
            }
            return true;
          }).map((token) => {

            const amount = token.symbol === 'ETH' ?
              Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) :
              Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

            return <S.TokenListItem
              key={token.symbol}
              p={1}
              onClick={() => { addToken(token) }}
            >
              <Box sx={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <img src={getCoinImage(token.symbol)} alt="logo" width={25} height={25} />
                <Typography variant='body2'>
                  {token.symbol}
                </Typography>
              </Box>
              <Typography variant='body2'>
                {amount}
              </Typography>
            </S.TokenListItem>
          }) : null
        }
      </S.TokenList>
    </Modal>
  )
}

export default React.memo(TokenPickerModal);
