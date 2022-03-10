import { Box, Typography } from "@mui/material";
import { setPage } from 'actions/uiAction';
import AlertIcon from "components/icons/AlertIcon";
import BobaIcon from 'components/icons/BobaIcon.js';
import EthereumIcon from 'components/icons/EthereumIcon.js';
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher';
import WalletPicker from "components/walletpicker/WalletPicker";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAccountEnabled, selectLayer } from "selectors/setupSelector";
import * as S from './bobaBridge.styles';
import BridgeTransfer from './bridgeTransfer/bridgeTransfer';

function BobaBridge() {

  const layer = useSelector(selectLayer());
  const accountEnabled = useSelector(selectAccountEnabled())
  const dispatch = useDispatch()

  if (!accountEnabled) {
    return (
      <S.BobaBridgeWrapper>
        <S.LayerAlert>
          <S.AlertInfo>
            <AlertIcon />
            <S.AlertText
              variant="body2"
              component="p"
            >
              Connect to MetaMask to access Bridging or Tokens transfers!
            </S.AlertText>
          </S.AlertInfo>
          <WalletPicker />
        </S.LayerAlert>
      </S.BobaBridgeWrapper>
    )
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: '10px',
      width: '60%',
      padding: '30px 20px',
      flex: 1,
    }}>
      <S.BobaBridgeWrapper width={'100%'}>
        <S.BobaContentWrapper flexDirection="row" width={"full"} alignItems="center">
          <Box>
            <Box>
              <Typography
                component="p"
                variant="body2"
                sx={{ opacity: 0.8 }}
              >
                From
              </Typography>
            </Box>
            <S.ChainInput
            >
              {layer === 'L1' ?
                <S.ChainLabel
                  component="p"
                  variant="body"
                >
                  <EthereumIcon /> Ethereum
                </S.ChainLabel> : <S.ChainLabel
                  component="p"
                  variant="body"
                >
                  <BobaIcon /> Boba Network
                </S.ChainLabel>
              }
            </S.ChainInput>
          </Box>
          <Box sx={{ mt: 2 }}>
            <LayerSwitcher isIcon={true} />
          </Box>
          <Box>
            <Box>
              <Typography
                component="p"
                variant="body2"
                sx={{ opacity: 0.8 }}
              >
                To
              </Typography>
            </Box>
            <S.ChainInput>
              {layer === 'L2' ?
                <S.ChainLabel
                  component="p"
                  variant="body"
                >
                  <EthereumIcon /> Ethereum
                </S.ChainLabel> : <S.ChainLabel
                  component="p"
                  variant="body"
                >
                  <BobaIcon /> Boba Network
                </S.ChainLabel>
              }
            </S.ChainInput>
          </Box>
        </S.BobaContentWrapper>
      </S.BobaBridgeWrapper>
      <S.BobaBridgeWrapper width={'100%'}>
        <BridgeTransfer />
      </S.BobaBridgeWrapper>
      <S.HistoryLink width={'100%'}
        onClick={() => {
          dispatch(setPage('History'))
        }}
        display="flex" justifyContent="center">
        <Typography
          sx={{ cursor: 'pointer' }}
          variant="text"
          component="span">
          {"Transaction History >"}
        </Typography>
      </S.HistoryLink>
    </Box>
  )
}

export default React.memo(BobaBridge)
