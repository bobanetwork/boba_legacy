/*
Copyright 2019-present OmiseGO Pte Ltd

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

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { selectModalState } from 'selectors/uiSelector'

function App () {

  const dispatch = useDispatch()
  const theme = useSelector(selectModalState('theme'))
  const light = theme === 'light'

  let MUItheme = createTheme({
    palette: {
      mode: theme === 'light' ? 'light' : 'dark',
      primary: {
        main: '#506DFA',
        gradient: 'linear-gradient(131.81deg, #4A6FEF 2.66%, #4251F0 124.21%)',
        contrastText: '#fff',
      },
      secondary: {
        main: '#CCFF00',
      },
      background: {
        default: light ? "#fff" : "#061122",
        secondary: light ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)',
        secondaryLight: light ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.14)',
        dropdown: light ? '#dadada' : '#142031',
        modal: light ? "#fff" : 'rgba(32, 29, 49, 0.8)',
        modalTransparent: light ? "#fff" : 'transparent',
        input: light ? "#fff" : "rgba(9, 22, 43, 0.5)"
      },
      neutral: {
        main: '#fff',
        contrastText: '#506DFA',
      },
    },
    typography: {
      fontFamily: ["MrEavesXL", 'Roboto'].join(','),
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
      },
      body2: {
        fontSize: 16,
        fontWeight: 400,
      },
      body3: {
        fontSize: '0.8em'
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
            "&.Mui-disabled": {
              background: light ? 'transparent' : 'rgba(255, 255, 255, 0.04)',
              color: light ? 'rgba(0, 0, 0, 0.5)' :'rgba(255, 255, 255, 0.5)',
              border: light ? '1px solid rgba(0, 0, 0, 0.5)' : 'none',
            }
          },
        },
        variants: [
          {
            props: { variant: 'contained', color: 'primary' },
            style: {
              background: 'linear-gradient(131.81deg, #4A6FEF 2.66%, #4251F0 124.21%)',
              "&:hover": {
                boxShadow: 'inset 0px 0px 0px 2px rgba(255, 255, 255, 0.2)',
                transition: 'box-shadow 0.3s ease-in-out',
              }
            },
          },
          {
            props: { variant: 'outlined', color: 'primary' },
            style: {
              color: light ? '#000' : '#fff',
              borderWidth: '1.4px',
              filter: "drop-shadow(0px 0px 7px rgba(73, 107, 239, 0.35))",
              "&:hover": {
                backgroundColor: "#506DFA",
                borderWidth: '1.4px',
                boxShadow: 'inset 2px 2px 13px rgba(0, 0, 0, 0.15)',
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
              color: light ? "#000" : "#fff",
              borderWidth: '1.4px',
              borderColor: light ? "#000" : "#fff",
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
            props: { variant: 'small'},
            style: {
              fontSize: '14px',
              background: 'linear-gradient(131.81deg, #4A6FEF 2.66%, #4251F0 124.21%)',
              textTransform: 'uppercase',
              borderRadius: '4px',
              minWidth: '0',
              "&:hover": {
                boxShadow: 'inset 0px 0px 0px 2px rgba(255, 255, 255, 0.2)',
                transition: 'box-shadow 0.3s ease-in-out',
              }
            },
          },
          {
            props: { size: 'large'},
            style: {
              fontSize: '1rem',
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
  }, [dispatch])

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
            <Notification/>
            <Suspense fallback={<>Loading...</>}>
              <Routes>
                <Route exact path="/" element={<Home />} />
              </Routes>
            </Suspense>
          </div>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
