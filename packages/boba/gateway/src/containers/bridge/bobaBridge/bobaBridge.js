
import React, { useState } from 'react'

import { useDispatch, useSelector } from "react-redux"

import { Box, Typography, Switch, useTheme } from "@mui/material"
import { setPage } from 'actions/uiAction'

import BobaIcon from 'components/icons/BobaIcon.js'
import EthereumIcon from 'components/icons/EthereumIcon.js'
import Button from 'components/button/Button.js'

import * as LaytoutS from 'components/common/common.styles'

import {
  selectAccountEnabled,
  selectNetwork,
  selectLayer
} from 'selectors/setupSelector'

import * as S from './bobaBridge.styles';
import BridgeTransfer from './bridgeTransfer/bridgeTransfer'
import { selectBridgeTokens, selectMultiBridgeMode } from "selectors/bridgeSelector"
import { resetToken, setMultiBridgeMode } from "actions/bridgeAction"

import { 
  setConnectETH,
  setConnectBOBA
} from 'actions/setupAction'

function BobaBridge() {

  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())
  const multibridgeMode = useSelector(selectMultiBridgeMode())
  const tokens = useSelector(selectBridgeTokens())
  const dispatch = useDispatch()
  const [ toL2, setToL2 ] = useState(true)
  const theme = useTheme()
  const iconColor = theme.palette.mode === 'dark' ? '#fff' : '#000'
  
  async function connectToETH () {
    dispatch(setConnectETH(true))
  }

  async function connectToBOBA () {
    dispatch(setConnectBOBA(true))
  }

  async function switchDirection () {
    console.log("layer:",layer)
    if(accountEnabled) {
      if(layer === 'L1')
        dispatch(setConnectBOBA(true))
      else
        dispatch(setConnectETH(true))
    } else {
      setToL2(!toL2)
    }
  }

  if (!accountEnabled && toL2) {
    return (
      <S.BobaBridgeWrapper>
        <Box sx={{ my: 1 }}>
          <Typography variant="h3">Bridge</Typography>
          <Typography variant="body2">Select the bridge direction.</Typography>
        </Box>
        <LaytoutS.DividerLine />
        <S.BobaContentWrapper flexDirection="column" fullWidth={true} gap="5px" alignItems="flex-start" my={1}>
          <Box width="100%">
            <Box><Typography component="p" variant="body2" sx={{ opacity: 0.8 }}>From</Typography></Box>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <S.ChainInput sx={{ width: "60% !important" }}>
                <S.ChainLabel component="p" variant="body"><EthereumIcon /> Ethereum</S.ChainLabel>
              </S.ChainInput>
              <Button onClick={()=>{connectToETH()}} color='primary' variant='outlined'>Connect to Ethereum</Button>
            </Box>
          </Box>
          <S.IconSwitcher onClick={()=>{switchDirection()}}>
            <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.13029 20L4.47765 15.3474L9.13029 10.6947L9.13029 13.3732L11.1035 13.3732C15.4911 13.3723 18.1237 12.0569 19 9.425C18.1231 14.6886 15.4902 17.3215 11.1046 17.3206L9.13051 17.3215C9.13029 17.3215 9.13029 20 9.13029 20ZM10.5061 7.42559e-07L15.1588 4.65264L10.507 9.3044L10.5052 6.62743L8.53266 6.62654C4.14506 6.62743 1.51245 7.94285 0.635512 10.5757C1.51334 5.31113 4.14617 2.67853 8.53199 2.67919L10.5061 2.6783L10.5061 7.42559e-07Z" fill={iconColor} fillOpacity="0.85" />
            </svg>
          </S.IconSwitcher>
          <Box width="100%">
            <Box><Typography component="p" variant="body2" sx={{ opacity: 0.8 }}>To</Typography></Box>
            <S.ChainInput sx={{ width: "60% !important" }}>
              <S.ChainLabel component="p" variant="body"><BobaIcon /> Boba</S.ChainLabel>
            </S.ChainInput>
          </Box>
        </S.BobaContentWrapper>
      </S.BobaBridgeWrapper>
    )
  } else if (!accountEnabled && !toL2) {
    return (
      <S.BobaBridgeWrapper>
        <Box sx={{ my: 1 }}>
          <Typography variant="h3">Bridge</Typography>
          <Typography variant="body2">Select the bridge direction.</Typography>
        </Box>
        <LaytoutS.DividerLine />
        <S.BobaContentWrapper flexDirection="column" fullWidth={true} gap="5px" alignItems="flex-start" my={1}>
          <Box width="100%">
            <Box><Typography component="p" variant="body2" sx={{ opacity: 0.8 }}>From</Typography></Box>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <S.ChainInput sx={{ width: "60% !important" }}>
                <S.ChainLabel component="p" variant="body"><BobaIcon /> Boba</S.ChainLabel>
              </S.ChainInput>
              <Button onClick={()=>{connectToBOBA()}} color='primary' variant='outlined'>Connect to Boba</Button>
            </Box>
          </Box>
          <S.IconSwitcher onClick={()=>{switchDirection()}}>
            <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.13029 20L4.47765 15.3474L9.13029 10.6947L9.13029 13.3732L11.1035 13.3732C15.4911 13.3723 18.1237 12.0569 19 9.425C18.1231 14.6886 15.4902 17.3215 11.1046 17.3206L9.13051 17.3215C9.13029 17.3215 9.13029 20 9.13029 20ZM10.5061 7.42559e-07L15.1588 4.65264L10.507 9.3044L10.5052 6.62743L8.53266 6.62654C4.14506 6.62743 1.51245 7.94285 0.635512 10.5757C1.51334 5.31113 4.14617 2.67853 8.53199 2.67919L10.5061 2.6783L10.5061 7.42559e-07Z" fill={iconColor} fillOpacity="0.85" />
            </svg>
          </S.IconSwitcher>
          <Box width="100%">
            <Box><Typography component="p" variant="body2" sx={{ opacity: 0.8 }}>To</Typography></Box>
            <S.ChainInput sx={{ width: "60% !important" }}>
              <S.ChainLabel component="p" variant="body"><EthereumIcon /> Ethereum</S.ChainLabel>
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
              {layer === 'L1' ? 
                  <S.ChainLabel component="p" variant="body"><EthereumIcon /> Ethereum</S.ChainLabel> 
                :
                  <S.ChainLabel component="p" variant="body"><BobaIcon /> Boba</S.ChainLabel>
              }
            </S.ChainInput>
          </Box>
          <S.IconSwitcher onClick={()=>{switchDirection()}}>
            <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.13029 20L4.47765 15.3474L9.13029 10.6947L9.13029 13.3732L11.1035 13.3732C15.4911 13.3723 18.1237 12.0569 19 9.425C18.1231 14.6886 15.4902 17.3215 11.1046 17.3206L9.13051 17.3215C9.13029 17.3215 9.13029 20 9.13029 20ZM10.5061 7.42559e-07L15.1588 4.65264L10.507 9.3044L10.5052 6.62743L8.53266 6.62654C4.14506 6.62743 1.51245 7.94285 0.635512 10.5757C1.51334 5.31113 4.14617 2.67853 8.53199 2.67919L10.5061 2.6783L10.5061 7.42559e-07Z" fill={iconColor} fillOpacity="0.85" />
            </svg>
          </S.IconSwitcher>
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
                  <S.ChainLabel component="p" variant="body"><EthereumIcon /> Ethereum</S.ChainLabel> 
                :
                  <S.ChainLabel component="p" variant="body"><BobaIcon /> Boba</S.ChainLabel>
              }
            </S.ChainInput>
          </Box>
        </S.BobaContentWrapper>
      </S.BobaBridgeWrapper>
      <S.BobaBridgeWrapper>

      {layer === 'L1' && !multibridgeMode && tokens.length < 1 &&
        <Box display="flex" my={1} justifyContent="space-between">
          <Typography variant="body2">
            Bridge multiple tokens at once?
          </Typography>
          <Switch
            disabled={layer !== 'L1'}
            checked={multibridgeMode}
            size="small"
            sx={{
              '& .MuiSwitch-thumb': {
                backgroundColor: '#003892',
                '&:before': {
                  content: "''",
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  left: 0,
                  top: 0,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAyMiAyMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAuMjAwMDczIDExLjAwMDJDMC4yMDAwNzMgMTIuNDE4NSAwLjQ3OTQyNSAxMy44MjI5IDEuMDIyMTggMTUuMTMzMkMxLjU2NDkzIDE2LjQ0MzUgMi4zNjA0NSAxNy42MzQxIDMuMzYzMzIgMTguNjM2OUM0LjM2NjE5IDE5LjYzOTggNS41NTY3OCAyMC40MzUzIDYuODY3MDkgMjAuOTc4MUM4LjE3NzQxIDIxLjUyMDggOS41ODE4IDIxLjgwMDIgMTEuMDAwMSAyMS44MDAyQzEyLjQxODMgMjEuODAwMiAxMy44MjI3IDIxLjUyMDggMTUuMTMzMSAyMC45NzgxQzE2LjQ0MzQgMjAuNDM1MyAxNy42MzQgMTkuNjM5OCAxOC42MzY4IDE4LjYzNjlDMTkuNjM5NyAxNy42MzQxIDIwLjQzNTIgMTYuNDQzNSAyMC45NzggMTUuMTMzMkMyMS41MjA3IDEzLjgyMjkgMjEuODAwMSAxMi40MTg1IDIxLjgwMDEgMTEuMDAwMkMyMS44MDAxIDguMTM1ODYgMjAuNjYyMiA1LjM4ODgzIDE4LjYzNjggMy4zNjM0NEMxNi42MTE0IDEuMzM4MDUgMTMuODY0NCAwLjIwMDE5NSAxMS4wMDAxIDAuMjAwMTk1QzguMTM1NzMgMC4yMDAxOTUgNS4zODg3MSAxLjMzODA1IDMuMzYzMzIgMy4zNjM0NEMxLjMzNzkzIDUuMzg4ODMgMC4yMDAwNzMgOC4xMzU4NiAwLjIwMDA3MyAxMS4wMDAyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMS4wMTg4IDE4LjUwNzdDMTUuMTY1IDE4LjUwNzcgMTguNTI2MiAxNS4xNDY2IDE4LjUyNjIgMTEuMDAwNEMxOC41MjYyIDYuODU0MTkgMTUuMTY1IDMuNDkzMDMgMTEuMDE4OCAzLjQ5MzAzQzYuODcyNjIgMy40OTMwMyAzLjUxMTQ3IDYuODU0MTkgMy41MTE0NyAxMS4wMDA0QzMuNTExNDcgMTUuMTQ2NiA2Ljg3MjYyIDE4LjUwNzcgMTEuMDE4OCAxOC41MDc3Wk0xMS4wMTg4IDIwLjYwMDRDMTYuMzIwOCAyMC42MDA0IDIwLjYxODggMTYuMzAyMyAyMC42MTg4IDExLjAwMDRDMjAuNjE4OCA1LjY5ODQ2IDE2LjMyMDggMS40MDAzOSAxMS4wMTg4IDEuNDAwMzlDNS43MTY4OSAxLjQwMDM5IDEuNDE4ODIgNS42OTg0NiAxLjQxODgyIDExLjAwMDRDMS40MTg4MiAxNi4zMDIzIDUuNzE2ODkgMjAuNjAwNCAxMS4wMTg4IDIwLjYwMDRaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfNDMxN183MjIpIi8+CjxwYXRoIGQ9Ik03LjIzMzI4IDEzLjQ5MDJDNy4wNzI5NiAxMy40ODg5IDYuOTE0NDYgMTMuNDU2MSA2Ljc2Njg2IDEzLjM5MzVDNi42MTkyNSAxMy4zMzA5IDYuNDg1NDIgMTMuMjM5OCA2LjM3MzAzIDEzLjEyNTVDNi4yNjA2NCAxMy4wMTEyIDYuMTcxODkgMTIuODc1OCA2LjExMTg1IDEyLjcyNzFDNi4wNTE4MSAxMi41Nzg1IDYuMDIxNjYgMTIuNDE5NSA2LjAyMzEyIDEyLjI1OTFDNi4wMzEyNCAxMS41NzU3IDYuNTg2OTggMTEuMDQ1MSA3LjI4MTEyIDExLjA1MjhDNy42MDA4NSAxMS4wNjAyIDcuOTA1MSAxMS4xOTIgOC4xMjkxMiAxMS40MjAyQzguMzUzMTQgMTEuNjQ4NSA4LjQ3OTI1IDExLjk1NTEgOC40ODA2MSAxMi4yNzQ5QzguNDc4NDcgMTIuOTU5MyA3LjkyNzQzIDEzLjQ5NDkgNy4yMzMyOCAxMy40OTAyWiIgZmlsbD0iIzFDRDZEMSIvPgo8cGF0aCBkPSJNMTEuNDYxNyAxNS4wNjM4QzExLjQ2MjQgMTUuMzA2NiAxMS4zOTA5IDE1LjU0NDIgMTEuMjU2NSAxNS43NDY0QzExLjEyMiAxNS45NDg2IDEwLjkzMDUgMTYuMTA2MyAxMC43MDYzIDE2LjE5OTZDMTAuNDgyMSAxNi4yOTI4IDEwLjIzNTIgMTYuMzE3NCA5Ljk5NzA0IDE2LjI3MDJDOS43NTg4NCAxNi4yMjMxIDkuNTQgMTYuMTA2MiA5LjM2ODI2IDE1LjkzNDZDOS4xOTY1MyAxNS43NjI5IDkuMDc5NjIgMTUuNTQ0MSA5LjAzMjM2IDE1LjMwNTlDOC45ODUxIDE1LjA2NzcgOS4wMDk2MiAxNC44MjA5IDkuMTAyOCAxNC41OTY2QzkuMTk1OTggMTQuMzcyNCA5LjM1MzYzIDE0LjE4MDggOS41NTU3OCAxNC4wNDYzQzkuNzU3OTIgMTMuOTExNyA5Ljk5NTQ2IDEzLjg0MDIgMTAuMjM4MyAxMy44NDA4QzEwLjU2MjEgMTMuODQyNiAxMC44NzIyIDEzLjk3MiAxMS4xMDEyIDE0LjIwMUMxMS4zMzAzIDE0LjQyOTkgMTEuNDU5OCAxNC43NCAxMS40NjE3IDE1LjA2MzhaIiBmaWxsPSIjMUNENkQxIi8+CjxwYXRoIGQ9Ik0xNi4wNjExIDkuNzk4QzE2LjA1NjcgMTAuMTE4MiAxNS45MjYyIDEwLjQyMzggMTUuNjk3OCAxMC42NDg0QzE1LjQ2OTUgMTAuODczIDE1LjE2MTggMTAuOTk4NCAxNC44NDE1IDEwLjk5NzVDMTQuNjc4NiAxMC45OTk2IDE0LjUxNjkgMTAuOTY5MiAxNC4zNjU4IDEwLjkwODFDMTQuMjE0NyAxMC44NDcgMTQuMDc3MyAxMC43NTY0IDEzLjk2MTYgMTAuNjQxN0MxMy44NDU5IDEwLjUyNjkgMTMuNzU0MyAxMC4zOTAyIDEzLjY5MiAxMC4yMzk2QzEzLjYyOTcgMTAuMDg5IDEzLjU5ODEgOS45Mjc1MyAxMy41OTg5IDkuNzY0NTdDMTMuNTk5NyA5LjYwMTYxIDEzLjYzMyA5LjQ0MDQ1IDEzLjY5NjggOS4yOTA0OUMxMy43NjA2IDkuMTQwNTMgMTMuODUzNiA5LjAwNDc5IDEzLjk3MDUgOC44OTExOUMxNC4wODczIDguNzc3NTggMTQuMjI1NiA4LjY4ODQgMTQuMzc3MyA4LjYyODgzQzE0LjUyOSA4LjU2OTI3IDE0LjY5MSA4LjU0MDUyIDE0Ljg1MzkgOC41NDQyN0MxNS41MzgyIDguNTQ5NCAxNi4wNzA5IDkuMTA0NzEgMTYuMDYxMSA5Ljc5OFoiIGZpbGw9IiMxQ0Q2RDEiLz4KPHBhdGggZD0iTTExLjA2MzMgOS44MDY4MUMxMS4yMjM2IDkuODA2NyAxMS4zODI0IDkuODM4MjQgMTEuNTMwNSA5Ljg5OTY0QzExLjY3ODYgOS45NjEwMyAxMS44MTMxIDEwLjA1MTEgMTEuOTI2NCAxMC4xNjQ2QzEyLjAzOTYgMTAuMjc4MSAxMi4xMjkzIDEwLjQxMjggMTIuMTkwMyAxMC41NjExQzEyLjI1MTQgMTAuNzA5MyAxMi4yODI1IDEwLjg2ODIgMTIuMjgyIDExLjAyODVDMTIuMjgyIDExLjM1NDQgMTIuMTUyNSAxMS42NjcgMTEuOTIyMSAxMS44OTc1QzExLjY5MTYgMTIuMTI4IDExLjM3OSAxMi4yNTc1IDExLjA1MzEgMTIuMjU3NUMxMC43MjcxIDEyLjI1NzUgMTAuNDE0NSAxMi4xMjggMTAuMTg0MSAxMS44OTc1QzkuOTUzNTggMTEuNjY3IDkuODI0MSAxMS4zNTQ0IDkuODI0MSAxMS4wMjg1QzkuODIzNjggMTAuODY2NSA5Ljg1NTU4IDEwLjcwNiA5LjkxNzkyIDEwLjU1NjRDOS45ODAyNyAxMC40MDY5IDEwLjA3MTggMTAuMjcxMiAxMC4xODcyIDEwLjE1NzVDMTAuMzAyNiAxMC4wNDM3IDEwLjQzOTUgOS45NTQxMiAxMC41ODk5IDkuODkzOUMxMC43NDA0IDkuODMzNjkgMTAuOTAxMyA5LjgwNDA5IDExLjA2MzMgOS44MDY4MVoiIGZpbGw9IiMxQ0Q2RDEiLz4KPHBhdGggZD0iTTExLjg2NDYgOC4xOTgzOEMxMS4yMDA4IDguMTk4MzggMTAuNjQ4OSA3LjY1NjMxIDEwLjY0MTIgNy4wMDIzMkMxMC42MzQ4IDYuNzU3OTYgMTAuNzAxNSA2LjUxNzI2IDEwLjgzMjcgNi4zMTEwMkMxMC45NjM5IDYuMTA0NzkgMTEuMTUzNyA1Ljk0MjQgMTEuMzc3NyA1Ljg0NDY1QzExLjYwMTggNS43NDY5MSAxMS44NDk5IDUuNzE4MjQgMTIuMDkwNCA1Ljc2MjMzQzEyLjMzMDggNS44MDY0MiAxMi41NTI2IDUuOTIxMjUgMTIuNzI3NCA2LjA5MjE0QzEyLjkwMjIgNi4yNjMwMiAxMy4wMjIgNi40ODIxNyAxMy4wNzE1IDYuNzIxNTVDMTMuMTIxIDYuOTYwOTIgMTMuMDk4IDcuMjA5NjMgMTMuMDA1MyA3LjQzNTgzQzEyLjkxMjYgNy42NjIwMiAxMi43NTQ2IDcuODU1NDMgMTIuNTUxNCA3Ljk5MTI4QzEyLjM0ODEgOC4xMjcxMiAxMi4xMDkgOC4xOTkyNCAxMS44NjQ2IDguMTk4MzhaIiBmaWxsPSIjMUNENkQxIi8+CjxwYXRoIGQ9Ik0xNC4wNDg4IDE0Ljg2MjVDMTMuODg4NiAxNC44NjM0IDEzLjcyOTggMTQuODMyMyAxMy41ODE3IDE0Ljc3MDlDMTMuNDMzNyAxNC43MDk1IDEzLjI5OTUgMTQuNjE5MiAxMy4xODY5IDE0LjUwNTFDMTMuMDc0MyAxNC4zOTExIDEyLjk4NTcgMTQuMjU1NyAxMi45MjYzIDE0LjEwNjhDMTIuODY2OCAxMy45NTggMTIuODM3OCAxMy43OTg4IDEyLjg0MDggMTMuNjM4NkMxMi44NDQgMTMuMzE0OCAxMi45NzU2IDEzLjAwNTYgMTMuMjA2OCAxMi43Nzg5QzEzLjQzOCAxMi41NTIyIDEzLjc0OTggMTIuNDI2NiAxNC4wNzM2IDEyLjQyOTdDMTQuMzk3NCAxMi40MzI5IDE0LjcwNjYgMTIuNTY0NiAxNC45MzMzIDEyLjc5NThDMTUuMTYwMSAxMy4wMjcgMTUuMjg1NiAxMy4zMzg4IDE1LjI4MjUgMTMuNjYyNUMxNS4yNzg2IDE0LjMzNTMgMTQuNzM0NCAxNC44NjI1IDE0LjA0ODggMTQuODYyNVoiIGZpbGw9IiMxQ0Q2RDEiLz4KPHBhdGggZD0iTTguMDI4MyA5LjYxNjA2QzcuODY4MSA5LjYxNzkgNy43MDkxNSA5LjU4NzYyIDcuNTYwODUgOS41MjcwMUM3LjQxMjU0IDkuNDY2NCA3LjI3Nzg5IDkuMzc2NjggNy4xNjQ4NCA5LjI2MzE1QzcuMDUxNzkgOS4xNDk2MiA2Ljk2MjY0IDkuMDE0NTkgNi45MDI2NSA4Ljg2NjA0QzYuODQyNjcgOC43MTc0OCA2LjgxMzA2IDguNTU4NCA2LjgxNTU4IDguMzk4MjFDNi44MTQ1MSA4LjIzNzk3IDYuODQ1MTQgOC4wNzkxIDYuOTA1NzEgNy45MzA3NEM2Ljk2NjI4IDcuNzgyMzggNy4wNTU1OCA3LjY0NzQ4IDcuMTY4NSA3LjUzMzc3QzcuMjgxNDEgNy40MjAwNyA3LjQxNTY5IDcuMzI5ODEgNy41NjM2MiA3LjI2ODIxQzcuNzExNTUgNy4yMDY2IDcuODcwMiA3LjE3NDg2IDguMDMwNDQgNy4xNzQ4QzguMTkyNDQgNy4xNzQ5NyA4LjM1MjgxIDcuMjA3MTYgOC41MDIzMyA3LjI2OTUzQzguNjUxODQgNy4zMzE5IDguNzg3NTUgNy40MjMyMiA4LjkwMTY0IDcuNTM4MjJDOS4wMTU3NCA3LjY1MzIzIDkuMTA1OTcgNy43ODk2NiA5LjE2NzE1IDcuOTM5NjdDOS4yMjgzMiA4LjA4OTY4IDkuMjU5MjQgOC4yNTAzIDkuMjU4MTEgOC40MTIzQzkuMjU3MDYgOC41NzIyOCA5LjIyNDM0IDguNzMwNDcgOS4xNjE4NCA4Ljg3Nzc1QzkuMDk5MzQgOS4wMjUwMiA5LjAwODMgOS4xNTg0NiA4Ljg5Mzk3IDkuMjcwMzdDOC43Nzk2NCA5LjM4MjI4IDguNjQ0MjggOS40NzA0NCA4LjQ5NTcgOS41Mjk3N0M4LjM0NzEzIDkuNTg5MSA4LjE4ODI3IDkuNjE4NDMgOC4wMjgzIDkuNjE2MDZaIiBmaWxsPSIjMUNENkQxIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfNDMxN183MjIiIHgxPSIzLjU1MjE2IiB5MT0iMi40NjcwOCIgeDI9IjE2LjUzOTgiIHkyPSIxLjgyMjQ2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNDQkZFMDAiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMUNENkQxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg==')`,
                },
              },
            }}
            onChange={() => {
              if (multibridgeMode) {
                dispatch(resetToken())
              }
              dispatch(setMultiBridgeMode(!multibridgeMode))
            }}
          />
        </Box>
      }

      <BridgeTransfer />

      </S.BobaBridgeWrapper>

      <S.HistoryLink
        onClick={() => {
          dispatch(setPage('History'))
        }}
        display="flex" justifyContent="center">
        <Typography
          sx={{ cursor: 'pointer' }}
          variant="body2"
          component="span">
        {"Transaction History >"}
        </Typography>
      </S.HistoryLink>
    </>
  )
}

export default React.memo(BobaBridge)
