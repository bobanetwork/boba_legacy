import { Box, Typography, useTheme } from '@mui/material'
import { fetchLookUpPrice } from 'actions/networkAction'
import { isEqual } from 'lodash'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectlayer1Balance, selectlayer2Balance } from 'selectors/balanceSelector'
import { selectLoading } from 'selectors/loadingSelector'
import { selectAccountEnabled, selectLayer } from 'selectors/setupSelector'
import { selectTokens } from 'selectors/tokenSelector'
import * as S from './Token.styles'
import { tokenTableHeads } from './token.tableHeads'
import TokenList from './tokenList/TokenList'

import lightLoader from 'images/boba2/loading_light.gif'
import darkLoader from 'images/boba2/loading_dark.gif'

function TokenPage() {

  const dispatch = useDispatch()
  const theme = useTheme()

  const accountEnabled = useSelector(selectAccountEnabled())
  const tokenList = useSelector(selectTokens)
  const networkLayer = useSelector(selectLayer())
  const childBalance = useSelector(selectlayer2Balance, isEqual)
  const rootBalance = useSelector(selectlayer1Balance, isEqual)

  const depositLoading = useSelector(selectLoading([ 'DEPOSIT/CREATE' ]))
  const exitLoading = useSelector(selectLoading([ 'EXIT/CREATE' ]))
  const balanceLoading = useSelector(selectLoading([ 'BALANCE/GET' ]))

  const disabled = depositLoading || exitLoading

  const loaderImage = (theme.palette.mode === 'light') ? lightLoader : darkLoader;

  const getLookupPrice = useCallback(() => {
    if (!accountEnabled) return
    // only run once all the tokens have been added to the tokenList
    if (Object.keys(tokenList).length < 27) return
    const symbolList = Object.values(tokenList).map((i) => {
      if (i.symbolL1 === 'ETH') {
        return 'ethereum'
      } else if (i.symbolL1 === 'OMG') {
        return 'omg'
      } else if(i.symbolL1 === 'BOBA') {
        return 'boba-network'
      }
      else {
        return i.symbolL1.toLowerCase()
      }
    })
    dispatch(fetchLookUpPrice(symbolList))
  }, [ tokenList, dispatch, accountEnabled ])


  useEffect(() => {
    if (!accountEnabled) return
    getLookupPrice()
  }, [ getLookupPrice, accountEnabled ])

  if (!accountEnabled) {

    return (
      <S.TokenPageContainer>
        <S.TokenPageContentEmpty>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.1204 2.66504C7.51906 2.66504 5.37107 4.63837 5.37107 7.12371V24.8731C5.37107 27.3585 7.51906 29.3318 10.1204 29.3318H21.9551C24.5564 29.3318 26.7044 27.3585 26.7044 24.8731C26.7044 24.0051 26.7044 14.4757 26.7044 11.9984C26.7044 11.9851 26.7044 11.9704 26.7044 11.9571C26.7044 7.20638 22.1191 2.66504 17.3711 2.66504C11.7524 2.66504 11.7391 2.66504 10.1204 2.66504ZM10.1204 5.33171C11.4417 5.33171 12.9364 5.33171 16.0377 5.33171V8.87307C16.0377 11.3584 18.1857 13.3317 20.7871 13.3317H24.0377C24.0377 16.7144 24.0377 24.0944 24.0377 24.8731C24.0377 25.8251 23.1391 26.6651 21.9551 26.6651H10.1204C8.93639 26.6651 8.03773 25.8251 8.03773 24.8731V7.12371C8.03773 6.17171 8.93639 5.33171 10.1204 5.33171ZM18.7044 5.49838C21.0671 6.12505 23.2591 8.30906 23.8711 10.6651H20.7871C19.6017 10.6651 18.7044 9.82507 18.7044 8.87307V5.49838ZM12.0377 10.6651C11.3017 10.6651 10.7044 11.2624 10.7044 11.9984C10.7044 12.7344 11.3017 13.3317 12.0377 13.3317H13.3711C14.1071 13.3317 14.7044 12.7344 14.7044 11.9984C14.7044 11.2624 14.1071 10.6651 13.3711 10.6651H12.0377ZM12.0377 15.9984C11.3017 15.9984 10.7044 16.5957 10.7044 17.3318C10.7044 18.0678 11.3017 18.6651 12.0377 18.6651H20.0377C20.7737 18.6651 21.3711 18.0678 21.3711 17.3318C21.3711 16.5957 20.7737 15.9984 20.0377 15.9984H12.0377ZM12.0377 21.3318C11.3017 21.3318 10.7044 21.9291 10.7044 22.6651C10.7044 23.4011 11.3017 23.9984 12.0377 23.9984H20.0377C20.7737 23.9984 21.3711 23.4011 21.3711 22.6651C21.3711 21.9291 20.7737 21.3318 20.0377 21.3318H12.0377Z" fill="white" fillOpacity="0.65" />
            </svg>
            <Typography variant="body3" sx={{ opacity: 0.65 }}>
              No Data
            </Typography>
          </Box>
        </S.TokenPageContentEmpty>
      </S.TokenPageContainer>
    )

  } else {

    return (
      <S.TokenPageContainer>
        <S.TokenPageContent>
          <S.TableHeading>
            {tokenTableHeads.map((item) => {
              return (
                <S.TableHeadingItem
                  sx={{
                    width: item.size,
                    flex: item.flex,
                    ...item.sx
                  }}
                  key={item.label} variant="body2" component="div">{item.label}</S.TableHeadingItem>
              )
            })}
          </S.TableHeading>
          {networkLayer === 'L2' ? !balanceLoading || !!childBalance.length ? childBalance.map((i, index) => {
            return (
              <TokenList
                key={i.currency}
                token={i}
                chain={'L2'}
                networkLayer={networkLayer}
                disabled={disabled}
              />
            )
          }) : <S.LoaderContainer>
            <img src={loaderImage} height="100%" alt="balance loading" />
          </S.LoaderContainer> : null}
          {networkLayer === 'L1' ? !balanceLoading || !!rootBalance.length ? rootBalance.map((i, index) => {
            return (
              <TokenList
                key={i.currency}
                token={i}
                chain={'L1'}
                networkLayer={networkLayer}
                disabled={disabled}
              />
            )
          }) : <S.LoaderContainer>
            <img src={loaderImage} height="100%" alt="balance loading" />
          </S.LoaderContainer> : null}
        </S.TokenPageContent>
      </S.TokenPageContainer>
    )
  }

}

export default React.memo(TokenPage)
