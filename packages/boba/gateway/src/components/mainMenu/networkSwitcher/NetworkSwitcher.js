import React, { useState, useEffect } from 'react'
import { openModal } from 'actions/uiAction'
import { Box } from '@material-ui/system'
import { useSelector, useDispatch } from 'react-redux'
import * as S from './NetworkSwitcher.styles.js'

import { selectNetwork } from 'selectors/setupSelector'
import { Typography } from '@material-ui/core'
import WrongNetworkModal from 'containers/modals/wrongnetwork/WrongNetworkModal'
import { selectModalState } from 'selectors/uiSelector'

import NetworkIcon from 'components/icons/NetworkIcon'

function NetworkSwitcher({ walletEnabled }) {

  const dispatch = useDispatch()

  const masterConfig = useSelector(selectNetwork())

  const [ wrongNetwork, setWrongNetwork ] = useState(false)
  const wrongNetworkModalState = useSelector(selectModalState('wrongNetworkModal'))

  useEffect(() => {
    if (wrongNetwork) {
      dispatch(openModal('wrongNetworkModal'))
      localStorage.setItem('changeChain', false)
    }
  }, [ dispatch, wrongNetwork ]);

  return (
    <S.WalletPickerContainer>
      <WrongNetworkModal
        open={wrongNetworkModalState}
      />
      <S.WallerPickerWrapper>
        <S.Menu>
          <S.NetWorkStyle>
            <NetworkIcon />
            <S.Label variant="body2">Network</S.Label>
            <Box sx={{
              display: 'flex',
              margin: '10px 0 10px 15px',
              alignItems: 'center',
              gap: 2,
              position: 'relative',
            }}
            >
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textTransform: 'capitalize'}}>
                {masterConfig}
              </Typography>
            </Box>
          </S.NetWorkStyle>
        </S.Menu>
      </S.WallerPickerWrapper>
    </S.WalletPickerContainer>
  )
};

export default NetworkSwitcher;
