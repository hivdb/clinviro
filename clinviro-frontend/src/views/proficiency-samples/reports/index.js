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


class ProficiencySampleReports extends React.Component {

  constructor() {
    super(...arguments);
    this.state = {generating: false};
  }

  get profsample() {
    return this.props.viewer.proficiencySamples.edges[0].node;
  }

  get reports() {
    return this.profsample.reports;
  }

  handleReportsUpdate() {
    this.props.relay.forceFetch();
  }

  render() {
    const {id} = this.props;
    const {profsample, reports} = this;
    return <div>
      <Row><Col sm={12}>
        <Breadcrumb
         paths={[{
           to: '/',
           label: 'Home'
         }, {
           to: '/proficiency-samples',
           label: 'Proficiency samples'
         }, {
           to: `/proficiency-samples/profsample-${id}`,
           label: 'View proficiency sample'
         }, {
           to: `/proficiency-samples/profsample-${id}/reports`,
           label: 'View reports',
           isCurrent: true
         }]}/>
        <h1>Download resistance reports</h1>
        <p>
          List, download and re-generate proficiency sample resistance reports.
        </p>
      </Col></Row>
      <Row><Col sm={7}>
        <Infobox
         items={[{
           title: profsample.source,
           value: profsample.name
         }, {
           title: 'Accession #',
           value: profsample.vnum
         }, {
           title: 'Test code',
           value: profsample.testCode
         }, {
           title: 'Received on',
           value: moment(profsample.receivedAt).format(DATE_FORMAT)
         }]} />
        <BaseReports
         reports={reports} type='proficiency_sample' uid={id}
         onUpdate={this.handleReportsUpdate.bind(this)} />
      </Col></Row>
    </div>;
  }

}

export default Relay.createContainer(
  ProficiencySampleReports,
  {
    initialVariables: {
      id: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          proficiencySamples(ids: [$id], first: 1) {
            edges {
              node {
                id
                name
                source
                vnum
                testCode
                reports {
                  ${BaseReports.getFragment('reports')}
                }
                receivedAt
              }
            }
          }
        }
      `
    }
  }
);


