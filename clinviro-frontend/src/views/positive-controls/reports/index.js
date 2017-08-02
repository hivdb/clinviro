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
import {TIME_FORMAT} from '../../../constants';

import BaseReports from '../../fragments/reports';


class PositiveControlReports extends React.Component {

  constructor() {
    super(...arguments);
    this.state = {generating: false};
  }

  get posctl() {
    return this.props.viewer.positiveControls.edges[0].node;
  }

  get reports() {
    return this.posctl.reports;
  }

  handleReportsUpdate() {
    this.props.relay.forceFetch();
  }

  render() {
    const {id} = this.props;
    const {posctl, reports} = this;
    return <div>
      <Row><Col sm={12}>
        <Breadcrumb
         paths={[{
           to: '/',
           label: 'Home'
         }, {
           to: '/positive-controls',
           label: 'Positive controls'
         }, {
           to: `/positive-controls/posctl-${id}`,
           label: 'View positive control'
         }, {
           to: `/positive-controls/posctl-${id}/reports`,
           label: 'View reports',
           isCurrent: true
         }]}/>
        <h1>Download resistance reports</h1>
        <p>
          List, download and re-generate positive control resistance &amp; QC reports.
        </p>
      </Col></Row>
      <Row><Col sm={7}>
        <Infobox
         items={[{
           value: <strong>Pos {posctl.note}</strong>
         }, {
           title: 'Lot #',
           value: posctl.lotNumber
         }, {
           title: 'Test code',
           value: posctl.testCode
         }, {
           title: 'Entered at',
           value: moment(posctl.enteredAt).format(TIME_FORMAT)
         }]} />
        <BaseReports
         reports={reports} type='positive_control' uid={id}
         onUpdate={this.handleReportsUpdate.bind(this)} />
      </Col></Row>
    </div>;
  }

}

export default Relay.createContainer(
  PositiveControlReports,
  {
    initialVariables: {
      id: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          positiveControls(ids: [$id], first: 1) {
            edges {
              node {
                id
                note
                lotNumber
                testCode
                reports {
                  ${BaseReports.getFragment('reports')}
                }
                enteredAt
              }
            }
          }
        }
      `
    }
  }
);


