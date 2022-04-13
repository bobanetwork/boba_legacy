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

import React from 'react';
import { Select as MuiSelect, MenuItem, useTheme } from '@mui/material';
import * as styles from './Select.module.scss';
import * as S from './Select.style';
import { ArrowDropDownOutlined } from '@mui/icons-material';

function Select ({
  label,
  value,
  options,
  onSelect,
  loading,
  error = '',
  className
}) {
  const theme = useTheme();
  const selected = options.find(i => i.value === value);

  function renderOption (i) {
    if (i.title && i.subTitle) {
      return `${i.title} - ${i.subTitle}`;
    }
    if (i.title && !i.subTitle) {
      return i.title;
    }
    if (i.subTitle && !i.title) {
      return i.subTitle;
    }
  }

  const renderLoading = (
    <div className={[ styles.selected, styles.loading ].join(' ')}>
      Loading...
    </div>
  );

  const renderSelect = (
    <>
      <MuiSelect
        IconComponent={()=> <ArrowDropDownOutlined />}
        className={styles.select}
        value={value}
        onChange={onSelect}
        autoWidth
        MenuProps={{
          sx: {
            '&& .Mui-selected':{
              backgroundColor: 'transparent !important',
              color: '#BAE21A'
            }
          }
        }}
      >
        {options.map((i, index) => (
          <MenuItem
            key={index}
            value={i.value}
          >
            {renderOption(i)}
          </MenuItem>
        ))}
      </MuiSelect>
      <div className={styles.selected}>
        <div className={styles.details}>
          <div className={styles.title}>{selected ? selected.title : error}</div>
          <div className={styles.subTitle}>{selected ? selected.subTitle : ''}</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.71038 12.4393C9.29616 13.0251 10.2459 13.0251 10.8317 12.4393L13.9814 9.28962C14.9264 8.34468 14.2571 6.72896 12.9208 6.72896L6.62132 6.72896C5.28496 6.72896 4.61571 8.34467 5.56066 9.28962L8.71038 12.4393Z"
            fill={theme.palette.text.primary}
            fillOpacity="0.45" />
        </svg>
      </div>
    </>
  );

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
