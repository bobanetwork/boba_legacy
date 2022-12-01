import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

import { Box, Menu, MenuItem, Typography } from '@mui/material';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';

import LayerSwitcher from 'components/mainMenu/layerSwitcher/LayerSwitcher';
import Tabs from 'components/tabs/Tabs';
import NetworkListItem from './NetworkListItem'

import {NetworkList, NETWORK_TYPE } from 'util/network/network.util';

import * as S from './NetworkSwitcher.styles'
import { setNetwork } from 'actions/networkAction';
import { selectNetwork, selectNetworkType } from 'selectors/networkSelector';

function NetworkSwitcher() {
  const dispatch = useDispatch();

  const [ anchorEl, setAnchorEl ] = useState(null);
  const open = Boolean(anchorEl);

  const [ activeTab, setActiveTab ] = useState(NETWORK_TYPE.MAINNET);

  const network = useSelector(selectNetwork());
  const networkType = useSelector(selectNetworkType());

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onChainChange = ({ icon, chain }) => {
    dispatch(setNetwork({
      network: chain,
      networkIcon: icon,
      networkType: activeTab,
    }));
  }

  useEffect(() => {
    setActiveTab(networkType)
    return () => {
      setActiveTab(NETWORK_TYPE.MAINNET)
    };
  }, [networkType]);

  return (
    <>
      <S.LayerSwitcherContainer>
        <LayerSwitcher />
        <KeyboardArrowDown onClick={handleClick} />
      </S.LayerSwitcherContainer>
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
            onClick={(tab) => setActiveTab(tab)}
            activeTab={activeTab}
            tabs={[ NETWORK_TYPE.MAINNET, NETWORK_TYPE.TESTNET ]}
          />
        </Box>
        {NetworkList[ activeTab ].map((chainItem) => {
          const isActive = networkType === activeTab && chainItem.chain === network
          return <NetworkListItem
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

export default NetworkSwitcher;
