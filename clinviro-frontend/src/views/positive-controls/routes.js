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
import {IndexRoute, Route} from 'react-router';

import PositiveControlQueryList, {preparePositiveControlQueryParams} from './query-list';
import NewPositiveControl from './new';
import OnePositiveControl from './one';
import PositiveControlReports from './reports';

const viewerQueries = {
  viewer: () => Relay.QL`
    query { viewer }
  `
};

const routes = (
  <Route
   path="positive-controls">
    <IndexRoute
     queries={viewerQueries}
     prepareParams={preparePositiveControlQueryParams}
     component={PositiveControlQueryList} />
    <Route
     path="new"
     queries={viewerQueries}
     component={NewPositiveControl} />
    <Route
     path="posctl-:id"
     queries={viewerQueries}
     component={OnePositiveControl} />
    <Route
     path="posctl-:id/reports"
     queries={viewerQueries}
     component={PositiveControlReports} />
  </Route>
);

export default routes;
