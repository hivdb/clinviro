/**
 * ClinViro
 * Copyright (C) 2017 Stanford HIVDB team.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import Relay from 'react-relay/classic';
import {IndexRoute, Route/*, Redirect*/} from 'react-router';

import Home from './views/home';
import Layout from './views/layout';
import PageNotFound from './views/errors/page-not-found';
import patientRoutes from './views/patients/routes';
import userRoutes from './views/users/routes';
import positiveControlRoutes from './views/positive-controls/routes';
import proficiencySampleRoutes from './views/proficiency-samples/routes';
import QualityControlReport from './views/qc-report';

const viewerQueries = {
  viewer: () => Relay.QL`
    query { viewer }
  `
};

function checkAuth(_, {location: {pathname, search}}, replace) {
  if (window.__userAuthenticated || pathname.startsWith('/users/log')) {
    return;
  }
  const query = {};
  if (pathname != '/') {
    query.r = pathname;
    query.q = search;
  }
  replace({pathname: '/users/login', query});
}

const routes = <Route
  path="/"
  onEnter={(...args) => checkAuth(null, ...args)}
  onChange={checkAuth}
  queries={viewerQueries}
  component={Layout}>
  <IndexRoute component={Home} />
  {patientRoutes}
  {userRoutes}
  {positiveControlRoutes}
  {proficiencySampleRoutes}
  <Route path="quality-control-report" component={QualityControlReport} />
  <Route path="**" component={PageNotFound} />
</Route>;

export default routes;
