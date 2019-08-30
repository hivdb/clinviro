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

import {CreatePositiveControl} from '../../../mutations';
import SimilarSequences from '../../fragments/similar-sequences';
import Breadcrumb from '../../fragments/breadcrumb';
import PositiveControlEditForm from '../edit-form';

import {isPositiveControlChanged} from '../comparisons';

class NewPositiveControl extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor() {
    super(...arguments);
    this.state = this.initialState;
  }

  _getInitialState() {
    return {
      note: 'POSVQA',
      lotNumber: '19017001',
      testCode: null,
      sequence: null,
      labnotes: '',
      disabled: false
    };
  }

  get initialState() {
    return this._getInitialState();
  }

  get isChanged() {
    return isPositiveControlChanged(this.initialState, this.state);
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
    e.preventDefault();
    const onSuccess = response => {
      const {id} = response.createPositiveControl.positiveControl;
      this.context.router.push({
        pathname: `/positive-controls/posctl-${id}`
      });
    }; 
    this.setState({disabled: true});
    this.props.relay.commitUpdate(
      new CreatePositiveControl(this.state),
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
           to: '/positive-controls',
           label: 'Positive controls'
         }, {
           to: `/positive-controls/new`,
           label: 'New positive control',
           isCurrent: true
         }]} />
        <h1>Create positive control</h1>
        <p>Create a new positive control sequence.</p>
      </Col></Row>
      <Row>
        <Col sm={12} md={7}>
          <PositiveControlEditForm
           {...this.state}
           editableByDefault={true}
           submitText="Submit"
           showSubmit={isChanged}
           showReset={isChanged}
           onSubmit={this.handleSubmit.bind(this)}
           onChange={this.handleChange.bind(this)}
           onReset={this.handleReset.bind(this)} />
        </Col>
        <Col sm={12} md={5}>
          {sequence ? <SimilarSequences naseq={sequence.sequence} removePositiveControls /> : null}
        </Col>
      </Row>
    </div>;
  }
}

export default Relay.createContainer(
  NewPositiveControl,
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

