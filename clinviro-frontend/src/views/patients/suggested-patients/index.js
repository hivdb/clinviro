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
import Infobox from '../../fragments/infobox';
import {DATE_FORMAT} from '../../../constants';

class SuggestedPatients extends React.Component {

  static propTypes = {
    onChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    onChange: () => null
  }

  componentWillReceiveProps(props) {
    const {
      viewer: {patients: {edges}},
      onChange} = props;
    onChange({count: edges.length});
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  render() {
    const {viewer: {patients: {edges}}, newSample} = this.props;
    let title = 'I found some patients whom have similar names:';
    if (edges.length === 1) {
      title = 'I found one patient whom has similar/same name.';
    }
    else if (edges.length === 0) {
      title = 'No similar name patient was found.';
    }

    return <div>
      <p>{title}</p>
      {edges.map(({node}, idx) => {
        const visits = node.visits.edges;
        const visitsCount = visits.length;
        return <Infobox
         key={idx}
         linkTo={`/patients/patient-${node.ptnum}${newSample ? '/new-sample' : ''}`}
         hoverTip="select this patient"
         items={[{
           title: 'Name',
           value: `${node.lastname}, ${node.firstname}`
         }, {
           title: 'DOB',
           value: node.birthday ? moment(node.birthday).format(DATE_FORMAT) : '-'
         }, {
           title: 'MRN',
           titlePlural: 'MRNs',
           value: node.medicalRecords.map(({mrid}) => mrid)
         }, {
           value: visitsCount ? <span>
             Visited {visitsCount} time
             {visitsCount > 1 ? 's' : null}. The last visit
             date is {moment(
               visits[visitsCount - 1].node.collectedAt)
               .format(DATE_FORMAT)}.
           </span> : <span>Patient has no visit record so far.</span>
         }]} />;
      })}
    </div>;
  }

}

export default Relay.createContainer(
  SuggestedPatients,
  {
    initialVariables: {
      fullname: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          patients(first: 5, nameFuzzymatch: $fullname) {
            edges {
              node {
                ptnum
                firstname
                lastname
                birthday
                visits(first: 100) { edges { node { collectedAt } } }
                medicalRecords { mrid }
              }
            }
          }
        }
      `
    }
  }
);
