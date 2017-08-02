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

import PatientQueryList, {preparePatientQueryParams} from './query-list';
import NewPatient from './new';
import OnePatient from './one';
import NewSample from './new-sample';
import OneSample from './one-sample';
import Reports from './reports';
import DailyReports, {prepareDailyReportsQueryParams} from './daily-reports';

const viewerQueries = {
  viewer: () => Relay.QL`
    query { viewer }
  `
};

const routes = (
  <Route
   path="patients">
    <IndexRoute
     queries={viewerQueries}
     prepareParams={preparePatientQueryParams}
     component={PatientQueryList} />
    <Route
     path="new-sample"
     queries={viewerQueries}
     component={NewPatient} />
    <Route
     path="daily-reports"
     queries={viewerQueries}
     prepareParams={prepareDailyReportsQueryParams}
     component={DailyReports} />
    <Route
     path="patient-:ptnum">
      <IndexRoute
       queries={viewerQueries}
       component={OnePatient} />
      <Route
       queries={viewerQueries}
       path="new-sample"
       component={NewSample} />
      <Route
       queries={viewerQueries}
       path="visits/:visitId"
       component={OneSample} />
      <Route
       queries={viewerQueries}
       path="visits/:visitId/sample-:sampleId"
       component={OneSample} />
      <Route
       queries={viewerQueries}
       path="visits/:visitId/sample-:sampleId/reports"
       component={Reports} />
    </Route>
  </Route>
);

export default routes;
