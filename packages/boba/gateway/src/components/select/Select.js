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

import React from 'react';
import ReactSelect from 'react-select';
import { useTheme as useThemeStyle } from 'styled-components';
import { Select as MuiSelect, MenuItem, useTheme, Typography, Box } from '@mui/material';
import styles from './Select.module.scss';
import * as S from './Select.style';
import { ArrowDropDownOutlined } from '@mui/icons-material';
import {
  Option,
  MultiValue,
  SingleValue
} from './Custom.select';
import { StyledMenu } from './styles';

function Select({
  label,
  value,
  options,
  onSelect,
  loading,
  error = '',
  className,
  newSelect = false,
  isMulti,
  isLoading = false,
}) {
  const theme = useTheme();
  const styledTheme = useThemeStyle()
  const selected = options.find(i => i.value === value);

  function renderOption(i) {
    let title = '';
    if (i.title && i.subTitle) {
      title = `${i.title} - ${i.subTitle}`;
    }
    if (i.title && !i.subTitle) {
      title = i.title;
    }
    if (i.subTitle && !i.title) {
      title = i.subTitle;
    }

    return (
      <>
        {i.image ? i.image : null}
        <Typography variant="body2">
          {title}
        </Typography>
      </>
    )
  }

  const renderLoading = (
    <S.SelectedContainer className={[ styles.selected, styles.loading ].join(' ')}>
      Loading...
    </S.SelectedContainer>
  );

  const renderSelect = (
    <>
      <MuiSelect
        IconComponent={() => <ArrowDropDownOutlined />}
        className={styles.select}
        value={value}
        onChange={onSelect}
        autoWidth
        MenuProps={{
          sx: {
            '&& .Mui-selected': {
              backgroundColor: 'transparent !important',
              color: theme.palette.secondary.main,
            },}
        }}
      >
        {options.map((i, index) => (
          <MenuItem
            key={index}
            value={i.value}
          >
            {i.description ?
              <div>
                <Typography variant="body2">
                  {i.title}
                </Typography>
                <Typography variant="body3" sx={{ opacity: 0.65, color: 'inherit' }}>
                  {i.description}
                </Typography>
              </div>
              : renderOption(i)}
          </MenuItem>
        ))}
      </MuiSelect>
      <S.SelectedContainer>
        <div className={styles.details}>
          <div className={styles.title}>{selected ? selected.title : error}</div>
          <div className={styles.subTitle}>{selected ? selected.subTitle : ''}</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.71038 12.4393C9.29616 13.0251 10.2459 13.0251 10.8317 12.4393L13.9814 9.28962C14.9264 8.34468 14.2571 6.72896 12.9208 6.72896L6.62132 6.72896C5.28496 6.72896 4.61571 8.34467 5.56066 9.28962L8.71038 12.4393Z"
            fill={theme.palette.text.primary}
            fillOpacity="0.45" />
        </svg>
      </S.SelectedContainer>
    </>
  );

  // TODO: Make use of react-select across all.
  if (newSelect) {
    return <Box className={[
      styles.Select,
      className
    ].join(' ')}>
      {label && <Box className={styles.label}>{label}</Box>}
      <ReactSelect
        value={value}
        onChange={onSelect}
        isMulti={isMulti}
        options={options}
        isLoading={isLoading}
        styles={{
          menu: (base) => ({
            ...base,
            padding: '10px 5px',
            background: styledTheme.colors.gray[ 400 ],
            borderRadius: '8px',
            zIndex: 100,
          }),
          option: (base) => ({
            ...base,
            background: styledTheme.colors.gray[ 400 ],
            cursor: 'pointer',
          }),
          control: (base) => ({
            ...base,
            background: styledTheme.colors.gray[ 400 ],
            borderRadius: '33px',
            padding: '0 10px',
            width: '100%',
            border: '0px'
          }),
          indicatorSeparator: (base) => ({
            ...base,
            display: 'none',
          }),
          singleValue: (base) => ({
            ...base,
            color: theme.color,
          }),
          multiValue: (base) => ({
            ...base,
            color: theme.color,
            marginRight: '5px',
            paddingRight: '5px',
          }),
          valueContainer: (base) => ({
            ...base,
            background: 'none',
          })
        }}
        theme={theme}
        components={{
          Option,
          MultiValue,
          SingleValue,
        }}
      />
    </Box>
  }

  return (
    <div
      className={[
        styles.Select,
        className
      ].join(' ')}
    >
      {label && <div className={styles.label}>{label}</div>}
      <S.Field>
        {loading ? renderLoading : renderSelect}
      </S.Field>
    </div>
  );
}

export default React.memo(Select);
