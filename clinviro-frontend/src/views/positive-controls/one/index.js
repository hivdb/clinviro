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
import {Row, Col} from 'react-flexbox-grid';
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle';

import Button from '../../fragments/button';
import ErrorBox from '../../errors/error-box';
import Breadcrumb from '../../fragments/breadcrumb';
import PositiveControlEditForm from '../edit-form';
import {isEditable} from '../../../utils/editable';
import {style as formStyle} from '../../fragments/forms';

import {isPositiveControlChanged} from '../comparisons';

class OnePositiveControl extends React.Component {

  constructor() {
    super(...arguments);
    this.state = this.initialState;
  }

  _getInitialState(props) {
    const {
      viewer: {
        positiveControls: {
          edges: [{
            node
          }]
        }
      }
    } = props;
    let {
      note, lotNumber, testCode,
      sequence, labnotes} = node;
    labnotes = labnotes || '';
    return {
      note, lotNumber, testCode,
      sequence: {
        header: sequence.filename,
        sequence: sequence.naseq,
        subtype: {
          name: sequence.subtype
        },
        genes: sequence.genes,
        fileName: sequence.filename
      },
      labnotes
    };
  }

  get initialState() {
    return this._getInitialState(this.props);
  }

  get isApproved() {
    return this.props.viewer.positiveControls.edges[0].node.isApproved;
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
    /*const {id} = this.props;
    const {note, lotNumber, testCode, sequence, labnotes, receivedAt} = this.state;
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
      new UpdatePatient({patient, ptnum, lastname, firstname,
                         birthday, newMrids, mergeMrids})
    );*/
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
           to: '/positive-controls',
           label: 'Positive controls'
         }, {
           to: `/positive-controls/${id}`,
           label: 'View positive control',
           isCurrent: true
         }]} />
        {!isApproved ?
         <ErrorBox narrow IconComponent={FaExclamationTriangle}>
           This sample has not been approved or auto-approved. Manual review is required.
         </ErrorBox>: null}
        <h1>View positive control</h1>
        <p>
          View and/or edit positive control infomation.
          <Button
           className={formStyle.pullRight}
           btnStyle="info"
           to={`/positive-controls/posctl-${id}/reports`}>
            Download Report
          </Button>
        </p>
      </Col></Row>
      <Row>
        <Col sm={12} md={7}>
          <PositiveControlEditForm
           {...this.state}
           editableByDefault={false}
           submitText="Apply"
           showSubmit={isChanged}
           showReset={isChanged}
           readOnly={readOnly}
           onSubmit={this.handleSubmit.bind(this)}
           onChange={this.handleChange.bind(this)}
           onReset={this.handleReset.bind(this)} />
        </Col>
      </Row>
    </div>;
  }
}

export default Relay.createContainer(
  OnePositiveControl,
  {
    initialVariables: {
      id: null
    },
    fragments: {
      viewer:() => Relay.QL`
        fragment on Viewer {
          positiveControls(ids: [$id], first: 1) {
            edges {
              node {
                id
                note
                lotNumber
                testCode
                isApproved
                sequence {
                  naseq
                  subtype
                  genes
                  filename
                }
                labnotes
              }
            }
          }
        }
      `
    }
  }
);

