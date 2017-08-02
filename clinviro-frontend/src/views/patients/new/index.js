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
import Loader from 'react-loader';
import {Row, Col} from 'react-flexbox-grid';
import Breadcrumb from '../../fragments/breadcrumb';
import {CreatePatient, CreatePatientVisit, PreviewPatientReport} from '../../../mutations';
import PatientSampleEditForm from '../sample-edit-form';
import {isPatientVisitChanged} from '../comparisons';
import SuggestedPatients from '../suggested-patients';
import SimilarSequences from '../../fragments/similar-sequences';
import PreviewWindow from '../../../utils/preview-window';
import {getReportURL} from '../utils';

class NewPatient extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor() {
    super(...arguments);
    this.state = this.initialState;
    this._delayedSearch = null;
  }

  get initialState() {
    return {
      firstname: '',
      lastname: '',
      hasSimilarPatients: false,
      searchFullname: null,
      birthday: null,
      mrid: null,
      mridOptions: [],
      collectedAt: null,
      vnum: '',
      testCode: null,
      isAmplifiable: true,
      sequence: null,
      physicianId: null,
      clinicId: null,
      receivedAt: null,
      notes: '',
      labnotes: '',
      disabled: false
    };
  }

  get isChanged() {
    return isPatientVisitChanged(this.initialState, this.state);
  }

  handleChange(props) {
    const {fullname, mrid} = props;
    if (this._delayedSearch) {
      clearTimeout(this._delayedSearch);
    }
    const {searchFullname} = this.state;
    if (typeof(fullname) !== 'undefined' &&
        fullname !== searchFullname) {
      this._delayedSearch = setTimeout(() => (
        this.setState({searchFullname: fullname.trim()})
      ), 1000);
    }
    if (fullname && searchFullname) {
      this.setState({searchFullname: null});
    }
    if (typeof(mrid) === 'string') {
      this.setState({mridOptions: [{value: mrid, label: mrid}]});
    } else if (mrid === null) {
      this.setState({mridOptions: []});
    }
    this.setState(props);
  }

  prepareVisitProps() {
    const {mrid, collectedAt} = this.state;
    const {
      testCode, sequence, vnum, isAmplifiable, physicianId,
      clinicId, notes, labnotes, receivedAt
    } = this.state;
    const sample = {
      testCode, sequence, vnum, isAmplifiable, physicianId,
      clinicId, notes, labnotes, receivedAt
    };
    return {mrid, collectedAt, sample};
  }

  handleSubmit(e) {
    e && e.preventDefault();
    const {lastname, firstname, birthday, mrid} = this.state;
    const visitProps = this.prepareVisitProps();
    const previewWindow = new PreviewWindow();
    this.setState({disabled: true});

    const onPatientCreated = response => {
      const {ptnum} = response.createPatient.patient;
      const onSuccess = response => {
        const {
          patientVisit: {ptnum, id},
          patientSample: {latestReports}
        } = response.createPatientVisit;
        previewWindow.setLocation(getReportURL(latestReports, 'json'));
        this.context.router.push({
          pathname: `/patients/patient-${ptnum}/visits/${id}`,
          query: {
            redirect_to_new: 'yes'
          }
        });
      }; 

      this.props.relay.commitUpdate(
        new CreatePatientVisit({visit: {ptnum, ...visitProps}}),
        {onSuccess}
      );
    };

    this.props.relay.commitUpdate(
      new CreatePatient({patient: {lastname, firstname, birthday, mrids: [mrid]}}),
      {onSuccess: onPatientCreated}
    );
  }

  handlePreview() {
    const previewWindow = new PreviewWindow();
    // this.setState({disabled: true});
    const {lastname, firstname, birthday} = this.state;
    const visitProps = this.prepareVisitProps();
    const onReportFetched = response => {
      const blob = new Blob([response.previewPatientReport.data], {type : 'application/json'});
      const objectURL = URL.createObjectURL(blob);
      previewWindow.setLocation(
        `/quality-control-report?data_url=${encodeURIComponent(objectURL)}`,
        this.handleSubmit.bind(this)
      );
      this.setState({disabled: false});
    };

    this.props.relay.commitUpdate(
      new PreviewPatientReport({lastname, firstname, birthday, ...visitProps}),
      {onSuccess: onReportFetched}
    );
  }

  handleReset() {
    this.setState(this.initialState);
    if (this._delayedSearch) {
      clearTimeout(this._delayedSearch);
    }
    this._delayedSearch = null;
  }

  handleSimilarPatientsChange({count}) {
    const hasSimilarPatients = count > 0;
    if (hasSimilarPatients !== this.state.hasSimilarPatients) {
      this.setState({hasSimilarPatients});
    }
  }

  render() {
    const {isChanged} = this;
    const {viewer} = this.props;
    const {
      searchFullname, lastname,
      firstname, sequence, ...props} = this.state;
    const fullname = firstname ? `${lastname}, ${firstname}` : lastname;

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
           to: `/patients/new-sample`,
           label: 'New patient and sample',
           isCurrent: true
         }]} />
        <h1>Create new patient & sample</h1>
        <p>
          Create a new patient along with a newly collected sample.
        </p>
      </Col></Row>
      <Row>
        <Col sm={12} md={7}>
          <PatientSampleEditForm
           {...{...props, viewer, fullname, sequence}}
           onChange={this.handleChange.bind(this)}
           showReset={isChanged}
           showPreview={isChanged}
           patientEditableByDefault={true}
           onSubmit={this.handleSubmit.bind(this)}
           onReset={this.handleReset.bind(this)}
           onPreview={this.handlePreview.bind(this)} />
        </Col>
        <Col sm={12} md={5}>
          {searchFullname ?
           <Relay.RootContainer
            Component={SuggestedPatients}
            forceFetch={true}
            renderLoading={() => <Loader loaded={false} />}
            route={{
              queries: {
                viewer: () => Relay.QL`
                  query { viewer }
                `
              },
              params: {
                fullname: searchFullname,
                onChange: this.handleSimilarPatientsChange.bind(this),
                newSample: true
              },
              name: 'suggestedPatientsQueryConfig'
            }} /> : null}
          {sequence ? <SimilarSequences naseq={sequence.sequence} /> : null}
        </Col>
      </Row>
    </div>;
  }

}

export default Relay.createContainer(
  NewPatient,
  {
    initialVariables: {
      fullname: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          ${PatientSampleEditForm.getFragment('viewer', {ptnum: null})}
        }
      `
    }
  }
);


