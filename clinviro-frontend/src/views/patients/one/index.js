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

import {UpdatePatient} from '../../../mutations';
import Breadcrumb from '../../fragments/breadcrumb';
import PatientEditForm from '../edit-form';
import {isPatientChanged} from '../comparisons';
import Infobox from '../../fragments/infobox';
import InfoboxPlaceholder from '../../fragments/infobox/placeholder';
import {DATE_FORMAT} from '../../../constants';
import {isEditable} from '../../../utils/editable';

class OnePatient extends React.Component {

  constructor() {
    super(...arguments);
    this.state = this.initialState;
  }

  _getInitialState(props) {
    const {
      viewer: {
        patients: {
          edges: [{
            node
          }]
        }
      }
    } = props;
    let {
      lastname, firstname,
      medicalRecords, birthday} = node;
    const fullname = `${lastname}, ${firstname}`;
    const mrids = medicalRecords.map(({mrid}) => mrid);
    birthday = birthday ? moment(birthday) : null;
    return {
      lastname, firstname, fullname,
      mrids, birthday, mergedMRIDs: {},
      activeMRID: ''
    };
  }

  get initialState() {
    return this._getInitialState(this.props);
  }

  get isChanged() {
    return isPatientChanged(this.initialState, this.state);
  }

  get indelibleMRIDs() {
    const {
      viewer: {
        patients: {
          edges: [{
            node: {medicalRecords}
          }]
        }
      }
    } = this.props;
    return (medicalRecords
            .filter(({visitsCount}) => visitsCount > 0)
            .map(({mrid}) => mrid));
  }

  handleChange(props) {
    this.setState(props);
  }

  handleReset() {
    setTimeout(() => (
      this.setState(this.initialState)
    ));
  }

  handleSubmit(e) {
    e && e.preventDefault();
    const {ptnum} = this.props;
    const {mrids: initialMrids} = this.initialState;
    const {lastname, firstname, birthday, mrids, mergedMRIDs} = this.state;
    const newMrids = mrids.filter(mrid => initialMrids.indexOf(mrid) === -1);
    const mergeMrids = initialMrids.map(mrid => {
      if (mrid in mergedMRIDs) {
        // merged MRIDs
        return {mridFrom: mrid, mridTo: mergedMRIDs[mrid]};
      }
      else if (mrids.indexOf(mrid) === -1) {
        // deleted MRIDs
        return {mridFrom: mrid, mridTo: null};
      }
      else { return false; }
    }).filter(n => n !== false);

    const {
      viewer: {
        patients: {
          edges: [{
            node: patient
          }]
        }
      }
    } = this.props;

    this.props.relay.commitUpdate(
      new UpdatePatient({
        patient, ptnum, lastname, firstname,
        birthday, newMrids, mergeMrids
      })
    );
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this._getInitialState(nextProps));
  }

  render() {
    let {
      ptnum, 
      viewer: {patients: {edges: [{node: {visits}}]}}} = this.props;
    const readOnly = !isEditable();
    const {isChanged, indelibleMRIDs} = this;
    visits = [].concat(visits.edges).reverse().map(({node}) => node);
    const newSampleLink = `/patients/patient-${ptnum}/new-sample`;

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
           label: 'View patient',
           isCurrent: true
         }]} />
        <h1>View patient infomation</h1>
        <p>View and/or edit patient infomation.</p>
      </Col></Row>
      <Row>
        <Col sm={12} md={7}>
          <PatientEditForm
           {...this.state}
           indelibleMRIDs={indelibleMRIDs}
           editableByDefault={false}
           submitText="Apply"
           showSubmit={isChanged}
           showReset={isChanged}
           readOnly={readOnly}
           onSubmit={this.handleSubmit.bind(this)}
           onChange={this.handleChange.bind(this)}
           onReset={this.handleReset.bind(this)} />
        </Col>
        <Col sm={12} md={5}>
          <InfoboxPlaceholder linkTo={newSampleLink}>
            Add new sample
          </InfoboxPlaceholder>
          {visits.map((visit, idx) => {
            const isMultiSamples = visit.samplesCount > 1;
            return (
              <Infobox
               key={idx}
               linkTo={`/patients/patient-${ptnum}/visits/${visit.id}`}
               hoverTip="select this visit"
               items={[{
                 title: 'MRN',
                 value: visit.mrid
               }, {
                 title: 'Physician',
                 titlePlural: 'Physicians',
                 value: Array.from(new Set(visit.samples.map(
                   ({physician}) => {
                     if (!physician) {
                       return null;
                     }
                     const {lastname, firstname} = physician;
                     return firstname ? `${lastname}, ${firstname}` : lastname;
                   }
                 )))
               }, {
                 title: 'Clinic',
                 titlePlural: 'Clinics',
                 value: Array.from(new Set(visit.samples.map(
                   ({clinic}) => clinic ? clinic.name : null)))
               }, {
                 title: 'Collected on',
                 value: moment(visit.collectedAt).format(DATE_FORMAT)
               }, {
                 title: `${visit.samplesCount} sample${isMultiSamples ? 's' : ''}`,
                 value:visit.samples.map(
                   ({testCode}) => testCode).join(', ')
               }]} />
            );
          })}
        </Col>
      </Row>
    </div>;
  }
}

export default Relay.createContainer(
  OnePatient,
  {
    initialVariables: {
      ptnum: null
    },
    fragments: {
      viewer:() => Relay.QL`
        fragment on Viewer {
          patients(ptnums: [$ptnum], first: 1) @relay(isConnectionWithoutNodeID: true) {
            edges {
              node {
                ${UpdatePatient.getFragment('patient')}
                id
                ptnum
                firstname
                lastname
                birthday
                medicalRecords { mrid, visitsCount }
                visits(first: 100) {
                  edges {
                    node {
                      id
                      mrid
                      collectedAt
                      samplesCount
                      samples {
                        id
                        testCode
                        physician { id, lastname, firstname}
                        clinic {id, name}
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `
    }
  }
);

