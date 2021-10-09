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

import React from 'react'
import BN from 'bignumber.js'
import * as S from './Input.styles'

import Button from 'components/button/Button'

import { Box, Typography } from '@material-ui/core'
import { useTheme } from '@emotion/react'
import { getCoinImage } from 'util/coinImage'

function Input({
  placeholder,
  label,
  type = 'text',
  disabled,
  icon,
  unit,
  value,
  onChange,
  onUseMax,
  sx,
  paste,
  maxValue,
  fullWidth,
  size,
  variant,
  newStyle = false,
  allowUseAll = false,
  allowExitAll = false,
  onExitAll,
  loading,
}) {

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        onChange({ target: { value: text } })
      }
    } catch (err) {
      // navigator clipboard api not supported in client browser
    }
  }

  function handleClickMax() {
    onUseMax()
  }

  const underZero = new BN(value).lt(new BN(0)) 
  const overMax = new BN(value).gt(new BN(maxValue))
  const theme = useTheme()

  //since ETH is the fee token, harder to use all b/c need to take 
  //operation-specific fees into account 
  allowUseAll = (unit === 'ETH') ? false : allowUseAll

  return (
    <>
      <S.Wrapper newstyle={newStyle ? 1 : 0}>
        {unit && (
          <S.UnitContent>
            <div>
              <Typography variant="body2" component="div">{unit}</Typography>
              <img src={getCoinImage(unit)} alt="logo" width={50} height={50} />
            </div>
          </S.UnitContent>
        )}

        <S.InputWrapper>
          {label && (
            <Typography variant="body2" component="div" sx={{opacity: 0.7, mb: 1}}>
              {label}
            </Typography>
          )}
          <S.TextFieldTag
            placeholder={placeholder}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            fullWidth={fullWidth}
            size={size}
            variant={variant}
            error={underZero || overMax}
            sx={sx}
            newstyle={newStyle ? 1 : 0}
          />
        </S.InputWrapper>

        {unit && (
          <S.ActionsWrapper>
            <Typography variant="body2" component="p" sx={{opacity: 0.7, textAlign: "end", mb: 2}}>
              Max Amount: {Number(maxValue).toFixed(3)}
            </Typography>
            {allowUseAll && (
              <Box>
                <Button onClick={handleClickMax} variant="small" >
                  Use All
                </Button>
              </Box>
            )}
            {allowExitAll && (
              <Box>
                <Button 
                  onClick={onExitAll}
                  variant="small" 
                  size="small"
                  sx={{margin: '10px 0px'}}
                  loading={loading}
                  triggerTime={new Date()}
                  tooltip={loading ? "Your transaction is still pending. Please wait for confirmation." : "Click here to bridge your funds to L1"}
                >
                  Bridge All
                </Button>
              </Box>
            )}
          </S.ActionsWrapper>
        )}
        {paste && (
          <Box onClick={handlePaste} sx={{color: theme.palette.secondary.main, opacity: 0.9, cursor: 'pointer', position: 'absolute', right: '70px', fontSize: '14px'}}>
            PASTE
          </Box>
        )}
      </S.Wrapper>
      {value !== '' && underZero ?
        <Typography variant="body2" sx={{mt: 1}}>
          Value too small: the value must be greater than 0
        </Typography>
        : null
      }
      {value !== '' && overMax ?
        <Typography variant="body2" sx={{mt: 1}}>
          Value too large: the value must be smaller than {Number(maxValue).toFixed(3)}
        </Typography>
        : null}
    </>
  )
}

export default React.memo(Input)