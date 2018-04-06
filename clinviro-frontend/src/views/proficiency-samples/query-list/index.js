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
import moment from 'moment-timezone';
import momentPropTypes from 'react-moment-proptypes';

import Button from '../../fragments/button';
import Breadcrumb from '../../fragments/breadcrumb';
import SequenceViewer from '../../fragments/sequence-viewer';
import {FormGroup, style as formStyle} from '../../fragments/forms';
import QueryList from '../../fragments/query-list';
import {DATE_FORMAT} from '../../../constants';
import {isEditable} from '../../../utils/editable';
import SourceSelect from '../source-select';


class ProficiencySampleQueryList extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static propTypes = {
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired
    }),
    source: PropTypes.string,
    vnumPrefix: PropTypes.string,
    receivedAfter: momentPropTypes.momentObj,
    receivedBefore: momentPropTypes.momentObj
  };

  constructor() {
    super(...arguments);
    this.state = {
      mutationsDialogSequence: null
    };
  }

  openMutationsDialog(mutationsDialogSequence) {
    return () => {
      this.setState({mutationsDialogSequence});
    };
  }

  closeMutationsDialog() {
    this.setState({mutationsDialogSequence: null});
  }

  render() {
    const editable = isEditable();
    const {mutationsDialogSequence} = this.state;
    const {
      source, vnumPrefix, receivedBefore,
      viewer: {proficiencySamples: connection},
      location: {pathname}} = this.props;
    const params = [{
      name: 'source',
      label: 'Source',
      type: SourceSelect,
      initialValue: source
    }, {
      name: 'vnumPrefix',
      label: 'Accession #',
      type: 'text',
      initialValue: vnumPrefix
    }, {
      name: 'receivedBefore',
      label: 'Before',
      type: 'date',
      initialValue: receivedBefore
    }];
    const columns = [{
      name: 'source'
    }, {
      name: 'name'
    }, {
      name: 'vnum',
      title: 'Accession #'
    }, {
      name: 'testCode'
    }, {
      name: 'subtype',
      dataSource: 'sequence',
      valueDecorator: v => v.subtype
    }, {
      name: 'receivedAt',
      title: 'Received on',
      valueDecorator: v => moment(v).format(DATE_FORMAT)
    }, {
      name: 'options',
      valueDecorator: (v, {id, sequence}) => [
        <Button
         onClick={this.openMutationsDialog(sequence.naseq)}
         key={1} btnSize="small" margin="right">
          Mutations
        </Button>,
        <Button
         key={2}
         to={`/proficiency-samples/profsample-${id}`}
         btnSize="small">
          View{editable ? ' / Edit' : null}
        </Button>
      ]
    }];

    const formExtras = <FormGroup className={formStyle.pullRight}>
      <Button
       btnStyle="info"
       to="/proficiency-samples/new">
        Add new proficiency sample
      </Button>
    </FormGroup>;

    const elements = connection.edges.map(({node}) => node);

    return <div>
      <Breadcrumb
       paths={[{
         to: '/',
         label: 'Home'
       }, {
         to: '/proficiency-samples',
         label: 'Proficiency samples',
         isCurrent: true
       }]} />
      <h1>Proficiency sample list</h1>
      <QueryList {...{elements, params, columns, pathname, formExtras}} />
      {mutationsDialogSequence ?
       <SequenceViewer
        onClose={this.closeMutationsDialog.bind(this)}
        sequence={mutationsDialogSequence} /> : null}
    </div>;
  }

}


export function prepareProficiencySampleQueryParams(params, {location}) {
  let {
    first, source, vnum_prefix: vnumPrefix,
    received_after: receivedAfter,
    received_before: receivedBefore
  } = location.query;
  receivedAfter = receivedAfter ? moment.tz(receivedAfter, 'MM-DD-YYYY', 'UTC').toDate() : null;
  receivedBefore = receivedBefore ? moment.tz(receivedBefore, 'MM-DD-YYYY', 'UTC').toDate() : null;
  first = parseInt(first || 50, 10);
  if (first > 200) {
    first = 200;
  }
  source = source || null;
  vnumPrefix = vnumPrefix || null;
  return {
    ...params, vnumPrefix,
    first, source,
    receivedAfter,
    receivedBefore
  };
}


export default Relay.createContainer(
  ProficiencySampleQueryList,
  {
    initialVariables: {
      first: 50,
      receivedAfter: null,
      receivedBefore: null,
      source: null,
      vnumPrefix: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          proficiencySamples(
            vnumPrefix: $vnumPrefix,
            first: $first, source: $source,
            receivedAfter: $receivedAfter,
            receivedBefore: $receivedBefore
          ) {
            edges {
              node {
                id
                name
                source
                vnum
                testCode
                sequence {
                  subtype
                  naseq
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
