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
import {Row, Col} from 'react-flexbox-grid';

import Breadcrumb from '../fragments/breadcrumb';
import Button from '../fragments/button';

import {isEditable, setEditable} from '../../utils/editable';


const ENABLE_MESSAGE = (
  'You are going to enable all edit operations, which can allow you to ' +
  'modify & delete almost any database records without any further ' +
  'warnings. Click "OK" to continue.');


export default class UserSettings extends React.Component {

  get enabledEdits() {
    return isEditable();
  }

  set enabledEdits(value) {
    setEditable(value, 3600);
    this.forceUpdate();
  }

  toggleEditOperations() {
    if (!this.enabledEdits && !confirm(ENABLE_MESSAGE)) {
      return;
    }
    this.enabledEdits = !this.enabledEdits;
  }

  render() {
    const {enabledEdits} = this;
    return <div>
      <Row><Col sm={12}>
        <Breadcrumb
         paths={[{
           to: '/',
           label: 'Home'
         }, {
           to: '/users/self/settings',
           label: 'User settings',
           isCurrent: true
         }]} />
        <h1>User settings</h1>
      </Col></Row>
      <Row><Col sm={7}>
        <div>
          <Button
           onClick={this.toggleEditOperations.bind(this)}
           btnStyle="primary">
            {enabledEdits ? 'Disable ' : 'Enable '}
            edit operations
          </Button>
          <p>
            The edit operations (modify and delete existing patients, visits or
            samples) were disabled by default to prevent incidents. You can
            temporarily gain the ability to perform edit operations with the
            upper button.
          </p>
          <p>
            After finished your modifications, please come back here and
            disable this privilege. It will also be disabled automatically
            after 1 hour since enabled.
          </p>
        </div>
      </Col></Row>
    </div>;
  }

}
