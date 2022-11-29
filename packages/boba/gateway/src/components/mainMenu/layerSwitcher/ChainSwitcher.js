import React, { useState } from 'react'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import LayerSwitcher from './LayerSwitcher';
import * as S from './LayerSwitcher.styles';
import { Box, Menu, MenuItem, Typography } from '@mui/material';
import ChainSwitcherItem from './ChainSwitcherItem'
import ChainList from 'util/chainsConfigs';
import { useDispatch } from 'react-redux';
import { setBaseState } from 'actions/setupAction';
import { setAppChain } from 'actions/networkAction';
import { useSelector } from 'react-redux';
import { selectCurrentAppChain, selectActiveNetworkType } from 'selectors/networkSelector';
import Tabs from 'components/tabs/Tabs';

function ChainSwitcher() {
  const [ networkType, setNetworkType ] = useState('Mainnet');

  const [ anchorEl, setAnchorEl ] = useState(null);
  const open = Boolean(anchorEl);
  const dispatch = useDispatch();
  const appChain = useSelector(selectCurrentAppChain())
  const activeNetworkType = useSelector(selectActiveNetworkType())

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onChainChange = ({ chain }) => {
    dispatch(setAppChain({
      chain,
      networkType,
    }));
    // reset baseState to false to trigger initialization on chain change.
    dispatch(setBaseState(false))
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
        <Box px={2} pt={2}>
          <Tabs
            onClick={(tab) => setNetworkType(tab)}
            activeTab={networkType}
            tabs={[ 'Mainnet', 'Testnet' ]}
          />
        </Box>
        {ChainList[ networkType ].map((chainItem) => {
          const isActive = networkType == activeNetworkType && chainItem.chain == appChain
          return <ChainSwitcherItem
            isActive={isActive}
            onChainChange={(d) => {
              onChainChange(d);
              handleClose();
            }}
            {...chainItem}
          />
        })}
      </Menu>
    </>
  )
}

export default ChainSwitcher;
