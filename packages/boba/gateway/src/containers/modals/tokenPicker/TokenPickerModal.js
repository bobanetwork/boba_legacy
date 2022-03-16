import { Box, Typography } from '@mui/material';
import { setToken } from 'actions/bridgeAction';
import { closeModal } from 'actions/uiAction';
import * as LayoutS from 'components/common/common.styles';
import Modal from 'components/modal/Modal';
import { isEqual } from 'lodash';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectlayer1Balance, selectlayer2Balance } from 'selectors/balanceSelector';
import { selectLayer } from 'selectors/setupSelector';
import { logAmount } from 'util/amountConvert';
import { getCoinImage } from 'util/coinImage';



function TokenPickerModal({ open }) {

  const layer = useSelector(selectLayer);
  const dispatch = useDispatch();

  const l1Balance = useSelector(selectlayer1Balance, isEqual)
  const l2Balance = useSelector(selectlayer2Balance, isEqual)

  let balances = l1Balance;

  if (layer === 'L2') {
    balances = l2Balance
  }


  const handleClose = () => {
    dispatch(closeModal('tokenPicker'))
  }

  const addToken = (token) => {
    dispatch(setToken(token));
    handleClose();
  }


  return (
    <Modal open={open} onClose={handleClose} maxWidth="sm" minHeight="400px">
      <Box sx={{ px: 1 }}>
        <Typography variant='body1'>Bridge-Select a token</Typography>
        <LayoutS.DividerLine />
        <Typography variant='body2'>Token Names</Typography>
        <LayoutS.DividerLine />
        {balances.map((token) => {
          const amount = token.symbol === 'ETH' ?
            Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) :
            Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

          return <Box key={token.symbol}
            display="flex" justifyContent="space-between"
            sx={{ py: 1, cursor: "pointer" }}
            onClick={() => { addToken(token) }}
          >
            <Box sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: '5px'
            }}>
              <img src={getCoinImage(token.symbol)} alt="logo" width={25} height={25} />
              <Typography variant='body2'>
                {token.symbol}
              </Typography>
            </Box>
            <Typography variant='body2'>
              {amount}
            </Typography>
          </Box>
        })}
      </Box>
    </Modal>
  )
}

export default React.memo(TokenPickerModal);
