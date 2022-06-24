import { Box, FormControlLabel, Radio, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'

import Button from 'components/button/Button'
import Input from 'components/input/Input'

import { setConnectBOBA } from 'actions/setupAction'
import CalenderIcon from 'components/icons/CalenderIcon'
import * as G from 'containers/Global.styles'
import { BigNumber, utils } from 'ethers'
import { useDispatch, useSelector } from 'react-redux'
import { selectlayer2Balance } from 'selectors/balanceSelector'
import { selectAccountEnabled, selectLayer } from 'selectors/setupSelector'
import { toWei_String } from 'util/amountConvert'
import * as S from './CreateLock.styles'

const EXPIRY_OPTIONS = [
  {
    value: '3',
    label: '3 Months',
  },
  {
    value: '6',
    label: '6 Months',
  },
  {
    value: '12',
    label: '1 Year',
  },
]

function CreateLock() {

  const dispatch = useDispatch()
  const layer = useSelector(selectLayer())
  const accountEnabled = useSelector(selectAccountEnabled())
  const layer2 = useSelector(selectlayer2Balance)

  const [ value, setValue ] = useState('0');
  const [ selectedExpiry, setselectedExpiry ] = useState('3');
  const [ maxBalance, setMaxBalance ] = useState(0);

  useEffect(() => {
    //  set boba balance,
    if (layer2 && layer2.length > 0) {
      const token = Object.values(layer2).find((t) => t[ 'symbolL2' ] === 'BOBA')
      if (token) {
        let max_BN = BigNumber.from(token.balance.toString())
        setMaxBalance(utils.formatUnits(max_BN, token.decimals))
      }
    }

  }, [ layer2 ]);

  const optionsProps = ({ value, label }) => ({
    checked: selectedExpiry === value,
    onChange: (e) => setselectedExpiry(e.target.value),
    value: value,
    label: <Typography variant="body4">{label}</Typography>
  })

  async function connectToBOBA() {
    dispatch(setConnectBOBA(true))
  }


  const createLock = () => {
    console.log('value', value);
    console.log('toWeigString', toWei_String(value, 18));
    console.log('Expires', selectedExpiry);
    /*
      Dispatch the event for createLock
    */
  }


  if (!accountEnabled) {
    return <S.LockFormContainer>
      <Box>
        <Typography px={4} pt={2} variant="h2">Create New Lock</Typography>
        <G.DividerLine sx={{ my: 1 }} />
      </Box>
      <Box display="flex" flexDirection="column" py={2} px={4} gap={2}>
        <S.InlineContainer>
          <Typography variant="body2"> BOBA Balance: </Typography>
          <Typography variant="body2"> 0.0 </Typography>
        </S.InlineContainer>
        <Input
          value={0}
          type="number"
          newStyle
          disabled={true}
          variant="standard"
        />

        <S.InlineContainer>
          <Typography variant="body2"> Expires:</Typography>
          <S.InlineContainer gap="1" justifyContent="flex-end">
            {
              EXPIRY_OPTIONS.map((item) => <FormControlLabel sx={{ mx: "0" }} size="small" key={item.value} {...optionsProps(item)} control={<Radio size='small' />}>
              </FormControlLabel>)
            }
          </S.InlineContainer>
        </S.InlineContainer>

        <G.DividerLine sx={{ my: 1 }} />

        <S.InlineContainer>
          <Typography variant="body2">Convert ve BOBA Ratio</Typography>
          <Typography variant="body2"> 0 </Typography>
        </S.InlineContainer>
        <S.InlineContainer>
          <Typography variant="body2">Your voting power will be</Typography>
          <Typography variant="body2"> 0 ve BOBA </Typography>
        </S.InlineContainer>

        <Button
          fullWidth={true}
          variant="outlined"
          color="primary"
          size="large"
          onClick={() => connectToBOBA()}
        >
          Connect to BOBA
        </Button>
      </Box>
    </S.LockFormContainer>
  }

  return <S.LockFormContainer>
    <Box>
      <Typography px={4} pt={2} variant="h2">Create New Lock</Typography>
      <G.DividerLine sx={{ my: 1 }} />
    </Box>
    <Box display="flex" flexDirection="column" py={2} px={4} gap={2}>

      <S.InlineContainer>
        <Typography variant="body2"> BOBA Balance:</Typography>
        <Typography variant="body2"> {maxBalance} </Typography>
      </S.InlineContainer>
      <Input
        value={value}
        type="number"
        maxValue={maxBalance}
        onChange={i => { setValue(i.target.value) }}
        onUseMax={i => { setValue(maxBalance) }}
        newStyle
        disabled={layer !== 'L2'}
        variant="standard"
      />

      <S.InlineContainer>
        <Typography variant="body2"> Lock for</Typography>
      </S.InlineContainer>
      <S.InlineContainer>
        <Typography variant="h2"> 2022-07-31 </Typography>
        <CalenderIcon />
      </S.InlineContainer>
      <S.InlineContainer>
        <Typography variant="body2"> Expires:</Typography>
        <S.InlineContainer gap="1" justifyContent="flex-end">
          {
            EXPIRY_OPTIONS.map((item) => <FormControlLabel sx={{ mx: "0" }} size="small" key={item.value} {...optionsProps(item)} control={<Radio size='small' />}>
            </FormControlLabel>)
          }
        </S.InlineContainer>
      </S.InlineContainer>

      <G.DividerLine sx={{ my: 1 }} />

      <S.InlineContainer>
        <Typography variant="body2">Convert veBOBA Ratio</Typography>
        <Typography variant="body2"> 0 </Typography>
      </S.InlineContainer>
      <S.InlineContainer>
        <Typography variant="body2">Your voting power will be</Typography>
        <Typography variant="body2"> 2.9 ve BOBA </Typography>
      </S.InlineContainer>

      <Button
        fullWidth={true}
        variant="contained"
        color="primary"
        size="large"
        disabled={Number(value) > Number(maxBalance)}
        onClick={createLock}
      >
        {Number(value) > Number(maxBalance) ? 'Insufficient balance' : 'Lock'}
      </Button>
    </Box>
  </S.LockFormContainer>
}


export default React.memo(CreateLock)
