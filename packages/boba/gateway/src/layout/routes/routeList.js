import React from 'react';
import { Navigate } from 'react-router-dom';

import { ROUTES_PATH } from "util/constant";

const Bridging = React.lazy(() => import('containers/Bridging'));
const BobaScope = React.lazy(() => import('containers/bobaScope/BobaScope'));
const OldDao = React.lazy(() => import('containers/dao/OldDao'));
const DevTools = React.lazy(() => import('containers/devtools/DevTools'));
const EarnWrapper = React.lazy(() => import('containers/earn/EarnWrapper'));
const Home = React.lazy(() => import('containers/home/Home'));
const SaveWrapper = React.lazy(() => import('containers/save/SaveWrapper'));
const History = React.lazy(() => import('containers/history/History'));

export const COMMON_ROUTES = [
  {
    path: "*",
    element: <Navigate to={ROUTES_PATH.BRIDGE} />,
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
]

export const ROUTE_LIST = [
  {
    path: '/',
    element: <Home />,
    children: [
      {
        path: ROUTES_PATH.BRIDGE,
        element: <Bridging />,
        key: 'Bridge',
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
      }
    ]
  }
]
