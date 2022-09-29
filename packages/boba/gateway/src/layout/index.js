/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React, { Suspense, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Box, useMediaQuery } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles'

import { setTheme } from 'actions/uiAction'

import Home from 'containers/home/Home'
import Notification from 'containers/notification/Notification'

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { selectModalState } from 'selectors/uiSelector'

import Airdrop from 'containers/airdrop/Airdrop'
import Transactions from 'containers/history/History'
import BobaScope from 'containers/bobaScope/BobaScope'
import Help from 'containers/help/Help'
import Ecosystem from 'containers/ecosystem/Ecosystem'
import Wallet from 'containers/wallet/Wallet'
import Bridge from 'containers/bridge/Bridge'
import MonsterWrapper from 'containers/monster/MonsterWrapper'
import Lock from 'containers/veboba/Lock'
import FarmWrapper from 'containers/farm/FarmWrapper'
import Dao from 'containers/dao/Dao'
import SaveWrapper from 'containers/save/SaveWrapper'
import Projects from 'containers/ecosystem/Projects'
import { ROUTES_PATH } from 'util/constant'

function App() {

  const dispatch = useDispatch()

  const theme = useSelector(selectModalState('theme'))
  const light = theme === 'light'

  const radioGreen = '#BAE21A'
  const buttonColor = '#228fe5' //blue
  const darkGrey = '#1b1c1f'

  let MUItheme = createTheme({
    palette: {
      mode: theme === 'light' ? 'light' : 'dark',
      primary: {
        main: buttonColor,
        gradient: 'linear-gradient(131.81deg, #4A6FEF 2.66%, #4251F0 124.21%)',
        contrastText: '#fff',
        border: light ? 'solid 1px rgba(0, 0, 0, 0.12)' : 'solid 1px #2d2f3a',
        borderRadius: '8px',
        borderBottom: light ? 'solid 1px rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.04)',
        tabBorderBottom: light ? `solid 2px ${buttonColor}}` : `2px solid ${buttonColor}}`,
      },
      secondary: {
        main: light ? buttonColor : buttonColor,
      },
      background: {
        default: light ? "#FFFFFF" : "#111315",
        secondary: light ? 'rgba(0, 0, 0, 0.04)' : darkGrey,
        secondaryLight: light ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.14)',
        dropdown: light ? '#dadada' : '#142031',
        modal: light ? "#fff" : '#1A1D1F',
        modalTransparent: light ? "#fff" : 'transparent',
        input: light ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.04)",
      },
      neutral: {
        main: '#fff',
        contrastText: buttonColor,
      },
    },
    typography: {
      fontFamily: [ "MrEavesXL", 'Roboto' ].join(','),
      h1: {
        fontSize: 42,
        fontWeight: 700,
      },
      h2: {
        fontSize: 32,
        fontWeight: 300,
      },
      h3: {
        fontSize: 24,
        fontWeight: 300,
      },
      h4: {
        fontSize: 20,
        fontWeight: 300,
      },
      body1: {
        fontSize: 18,
        display: 'block'
      },
      body2: {
        fontSize: 16,
        fontWeight: 400,
        lineHeight: '1.0em',
        display: 'block'
      },
      body3: {
        fontSize: 14,
        lineHeight: '1.1em',
        display: 'block'
      },
      body4: {
        fontSize: 12
      },
    },
    components: {
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {},
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            textTransform: "none",
            boxShadow: "box-shadow: 0px 0px 7px rgba(73, 107, 239, 0.35)",
            minWidth: "0",
            color: '#031313',
            "&.Mui-disabled": {
              background: light ? 'transparent' : 'rgba(255, 255, 255, 0.04)',
              color: light ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              border: light ? '1px solid rgba(0, 0, 0, 0.5)' : 'none',
            }
          },
        },
        variants: [
          {
            props: { variant: 'contained', color: 'primary' },
            style: {
              // background: 'linear-gradient(131.81deg, #4A6FEF 2.66%, #4251F0 124.21%)',
              background: buttonColor,
              borderWidth: '1.4px',
              borderColor: buttonColor,
              fontWeight: 500,
              color: '#fff',
              "&:hover": {
                boxShadow: 'inset 0px 0px 0px 3px rgba(255, 255, 255, 0.2)',
                transition: 'box-shadow 0.3s ease-in-out',
                backgroundColor: buttonColor,
              }
            },
          },
          {
            props: { variant: 'outlined', color: 'primary' },
            style: {
              color: buttonColor,
              borderColor: buttonColor,
              background: light ? '#fff' : 'none',
              borderWidth: '1.4px',
              fontWeight: 700,
              filter: "drop-shadow(0px 0px 3px rgba(73, 107, 239, 0.35))",
              "&:hover": {
                color: '#000',
                borderColor: buttonColor,
                backgroundColor: buttonColor,
                borderWidth: '1.4px',
                boxShadow: 'inset 2px 2px 13px rgba(0, 0, 0, 0.15)',
              }
            },
          },
          {
            props: { variant: 'standard', color: 'primary' },
            style: {
              color: light ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)',
              background: light ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
              borderWidth: '1.4px',
              borderColor: radioGreen,
              filter: "drop-shadow(0px 0px 7px rgba(73, 107, 239, 0.35))",
              "&:hover": {
                color: radioGreen,
                boxShadow: light ? 'none' : 'inset 2px 2px 13px rgba(0, 0, 0, 0.15)',
              }
            },
          },
          {
            props: { variant: 'contained', color: 'neutral' },
            style: {
              "&:hover": {
                opacity: 0.9,
                transition: 'opacity 0.3s ease-in-out',
              }
            },
          },
          {
            props: { variant: 'outlined', color: 'neutral' },
            style: {
              color: light ? "#000" : "rgba(255, 255, 255, 0.65)",
              borderWidth: '1.4px',
              borderColor: light ? "#000" : "rgba(255, 255, 255, 0.25)",
              "&:hover": {
                opacity: 0.9,
                borderWidth: '1.4px',
                transition: 'opacity 0.3s ease-in-out',
                borderColor: light ? "#000" : "#fff",
                boxShadow: 'inset 2px 2px 13px rgba(0, 0, 0, 0.15)',
              }
            },
          },
          {
            props: { variant: 'small' },
            style: {
              fontSize: '14px',
              background: 'linear-gradient(131.81deg, #4A6FEF 2.66%, #4251F0 124.21%)',
              textTransform: 'uppercase',
              borderRadius: '12px',
              minWidth: '0',
              "&:hover": {
                boxShadow: 'inset 0px 0px 0px 2px rgba(255, 255, 255, 0.2)',
                transition: 'box-shadow 0.3s ease-in-out',
              }
            },
          },
          {
            props: { size: 'large' },
            style: {
              fontSize: '1rem',
            },
          },
          {
            props: { size: 'small' },
            style: {
              fontSize: '0.8rem',
            },
          },
        ],
      },
      MuiInputBase: {
        backgroundColor: "#f00",
      },
      MuiAlert: {
        variants: [
          {
            props: { variant: 'simple' },
            style: {
              padding: 0,
              backgroundColor: 'transparent'
            }
          }
        ]
      }
    }
  });

  MUItheme = responsiveFontSizes(MUItheme)

  const isMobile = useMediaQuery(MUItheme.breakpoints.down('md'))

  useEffect(() => {
    const themeFromLocalStorage = localStorage.getItem('theme')
    dispatch(setTheme(themeFromLocalStorage))
  }, [ dispatch ])


  return (
    <ThemeProvider theme={MUItheme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
          <div
            style={{
              display: 'flex',
              flex: '1 0',
              flexDirection: 'column',
              minHeight: `100vh`,
              backgroundColor: `linear-gradient(180deg, #061122 0%, #08162C 100%)`
            }}
          >
            <Notification />
            <Suspense fallback={<>Loading...</>}>
              <Routes>
                <Route exact path="/" element={<Home />} >
                  <Route index element={<Bridge />} />
                  <Route path={ROUTES_PATH.BRIDGE} element={<Bridge />} />
                  <Route path={ROUTES_PATH.ECOSYSTEM} element={<Ecosystem />} >
                    <Route path=":category" element={<Projects />} />
                  </Route>
                  <Route path={ROUTES_PATH.WALLET} element={<Wallet />} />
                  <Route path={ROUTES_PATH.HISTORY} element={<Transactions />} />
                  <Route path={ROUTES_PATH.EARN} element={<FarmWrapper />} />
                  <Route path={ROUTES_PATH.STAKE} element={<SaveWrapper />} />
                  <Route path={ROUTES_PATH.LOCK} element={<Lock />} />
                  <Route path={ROUTES_PATH.DAO} element={<Dao />} />
                  <Route path={ROUTES_PATH.BOBASCOPE} element={<BobaScope />} />
                  <Route path={ROUTES_PATH.AIRDROP} element={<Airdrop />} />
                  <Route path={ROUTES_PATH.HELP} element={<Help />} />
                  <Route path={ROUTES_PATH.MONSTER} element={<MonsterWrapper />} />
                  <Route path={ROUTES_PATH.BOBA_CHAINS} element={<Ecosystem ecosystemType='BOBA'/>} >
                    <Route path=":category" element={<Projects projectType='BOBA' />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" />} />
                </Route>
              </Routes>
            </Suspense>
          </div>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
