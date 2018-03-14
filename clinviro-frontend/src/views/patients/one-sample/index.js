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
import moment from 'moment';
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle';
import {Row, Col} from 'react-flexbox-grid';
import ExistingPatientSampleEditForm from '../sample-edit-form/existing-patient';
import {isPatientVisitChanged} from '../comparisons';
import Breadcrumb from '../../fragments/breadcrumb';
import Button from '../../fragments/button';
import OtherSamples from '../other-samples';
import {isEditable} from '../../../utils/editable';
import OptionalRedirect from '../../errors/optional-redirect';
import ErrorBox from '../../errors/error-box';
import {UpdatePatientSample, PreviewPatientReport} from '../../../mutations';
import PreviewWindow from '../../../utils/preview-window';
import {getReportURL} from '../utils';

import style from '../style.css';
import {style as formStyle} from '../../fragments/forms';

class OnePatientSample extends React.Component {

  static contextTypes = {
    router: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired
  }

  static propTypes = {
    location: PropTypes.shape({
      query: PropTypes.shape({
        redirect_to_new: PropTypes.string
      }).isRequired
    }).isRequired
  }


  constructor() {
    super(...arguments);
    this.state = this.initialState;
  }

  componentWillReceiveProps(props) {
    this.setState(this._getInitialState(props));
  }

  get redirectToNew() {
    return !!((this.props.location.query || {}).redirect_to_new);
  }

  _getInitialState(props) {
    const {ptnum, viewer} = props;
    let {params: {sampleId}} = props;
    const visit = viewer.patientVisits.edges[0].node;
    const allSamples = visit.samples.map(sample => ({
      id: sample.id,
      vnum: sample.vnum,
      testCode: sample.testCode,
      isAmplifiable: sample.amplifiable,
      isApproved: sample.isApproved,
      sequence: sample.amplifiable ? {
        header: sample.vnum,
        sequence: sample.sequence.naseq,
        subtype: {
          name: sample.sequence.subtype
        },
        genes: sample.sequence.genes,
        fileName: sample.sequence.filename
      } : null,
      physicianId: sample.physician ? sample.physician.id : null,
      clinicId: sample.clinic ? sample.clinic.id : null,
      receivedAt: sample.receivedAt ? moment(sample.receivedAt) : null,
      notes: sample.notes || '',
      labnotes: sample.labnotes || ''
    }));
    let sample, samples = [];

    // find current sample
    for (const s of allSamples) {
      if (s.id === sampleId) {
        sample = s;
      }
      else {
        samples.push(s);
      }
    }
    // or display the first sample
    if (!sample) {
      sample = samples.shift();
    }
    sampleId = sample.id;
    delete sample.id;
    return {
      ptnum,
      mrid: visit.mrid,
      collectedAt: moment(visit.collectedAt),
      ...sample,
      sampleId,
      samples,
      manuallyApproved: false,
      disabled: false
    };
  }

  get initialState() {
    return this._getInitialState(this.props);
  }

  get isChanged() {
    return isPatientVisitChanged(this.initialState, this.state);
  }

  getReportURL(report) {
    if (!report) {
      return null;
    }
    const data = JSON.parse(report.content);
    return `/depot/${data.path}`;
  }

  handleChange(props) {
    this.setState(props);
  }

  handleSubmit(e) {
    e && e.preventDefault();
    this.setState({disabled: true});
    let {sampleId, mrid, manuallyApproved, collectedAt, ...sample} = this.state;
    delete sample.ptnum;
    delete sample.samples;
    const previewWindow = new PreviewWindow();

    const onSuccess = response => {
      const {
        updatedPatientVisit: {ptnum, id: visitId},
        updatedPatientSample: {id, latestReports}
      } = response.updatePatientSample;
      previewWindow.setLocation(getReportURL(latestReports, 'json'));
      this.context.router.push({
        pathname: `/patients/patient-${ptnum}/visits/${visitId}/sample-${id}`
      });
    };

    this.props.relay.commitUpdate(
      new UpdatePatientSample({visit: {sampleId, mrid, manuallyApproved, collectedAt, sample}}),
      {onSuccess}
    );
  }

  handlePreview() {
    const previewWindow = new PreviewWindow();
    this.setState({disabled: true});
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

  handleReset(e) {
    this.setState(this.initialState);
    e && e.preventDefault();
  }

  render() {
    const {isChanged, redirectToNew} = this;
    const {viewer, visitId} = this.props;
    const readOnly = !isEditable();
    const {ptnum, samples, sampleId, isApproved, testCode, ...props} = this.state;
    const extraCount = samples.length;

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
           to: `/patients/patient-${ptnum}/visits/${visitId}`,
           label: 'View visit',
           isCurrent: true
         }]} />
        {redirectToNew && isApproved ?
         <OptionalRedirect to="/patients/new-sample">
           new sample creation page
         </OptionalRedirect> : null}
        {!isApproved ?
         <ErrorBox narrow IconComponent={FaExclamationTriangle}>
           This sample has not been approved or auto-approved. Manual review is required.
         </ErrorBox>: null}
        <h1>View patient visit &amp; sample</h1>
        <p>
          View and/or edit patient visit &amp; sample.
          {testCode == 'AVRT' || testCode == 'AVIN' ?
           <Button
            className={formStyle.pullRight}
            to={`/patients/patient-${ptnum}/visits/${visitId}/sample-${sampleId}/reports`}
            btnStyle="info">
             Download Report
           </Button> : [
             <br key="br" />,
             'This is an archived sample and no report is available. Please visit ',
             <a className={style.link} key="a" href="/archived_reports/">
               <strong>{location.origin}/archived_reports/</strong>
             </a>, ' for archived report(s).'
           ]}
        </p>
      </Col></Row>
      <Row>
        <Col sm={12} md={7}>
          <ExistingPatientSampleEditForm
           {...{viewer, ptnum, sampleId, testCode, ...props}}
           allowManualApprovement={!isApproved}
           onChange={this.handleChange.bind(this)}
           showReset={isChanged}
           showPreview={isChanged}
           editableByDefault={false}
           patientReadOnly={true /* TODO: change to readOnly once allowed editing patient */} 
           readOnly={readOnly}
           onSubmit={this.handleSubmit.bind(this)}
           onReset={this.handleReset.bind(this)}
           onPreview={this.handlePreview.bind(this)} />
        </Col>
        <Col sm={12} md={5}>
          {extraCount ? <p>
            There {extraCount > 1 ?
              `are ${extraCount} more extra samples` :
              'is one more extra sample'} collected
            on the same day.
          </p> : null}
          <OtherSamples
           allowCreate={true}
           {...{ptnum, visitId, samples}} />
        </Col>
      </Row>
    </div>;
  }

}

export default Relay.createContainer(
  OnePatientSample,
  {
    initialVariables: {
      ptnum: null,
      visitId: null
    },
    fragments: {
      viewer: variables => Relay.QL`
        fragment on Viewer {
          ${ExistingPatientSampleEditForm.getFragment('viewer', {...variables})}
          patientVisits(first: 1, ids: [$visitId]) {
            edges {
              node {
                id
                mrid
                collectedAt
                samples {
                  id
                  sequence {
                    naseq
                    subtype
                    genes
										filename
                  }
                  vnum
                  amplifiable
                  testCode
                  isApproved
                  physician { id }
                  clinic { id }
                  receivedAt
                  notes
                  labnotes
                }
              }
            }
          }
        }
      `
    }
  }
);


