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

import PropTypes from 'prop-types';
import React from 'react';
import Relay from 'react-relay/classic';
import {Row, Col} from 'react-flexbox-grid';
import Breadcrumb from '../../fragments/breadcrumb';
import {CreatePatientVisit} from '../../../mutations';
import ExistingPatientSampleEditForm from '../sample-edit-form/existing-patient';
import {isPatientVisitChanged} from '../comparisons';
import {isEditable} from '../../../utils/editable';
import SimilarSequences from '../../fragments/similar-sequences';
import PreviewWindow from '../../../utils/preview-window';
import {getReportURL} from '../utils';

class NewPatientSample extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor() {
    super(...arguments);
    this.state = this.initialState;
  }

  get patient() {
    return this.props.viewer.patients.edges[0].node;
  }

  get initialState() {
    const {ptnum} = this.props;
    const {medicalRecords: mr} = this.patient;
    return {
      ptnum,
      mrid: mr.length === 1 ? mr[0].mrid : null,
      collectedAt: null,
      vnum: '',
      testCode: null,
      isAmplifiable: true,
      sequence: null,
      physicianId: null,
      clinicId: null,
      receivedAt: null,
      notes: '',
      labnotes: ''
    };
  }

  get isChanged() {
    return isPatientVisitChanged(this.initialState, this.state);
  }

  handleChange(props) {
    this.setState(props);
  }

  handleSubmit(e) {
    e && e.preventDefault();
    let {ptnum, mrid, collectedAt, ...sample} = this.state;
    const previewWindow = new PreviewWindow();

    const onSuccess = response => {
      const {
        patientVisit: {ptnum, id},
        patientSample: {id: sampleId, latestReports}
      } = response.createPatientVisit;
      previewWindow.setLocation(getReportURL(latestReports, 'json'));
      this.context.router.push({
        pathname: `/patients/patient-${ptnum}/visits/${id}/sample-${sampleId}`,
        query: {
          redirect_to_new: 'yes'
        }
      });
    }; 

    this.props.relay.commitUpdate(
      new CreatePatientVisit({visit: {ptnum, mrid, collectedAt, sample}}),
      {onSuccess}
    );

  }

  handleReset() {
    this.setState(this.initialState);
  }

  render() {
    const {isChanged} = this;
    const {viewer} = this.props;
    const {ptnum, sequence, ...props} = this.state;
    const patientReadOnly = !isEditable();

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
           to: `/patients/patient-${ptnum}/new-sample`,
           label: 'New sample',
           isCurrent: true
         }]} />
        <h1>New patient visit & sample</h1>
        <p>
          Create a new visit record and import one sample for selected patient.
        </p>
      </Col></Row>
      <Row>
        <Col sm={12} md={7}>
          <ExistingPatientSampleEditForm
           {...{viewer, ptnum, patientReadOnly, sequence, ...props}}
           onChange={this.handleChange.bind(this)}
           showReset={isChanged}
           showPreview={isChanged}
           onSubmit={this.handleSubmit.bind(this)}
           onReset={this.handleReset.bind(this)} />
        </Col>
        <Col sm={12} md={5}>
          {sequence ?
           <SimilarSequences
            naseq={sequence.sequence}
            ptnumExclude={ptnum} />
          : null}
        </Col>
      </Row>
    </div>;
  }

}

export default Relay.createContainer(
  NewPatientSample,
  {
    initialVariables: {
      ptnum: null
    },
    fragments: {
      viewer: variables => Relay.QL`
        fragment on Viewer {
          ${ExistingPatientSampleEditForm.getFragment('viewer', {...variables})}
          patients(first: 1, ptnums: [$ptnum]) {
            edges {
              node {
                id
                ptnum
                medicalRecords { mrid }
              }
            }
          }
        }
      `
    }
  }
);
