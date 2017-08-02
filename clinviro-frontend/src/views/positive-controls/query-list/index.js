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
import {FormGroup, style as formStyle} from '../../fragments/forms';
import QueryList from '../../fragments/query-list';
import {DATE_FORMAT} from '../../../constants';
import {isEditable} from '../../../utils/editable';


class PositiveControlQueryList extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static propTypes = {
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired
    }),
    enteredAfter: momentPropTypes.momentObj,
    enteredBefore: momentPropTypes.momentObj
  };

  constructor() {
    super(...arguments);
  }

  render() {
    const editable = isEditable();
    const {
      enteredAfter, enteredBefore,
      viewer: {positiveControls: connection},
      location: {pathname}} = this.props;
    const params = [{
      name: 'enteredAfter',
      label: 'Entered after',
      type: 'date',
      initialValue: enteredAfter
    }, {
      name: 'enteredBefore',
      label: 'Entered before',
      type: 'date',
      initialValue: enteredBefore
    }];
    const columns = [{
      name: 'note'
    }, {
      name: 'lotNumber'
    }, {
      name: 'testCode'
    }, {
      name: 'subtype',
      dataSource: 'sequence',
      valueDecorator: v => v.subtype
    }, {
      name: 'enteredAt',
      title: 'Entered at',
      valueDecorator: v => moment(v).format(DATE_FORMAT)
    }, {
      name: 'options',
      valueDecorator: (v, {id}) => (
        <Button
         to={`/positive-controls/posctl-${id}`}
         btnSize="small">
          View{editable ? ' / Edit' : null}
        </Button>
      )
    }];

    const formExtras = <FormGroup className={formStyle.pullRight}>
      <Button
       btnStyle="info"
       to="/positive-controls/new">
        Add new positive control sequence
      </Button>
    </FormGroup>;

    const elements = connection.edges.map(({node}) => node);

    return <div>
      <Breadcrumb
       paths={[{
         to: '/',
         label: 'Home'
       }, {
         to: '/positive-controls',
         label: 'Positive controls',
         isCurrent: true
       }]} />
      <h1>Positive control sequence list</h1>
      <QueryList {...{elements, params, columns, pathname, formExtras}} />
    </div>;
  }

}


export function preparePositiveControlQueryParams(params, {location}) {
  let {
    first,
    entered_after: enteredAfter,
    entered_before: enteredBefore} = location.query;
  enteredAfter = enteredAfter ? moment.tz(enteredAfter, 'MM-DD-YYYY', 'UTC').toDate() : null;
  enteredBefore = enteredBefore ? moment.tz(enteredBefore, 'MM-DD-YYYY', 'UTC').toDate() : null;
  first = parseInt(first || 50, 10);
  if (first > 200) {
    first = 200;
  }
  return {
    ...params,
    first,
    enteredAfter,
    enteredBefore
  };
}


export default Relay.createContainer(
  PositiveControlQueryList,
  {
    initialVariables: {
      first: 50,
      enteredAfter: null,
      enteredBefore: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          positiveControls(first: $first, enteredAfter: $enteredAfter, enteredBefore: $enteredBefore) {
            edges {
              node {
                id
                note
                lotNumber
                testCode
                sequence {
                  subtype
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
