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

import {CreateProficiencySample, PreviewProficiencySampleReport} from '../../../mutations';
import SimilarSequences from '../../fragments/similar-sequences';
import Breadcrumb from '../../fragments/breadcrumb';
import ProficiencySampleEditForm from '../edit-form';
import PreviewWindow from '../../../utils/preview-window';

import {isProficiencySampleChanged} from '../comparisons';

class NewProficiencySample extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor() {
    super(...arguments);
    this.state = this.initialState;
  }

  _getInitialState() {
    return {
      name: '',
      source: null,
      vnum: '',
      testCode: null,
      sequence: null,
      notes: '',
      labnotes: '',
      receivedAt: null,
      disabled: false
    };
  }

  get initialState() {
    return this._getInitialState();
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
      const {id, latestReports} = response.createProficiencySample.proficiencySample;
      const [{content}] = latestReports.filter(r => r.contentType === 'json');
      previewWindow.setLocation(
        '/quality-control-report?data_url=/depot/' + JSON.parse(content).path
      );
      this.context.router.push({
        pathname: `/proficiency-samples/profsample-${id}`
      });
    }; 
    this.setState({disabled: true});
    this.props.relay.commitUpdate(
      new CreateProficiencySample(this.state),
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
    const {isChanged} = this;
    const {sequence} = this.state;

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
           to: `/proficiency-samples/new`,
           label: 'New proficiency sample',
           isCurrent: true
         }]} />
        <h1>Create proficiency sample</h1>
        <p>Create a new proficiency sample.</p>
      </Col></Row>
      <Row>
        <Col sm={12} md={7}>
          <ProficiencySampleEditForm
           {...this.state}
           editableByDefault={true}
           submitText="Submit"
           showPreview={isChanged}
           showReset={isChanged}
           onSubmit={this.handleSubmit.bind(this)}
           onChange={this.handleChange.bind(this)}
           onReset={this.handleReset.bind(this)}
           onPreview={this.handlePreview.bind(this)} />
        </Col>
        <Col sm={12} md={5}>
          {sequence ? <SimilarSequences naseq={sequence.sequence} /> : null}
        </Col>
      </Row>
    </div>;
  }
}

export default Relay.createContainer(
  NewProficiencySample,
  {
    initialVariables: {
      id: null
    },
    fragments: {
      viewer:() => Relay.QL`
        fragment on Viewer {
          version { text, date }
        }
      `
    }
  }
);

