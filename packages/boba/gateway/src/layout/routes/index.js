import React, { useEffect, useState } from 'react';
import { DISABLE_VE_DAO, PAGES_BY_NETWORK, ROUTES_PATH } from 'util/constant'
import { COMMON_ROUTES, ROUTE_LIST } from './routeList'
import { useSelector } from 'react-redux';
import { selectActiveNetwork } from 'selectors/networkSelector';
import { useRoutes } from 'react-router-dom';
import { intersection } from 'lodash';


export const Router = () => {

  const routeList = ROUTE_LIST;
  const [ routes, setRoutes ] = useState([]);
  const network = useSelector(selectActiveNetwork());

  useEffect(() => {
    const childRoutes = routeList[ 0 ].children;
    const fRoutes = childRoutes.filter((m) => intersection([ m.key ], PAGES_BY_NETWORK[ network.toLowerCase() ]).length);
    const _routes = [
      ...fRoutes,
      ...COMMON_ROUTES
    ].filter((r) => !r.disable)

    setRoutes([
      {
        ...routeList[ 0 ],
        children: _routes
      }
    ]);
    return () => {
      setRoutes(null)
    };
  }, [ network, routeList ]);

  console.log([ 'routes', routes[ 0 ] ])
  return useRoutes(routes);
}

export default Router;
