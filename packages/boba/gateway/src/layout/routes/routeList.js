import React from 'react';

import { DISABLE_VE_DAO, ROUTES_PATH } from "util/constant";

import Bridge from "containers/bridge/Bridge";
import Home from "containers/home/Home";
import Projects from 'containers/ecosystem/Projects';
import Ecosystem from 'containers/ecosystem/Ecosystem';
import Wallet from 'containers/wallet/Wallet';
import OldDao from 'containers/dao/OldDao';
import History from 'containers/history/History';
import EarnWrapper from 'containers/earn/EarnWrapper';
import SaveWrapper from 'containers/save/SaveWrapper';
import MonsterWrapper from 'containers/monster/MonsterWrapper';
import { Navigate } from 'react-router-dom';
import Lock from 'containers/veboba/Lock';
import Vote from 'containers/VoteAndDao/Vote/Vote';
import BobaScope from 'containers/bobaScope/BobaScope';
import Help from 'containers/help/Help';
import DevTools from 'containers/devtools/DevTools';

export const COMMON_ROUTES = [
  {
    path: "*",
    element: <Navigate to="/" />,
    key: '',
  },
  {
    path: ROUTES_PATH.BOBASCOPE,
    element: <BobaScope />,
    key: 'bobascope',
  },
  {
    path: ROUTES_PATH.DEV_TOOLS,
    element: <DevTools />,
    key: 'Devtool',
  },
  {
    path: ROUTES_PATH.HELP,
    element: <Help />,
    key: 'help',
  }
]

export const ROUTE_LIST = [
  {
    path: '/',
    element: <Home />,
    children: [
      {
        path: ROUTES_PATH.BRIDGE,
        element: <Bridge />,
        key: 'Bridge',
      },
      {
        path: ROUTES_PATH.WALLET,
        element: <Wallet />,
        key: 'Wallet',
      },
      {
        path: ROUTES_PATH.HISTORY,
        element: <History />,
        key: 'History',
      },
      {
        path: ROUTES_PATH.EARN,
        element: <EarnWrapper />,
        key: 'Earn',
      },
      {
        path: ROUTES_PATH.STAKE,
        element: <SaveWrapper />,
        key: 'Stake',
      },
      {
        path: ROUTES_PATH.DAO,
        element: <OldDao />,
        key: 'DAO',
      },
      {
        path: ROUTES_PATH.LOCK,
        element: <Lock />,
        key: 'DAO',
        disable: !!Number(DISABLE_VE_DAO),
      },
      {
        path: ROUTES_PATH.VOTE_DAO,
        element: <Vote />,
        key: 'DAO',
        disable: !!Number(DISABLE_VE_DAO),
      },
      {
        path: ROUTES_PATH.MONSTER,
        element: <MonsterWrapper />,
        key: 'Monster',
      },
      {
        path: ROUTES_PATH.BOBA_CHAINS,
        element: <Ecosystem ecosystemType='BOBA' />,
        key: 'LinksToBobaChains',
        children: [
          {
            path: ':category',
            element: <Projects projectType='BOBA' />
          }
        ]
      },
      {
        path: ROUTES_PATH.ECOSYSTEM,
        element: <Ecosystem />,
        key: 'Ecosystem',
        children: [
          {
            path: ':category',
            element: <Projects />
          }
        ]
      }
    ]
  }
]
