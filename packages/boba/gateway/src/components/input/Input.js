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
import Select from 'react-select'
import * as S from './Input.styles'

import { selectCustomStyles } from './Select.styles'

import Button from 'components/button/Button'

import { Box, Typography } from '@mui/material'
import { useTheme } from '@emotion/react'
import { getCoinImage } from 'util/coinImage'

function Input({
  placeholder,
  label,
  type = 'text',
  disabled,
  disabledExitAll,
  icon,
  unit,
  value,
  onChange,
  onSelect,
  sx,
  paste,
  maxValue,
  fullWidth,
  size,
  variant,
  newStyle = false,
  allowUseAll = false,
  onUseMax,
  loading,
  maxLength,
  selectOptions,
  defaultSelect,
  selectValue,
  style,
  isBridge,
  openTokenPicker
}) {

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      console.log("copy:",text)
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

  function tokenImageElement(unit) {
    return (
      <>
        <Typography variant="body2" component="div">{unit}</Typography>
        <img src={getCoinImage(unit)} alt="logo" width={50} height={50} />
      </>
    )
  }

  const options =  selectOptions ? selectOptions.reduce((acc, cur) => {
    acc.push({ value: cur, label: tokenImageElement(cur) })
    return acc
  }, []): null

  return (
    <div style={{width: '100%'}}>
      <S.Wrapper newstyle={newStyle ? 1 : 0} style={style}>

        {!unit &&
          <S.InputWrapperFull>
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
          </S.InputWrapperFull>
        }

        {unit && (
          <>
            {selectOptions ?
              <Select
                options={options}
                styles={selectCustomStyles(newStyle, theme)}
                isSearchable={false}
                onChange={onSelect}
                value={selectValue ? { value: selectValue, label: tokenImageElement(selectValue) } : null}
              />:
              <S.UnitContent>
                <Box
                  sx={{
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                  if (isBridge) {
                    openTokenPicker()
                  }
                }}>
                  {tokenImageElement(unit)}
                </Box>
              </S.UnitContent>
            }
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
          </>
          )
        }

        {unit && (
          <S.ActionsWrapper>
            <Typography variant="body2" component="p" sx={{opacity: 0.7, textAlign: "end", mb: 2}}>
              Max Amount<br/>{Number(maxValue).toFixed(5)}
            </Typography>
            {allowUseAll && (
              <Box>
                <Button
                  onClick={handleClickMax}
                  color='primary'
                  variant='contained'
                  size="small"
                >
                  Use All
                </Button>
              </Box>
            )}
          </S.ActionsWrapper>
        )}

        {paste && (
          <Box
            onClick={handlePaste}
            sx={{color: theme.palette.secondary.main, opacity: 0.9, cursor: 'pointer', position: 'relative', right: '70px', fontSize: '14px', zIndex: '100'}}
          >
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
          Value too large: the value must be smaller than {Number(maxValue).toFixed(5)}
        </Typography>
        : null}
    </div>
  )
}

export default React.memo(Input)
