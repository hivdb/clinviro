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

import Breadcrumb from '../../fragments/breadcrumb';
import {FormGroup, style as formStyle} from '../../fragments/forms';
import QueryList from '../../fragments/query-list';
import PatientVisitsSelector from './patient-visits-selector';
import Button from '../../fragments/button';
import style from '../style.css';
import {DATE_FORMAT, TIME_FORMAT} from '../../../constants';
import {isEditable} from '../../../utils/editable';


class PatientQueryList extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static propTypes = {
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired
    }),
    nameFuzzymatch: PropTypes.string,
    mrid: PropTypes.string
  };

  handleAddPatientVisitClick() {
    this.context.router.push({
      pathname: '/patients/new-sample'
    });
  }

  render() {
    const editable = isEditable();
    const {
      nameFuzzymatch, mrid,
      viewer: {patients: connection},
      location: {pathname}} = this.props;
    const params = [{
      name: 'nameFuzzymatch',
      label: 'Patient name',
      type: 'text',
      initialValue: nameFuzzymatch
    }, {
      name: 'mrid',
      label: 'Medical record number',
      type: 'text',
      initialValue: mrid
    }];
    const columns = [{
      name: 'ptnum',
      title: '# Patient'
    }, {
      name: 'lastname'
    }, {
      name: 'firstname'
    }, {
      name: 'birthday',
      valueDecorator: v => (
        v ? moment(v).format(DATE_FORMAT) :
        <em className={style.queryListTrivia}>UNKNOWN</em>
      )
    }, {
      name: 'medicalRecords',
      valueDecorator: v => v.map(({mrid}, idx) => (
        <div key={idx}>{mrid}</div>
      ))
    }, {
      name: 'createdAt',
      valueDecorator: v => moment(v).format(TIME_FORMAT)
    }, {
      name: 'visits',
      title: 'Patient visits',
      valueDecorator: (v, {ptnum}) => <PatientVisitsSelector
                                       visits={v} ptnum={ptnum} />
    }, {
      name: 'options',
      valueDecorator: (v, {ptnum}) => (
        <Button
          to={`/patients/patient-${ptnum}`}
          btnSize="small">
           View{editable ? ' / Edit' : null}
        </Button>
      )
    }];

    const formExtras = <FormGroup className={formStyle.pullRight}>
      <Button
       btnStyle="info" to="/patients/new-sample">
        Add new patient sample
      </Button>
    </FormGroup>;

    const elements = connection.edges.map(({node}) => node);

    return <div>
      <Breadcrumb
       paths={[{
         to: '/',
         label: 'Home'
       }, {
         to: '/patients',
         label: 'Patients',
         isCurrent: true
       }]} />
      <h1>Patient list</h1>
      <QueryList {...{elements, params, columns, pathname, formExtras}} />
    </div>;
  }

}


export function preparePatientQueryParams(params, {location}) {
  let {name_fuzzymatch: nameFuzzymatch, mrid, first} = location.query;
  nameFuzzymatch = nameFuzzymatch || null;
  mrid = mrid || null;
  first = parseInt(first || 50, 10);
  if (first > 200) {
    first = 200;
  }
  return {
    ...params,
    nameFuzzymatch,
    mrid,
    first
  };
}


export default Relay.createContainer(
  PatientQueryList,
  {
    initialVariables: {
      first: 50,
      nameFuzzymatch: null,
      mrid: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          patients(first: $first, nameFuzzymatch: $nameFuzzymatch, mrid: $mrid) {
            edges {
              node {
                ptnum
                firstname
                lastname
                birthday
                createdAt
                visits(first: 100) {
                  ${PatientVisitsSelector.getFragment('visits')}
                }
                medicalRecords { mrid }
              }
            }
          }
        }
      `
    }
  }
);
