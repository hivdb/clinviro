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
import moment from 'moment';
import {Row, Col} from 'react-flexbox-grid';

import Breadcrumb from '../../fragments/breadcrumb';
import Infobox from '../../fragments/infobox';
import {DATE_FORMAT} from '../../../constants';

import BaseReports from '../../fragments/reports';


class PatientReports extends React.Component {

  constructor() {
    super(...arguments);
    this.state = {generating: false};
  }

  get patient() {
    return this.props.viewer.patients.edges[0].node;
  }

  get visit() {
    return this.props.viewer.patientVisits.edges[0].node;
  }

  get currentSample() {
    const {visit: {samples}} = this;
    const {params: {sampleId}} = this.props;
    for (const sample of samples) {
      if (sample.id === sampleId) {
        return sample;
      }
    }
    return null;
  }

  get reports() {
    return this.currentSample.reports;
  }

  handleReportsUpdate() {
    this.props.relay.forceFetch();
  }

  render() {
    const {ptnum, visitId, sampleId} = this.props;
    const {patient, visit, reports, currentSample} = this;
    return <div>
      <Row><Col sm={12}>
        <Breadcrumb
         paths={[{
           to: '/',
           label: 'Home'
         }, {
           to: '/patients',
           label: 'Patients'
         }, {
           to: `/patients/patient-${ptnum}`,
           label: 'View patient'
         }, {
           to: `/patients/patient-${ptnum}/visits/${visitId}/sample-${sampleId}`,
           label: 'View visit'
         }, {
           to: `/patients/patient-${ptnum}/visits/${visitId}/sample-${sampleId}/reports`,
           label: 'View reports',
           isCurrent: true
         }]}/>
        <h1>Download resistance reports</h1>
        <p>
          List, download and re-generate patient resistance reports.
        </p>
      </Col></Row>
      <Row><Col sm={7}>
        <Infobox
         items={[{
           title: 'Patient name',
           value: patient.lastname + (patient.firstname ? `, ${patient.firstname}` : '')
         }, {
           title: 'DOB',
           value: moment(patient.birthday).format(DATE_FORMAT)
         }, {
           title: 'MRN',
           value: visit.mrid
         }, {
           title: 'Accession #',
           value: currentSample.vnum
         }, {
           title: 'Test code',
           value: currentSample.testCode
         }, {
           title: 'Collected on',
           value: moment(visit.collectedAt).format(DATE_FORMAT)
         }]} />
        <BaseReports
         reports={reports}
         type='patient_sample'
         uid={sampleId}
         onUpdate={this.handleReportsUpdate.bind(this)} />
      </Col></Row>
    </div>;
  }

}

export default Relay.createContainer(
  PatientReports,
  {
    initialVariables: {
      ptnum: null,
      visitId: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          patients(first: 1, ptnums: [$ptnum]) {
            edges {
              node {
                firstname
                lastname
                birthday
              }
            }
          }
          patientVisits(first: 1, ids: [$visitId]) {
            edges {
              node {
                mrid
                collectedAt
                samples {
                  id
                  vnum
                  amplifiable
                  testCode
                  reports {
                    ${BaseReports.getFragment('reports')}
                  }
                  receivedAt
                }
              }
            }
          }
        }
      `
    }
  }
);


