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

import ProficiencySampleQueryList, {prepareProficiencySampleQueryParams} from './query-list';
import NewProficiencySample from './new';
import OneProficiencySample from './one';
import ProficiencySampleReports from './reports';

const viewerQueries = {
  viewer: () => Relay.QL`
    query { viewer }
  `
};

const routes = (
  <Route
   path="proficiency-samples">
    <IndexRoute
     queries={viewerQueries}
     prepareParams={prepareProficiencySampleQueryParams}
     component={ProficiencySampleQueryList} />
    <Route
     path="new"
     queries={viewerQueries}
     component={NewProficiencySample} />
    <Route
     path="profsample-:id"
     queries={viewerQueries}
     component={OneProficiencySample} />
    <Route
     path="profsample-:id/reports"
     queries={viewerQueries}
     component={ProficiencySampleReports} />
  </Route>
);

export default routes;
