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
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle';

import Button from '../../fragments/button';
import ErrorBox from '../../errors/error-box';
import Breadcrumb from '../../fragments/breadcrumb';
import ProficiencySampleEditForm from '../edit-form';
import {DATE_FORMAT} from '../../../constants';
import {isEditable} from '../../../utils/editable';
import {style as formStyle} from '../../fragments/forms';
import {UpdateProficiencySample, PreviewProficiencySampleReport} from '../../../mutations';
import PreviewWindow from '../../../utils/preview-window';

import {isProficiencySampleChanged} from '../comparisons';

class OneProficiencySample extends React.Component {

  constructor() {
    super(...arguments);
    this.state = this.initialState;
  }

  _getInitialState(props) {
    const {
      viewer: {
        proficiencySamples: {
          edges: [{
            node
          }]
        }
      }
    } = props;
    let {
      name, source, vnum, testCode,
      sequence, notes, labnotes, receivedAt} = node;
    receivedAt = receivedAt ? moment(receivedAt) : null;
    notes = notes || '';
    labnotes = labnotes || '';
    return {
      name, source, vnum, testCode,
      sequence: {
        header: `${sequence.fileName}-${receivedAt.format(DATE_FORMAT)}`,
        sequence: sequence.naseq,
        subtype: {
          name: sequence.subtype
        },
        genes: sequence.genes,
        fileName: sequence.filename
      },
      notes, labnotes, receivedAt,
      disabled: false
    };
  }

  get initialState() {
    return this._getInitialState(this.props);
  }

  get isApproved() {
    return this.props.viewer.proficiencySamples.edges[0].node.isApproved;
  }

  get isChanged() {
    return isProficiencySampleChanged(this.initialState, this.state);
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
    const previewWindow = new PreviewWindow();
    const onSuccess = response => {
      const {id, latestReports} = response.updateProficiencySample.updatedProficiencySample;
      const [{content}] = latestReports.filter(r => r.contentType === 'json');
      previewWindow.setLocation(
        '/quality-control-report?data_url=/depot/' + JSON.parse(content).path
      );
      this.context.router.push({
        pathname: `/proficiency-samples/profsample-${id}`
      });
    }; 
    const {id} = this.props;
    this.setState({disabled: true});
    this.props.relay.commitUpdate(
      new UpdateProficiencySample({id, ...this.state}),
      {onSuccess}
    );
  }

  handlePreview() {
    const previewWindow = new PreviewWindow();
    const onSuccess = response => {
      const blob = new Blob([response.previewProficiencySampleReport.data], {type: 'application/json'});
      const objectURL = URL.createObjectURL(blob);
      previewWindow.setLocation(
        `/quality-control-report?data_url=${encodeURIComponent(objectURL)}`,
        this.handleSubmit.bind(this)
      );
      this.setState({disabled: false});
    };
    this.setState({disabled: true});
    this.props.relay.commitUpdate(
      new PreviewProficiencySampleReport(this.state),
      {onSuccess}
    );
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this._getInitialState(nextProps));
  }

  render() {
    const {id} = this.props;
    const readOnly = !isEditable();
    const {isChanged, isApproved} = this;

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
           to: `/proficiency-samples/${id}`,
           label: 'View proficiency sample',
           isCurrent: true
         }]} />
        {!isApproved ?
         <ErrorBox narrow IconComponent={FaExclamationTriangle}>
           This sample has not been approved or auto-approved. Manual review is required.
         </ErrorBox>: null}
        <h1>View proficiency sample</h1>
        <p>
          View and/or edit proficiency sample infomation.
          <Button
           className={formStyle.pullRight}
           btnStyle="info"
           to={`/proficiency-samples/profsample-${id}/reports`}>
            Download Report
          </Button>
        </p>
      </Col></Row>
      <Row>
        <Col sm={12} md={7}>
          <ProficiencySampleEditForm
           {...this.state}
           editableByDefault={false}
           submitText="Apply"
           showPreview={isChanged}
           showReset={isChanged}
           readOnly={readOnly}
           onSubmit={this.handleSubmit.bind(this)}
           onChange={this.handleChange.bind(this)}
           onReset={this.handleReset.bind(this)}
           onPreview={this.handlePreview.bind(this)} />
        </Col>
      </Row>
    </div>;
  }
}

export default Relay.createContainer(
  OneProficiencySample,
  {
    initialVariables: {
      id: null
    },
    fragments: {
      viewer:() => Relay.QL`
        fragment on Viewer {
          proficiencySamples(ids: [$id], first: 1) {
            edges {
              node {
                id
                name
                source
                vnum
                testCode
                isApproved
                sequence {
                  naseq
                  subtype
                  genes
                  filename
                }
                notes
                labnotes
                receivedAt
              }
            }
          }
        }
      `
    }
  }
);

