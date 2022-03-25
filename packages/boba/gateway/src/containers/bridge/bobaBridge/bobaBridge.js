import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box, Typography } from "@mui/material";
import { setPage } from 'actions/uiAction';

import BobaIcon from 'components/icons/BobaIcon.js';
import EthereumIcon from 'components/icons/EthereumIcon.js';
import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher';
import WalletPicker from "components/walletpicker/WalletPicker";
import * as LaytoutS from 'components/common/common.styles'

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
        <Box sx={{my:1}}>
          <Typography variant="h3">Bridge</Typography>
          <Typography variant="body2">Select tokens to send through the Boba Bridge.</Typography>
        </Box>
        <LaytoutS.DividerLine />
        <S.BobaContentWrapper flexDirection="column" fullWidth={true} gap="5px" alignItems="flex-start" my={1}>
          <Box width="100%">
            <Box>
              <Typography
                component="p"
                variant="body2"
                sx={{ opacity: 0.8 }}
              >
                From
              </Typography>
            </Box>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <S.ChainInput
                sx={{width:"60% !important"}}
              >
                <S.ChainLabel
                  component="p"
                  variant="body"
                >
                  <EthereumIcon /> Ethereum
                </S.ChainLabel>
              </S.ChainInput>
              <WalletPicker />
            </Box>
          </Box>
          <Box sx={{ alignSelf:'center', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.04)', mt: 2, p: 1 }}>
            <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.13029 20L4.47765 15.3474L9.13029 10.6947L9.13029 13.3732L11.1035 13.3732C15.4911 13.3723 18.1237 12.0569 19 9.425C18.1231 14.6886 15.4902 17.3215 11.1046 17.3206L9.13051 17.3215C9.13029 17.3215 9.13029 20 9.13029 20ZM10.5061 7.42559e-07L15.1588 4.65264L10.507 9.3044L10.5052 6.62743L8.53266 6.62654C4.14506 6.62743 1.51245 7.94285 0.635512 10.5757C1.51334 5.31113 4.14617 2.67853 8.53199 2.67919L10.5061 2.6783L10.5061 7.42559e-07Z" fill="white" fillOpacity="0.85" />
            </svg>
          </Box>
          <Box width="100%">
            <Box>
              <Typography
                component="p"
                variant="body2"
                sx={{ opacity: 0.8 }}
              >
                To
              </Typography>
            </Box>
            <S.ChainInput
              sx={{width:"60% !important"}}
            >
              <S.ChainLabel
                component="p"
                variant="body"
              >
                <BobaIcon  dark={true} /> Boba Network
              </S.ChainLabel>
            </S.ChainInput>
          </Box>
        </S.BobaContentWrapper>
      </S.BobaBridgeWrapper>
    )
  }

  return (
    <>
      <S.BobaBridgeWrapper>
        <S.BobaContentWrapper flexDirection="row" fullWidth={true} gap="5px" alignItems="center">
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
              {!layer ?
                <S.ChainLabel
                  component="p"
                  variant="body"
                >

                </S.ChainLabel>
                : layer === 'L1'
                  ? <S.ChainLabel
                    component="p"
                    variant="body"
                  >
                    <EthereumIcon /> Ethereum
                  </S.ChainLabel> :
                  <S.ChainLabel
                    component="p"
                    variant="body"
                  >
                    <BobaIcon dark={true} /> Boba Network
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
              {!layer ?
                <S.ChainLabel
                  component="p"
                  variant="body"
                > </S.ChainLabel>
                : layer === 'L2' ?
                  <S.ChainLabel
                    component="p"
                    variant="body"
                  >
                    <EthereumIcon /> Ethereum
                  </S.ChainLabel> : <S.ChainLabel
                    component="p"
                    variant="body"
                  >
                    <BobaIcon dark={true} /> Boba Network
                  </S.ChainLabel>
              }
            </S.ChainInput>
          </Box>
        </S.BobaContentWrapper>
      </S.BobaBridgeWrapper>
      <S.BobaBridgeWrapper>
        <BridgeTransfer />
      </S.BobaBridgeWrapper>
      <S.HistoryLink
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
    </>
  )
}

export default React.memo(BobaBridge)
