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

import React, { useState } from 'react'

import { Grid, Typography,Fade } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import * as styles from './Transaction.module.scss'
import * as S from './Transaction.styles'
import { useTheme } from '@emotion/react'
import { selectNetwork } from 'selectors/setupSelector'
import { useSelector } from 'react-redux'
import { getAllNetworks } from 'util/masterConfig'
import Button from 'components/button/Button'

function Transaction({
  link,
  status,
  statusPercentage,
  subStatus,
  button,
  title,
  time,
  subTitle,
  chain,
  typeTX,
  blockNumber,
  tooltip = '',
  detail,
  oriChain,
  oriHash,
  amountTx
}) {

  const [dropDownBox, setDropDownBox] = useState(false)
  const theme = useTheme()

  const currentNetwork = useSelector(selectNetwork())
  const nw = getAllNetworks()

  const chainLink = ({chain,hash}) => {
    let network = nw[currentNetwork]
    if (!!network && !!network[chain]) {
      // network object should have L1 & L2
      // endpoint name is now network specific - `?network` no longer needed
      //if (chain === 'L1') {
          return `${network[chain].transaction}${hash}`;
      //} else {  
      //    return `${network[chain].transaction}${item.hash}?network=${currentNetwork[0].toUpperCase() + currentNetwork.slice(1)}`;
      //}
    }
    return '';
  }

  function renderDetailRedesign() {

    if (!detail) {
      return null
    }

    let prefix = 'L2'
    if (oriChain === 'L2') prefix = 'L1'

    return (

      <S.TableBody
        style={{ justifyContent: 'center' }}
      >
        <S.TableCell sx={{
          gap: '5px',
          width: '98% !important',
          padding: '10px',
          alignItems: 'flex-start !important',
        }}>
          {!!dropDownBox ? <Fade in={dropDownBox}>
            <div>
              <Grid className={styles.dropDownContent} container spacing={1}>
                <Typography variant="body3" className={styles.muted}>
                  {prefix} Hash:&nbsp;
                  <a className={styles.href} href={chainLink({ chain: prefix, hash:detail.hash})} target="_blank" rel="noopener noreferrer">
                    {detail.hash}
                  </a>
                </Typography>
              </Grid>
              <Grid className={styles.dropDownContent} container spacing={1}>
                <Typography variant="body3" className={styles.muted}>{prefix} Block:&nbsp;{detail.blockNumber}</Typography>
              </Grid>
              <Grid className={styles.dropDownContent} container spacing={1}>
                <Typography variant="body3" className={styles.muted}>{prefix} Block Hash:&nbsp;{detail.blockHash}</Typography>
              </Grid>
              <Grid className={styles.dropDownContent} container spacing={1}>
                <Typography variant="body3" className={styles.muted}>{prefix} From:&nbsp;{detail.from}</Typography>
              </Grid>
              <Grid className={styles.dropDownContent} container spacing={1}>
                <Typography variant="body3" className={styles.muted}>{prefix} To:&nbsp;{detail.to}</Typography>
              </Grid>
            </div>
          </Fade> : null}
        </S.TableCell>
      </S.TableBody>)
  }

  return (
    <
      div style={{
        padding: '10px',
        borderRadius: '8px',
        background: theme.palette.background.secondary,
      }}
    >
      <S.TableBody>

        <S.TableCell
          sx={{ gap: '5px' }}
          style={{ width: '60%' }}
        >
          <Typography variant="h3">{chain}</Typography>

          <Typography variant="body3" className={styles.muted}>
            {time}
          </Typography>

          <Typography variant="body3" className={styles.muted}>
            {oriChain}&nbsp;Hash:&nbsp;
            <a
              href={chainLink({hash:oriHash, chain: oriChain})}
              target={'_blank'}
              rel='noopener noreferrer'
              style={{ color: theme.palette.mode === 'light' ? 'black' : 'white' }}
            >
              {oriHash}
            </a>
          </Typography>

          <Typography variant="body3" className={styles.muted}>
            {typeTX}
          </Typography>

          {!!detail &&
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              onClick={() => {
                setDropDownBox(!dropDownBox)
              }}
            >
              More Information <ExpandMoreIcon />
            </Typography>
          }
        </S.TableCell>

        <S.TableCell
          sx={{ gap: '5px' }}
          style={{ width: '20%' }}
        >
          <div className={styles.muted}>
            <Typography variant="body3">
              {blockNumber}
            </Typography>
          </div>
          {amountTx ? <Typography variant="h4">{amountTx}</Typography> : null}
        </S.TableCell>

        <S.TableCell sx={{ gap: "5px" }}>
          {button &&
            <Button
              variant="contained"
              color="primary"
              sx={{
                boder: '1.4px solid #506DFA',
                borderRadius: '8px',
                width: '180px'
              }}
              onClick={button.onClick}
            >
              {button.text}
            </Button>
          }

        </S.TableCell>
      </S.TableBody>
      {renderDetailRedesign()}
    </div>)

}

export default Transaction
