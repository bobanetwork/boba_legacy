import React, { useState } from 'react'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import LayerSwitcher from './LayerSwitcher';
import * as S from './LayerSwitcher.styles';
import { Menu, MenuItem, Typography } from '@mui/material';
import ChainSwitcherItem from './ChainSwitcherItem'
import ChainList from 'util/chainsConfigs';
import { useDispatch } from 'react-redux';
import { setCurrentAppChain } from 'actions/setupAction';
import { useSelector } from 'react-redux';
import { selectCurrentAppChain } from 'selectors/setupSelector';

function ChainSwitcher({}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const dispatch = useDispatch();
  const appChain = useSelector(selectCurrentAppChain())

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onChainChange = ({ chain }) => {
    dispatch(setCurrentAppChain(chain));
  }

  return (
    <>
      <S.LayerSwitcherWrapper>
        <LayerSwitcher />
        <KeyboardArrowDown onClick={handleClick} />
      </S.LayerSwitcherWrapper>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem divider>
          <Typography flex={1} variant="body2" >
            Please select one to enter the <br />
            independent chain bridge.
          </Typography>
        </MenuItem>
        {ChainList.map((chainItem) => <ChainSwitcherItem
          currentChain={appChain}
          onChainChange={(d) => {
            onChainChange(d);
            handleClose();
          }}
          {...chainItem}
        />)}
      </Menu>
    </>
  )
}

export default ChainSwitcher;
