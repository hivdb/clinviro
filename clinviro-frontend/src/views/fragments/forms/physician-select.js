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
import FormSelect from './select';
import {CreatePhysician} from '../../../mutations';
import {messagesShape} from './messages';

function physicianToOption({id, lastname, firstname}) {
  return {
    value: id,
    label: firstname ? `${lastname}, ${firstname}` : lastname
  };
}

class PhysicianSelect extends React.Component {

  static propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    editableByDefault: PropTypes.bool.isRequired,
    readOnly: PropTypes.bool.isRequired,
    messages: messagesShape.isRequired
  }

  static defaultProps = {
    value: null,
    onChange: () => null,
    editableByDefault: true,
    readOnly: false,
    messages: []
  }

  constructor() {
    super(...arguments);
    this.state = {newPhysician: null};
  }

  get options() {
    const {newPhysician} = this.state;
    const {viewer: {physicians: {edges}}} = this.props;
    let physicians = edges.map(({node}) => node);
    physicians = newPhysician ? [newPhysician].concat(physicians) : physicians;
    return physicians.map(physicianToOption);
  }

  handleCreate({label}) {
    const flag = confirm(
      'This new physician record will be added to the database ' +
      'immediately once you clicked "OK". Please confirm.'
    );
    if (!flag) {
      return;
    }
    let [lastname, firstname] = label.split(/,/, 2);
    const onSuccess = response => {
      const {onChange} = this.props;
      const {physician} = response.createPhysician;
      this.setState({newPhysician: physician});
      onChange(physicianToOption(physician));
    };
    this.props.relay.commitUpdate(
      new CreatePhysician({lastname, firstname}),
      {onSuccess}
    );
  }

  filterOption(option, filter) {
    const {label} = option;
    return label.toLowerCase().startsWith(
      filter.split(/,/, 2)
      .map( s => s.trim())
      .join(', ').toLowerCase());
  }

  isOptionUnique({option, options, labelKey}) {
    return options
      .filter(existingOption => (
        existingOption[labelKey].toLowerCase() ===
        option[labelKey].split(/,/, 2)
        .map(s => s.trim()).join(', ')
        .toLowerCase()
      ))
      .length === 0;
  }

  isValidNewOption({label}) {
    if (!label) {
      return false;
    }
    else if (label.split(',').filter(n => n.trim()).length !== 2) {
      return false;
    }
    return true;
  }

  render() {
    const {options} = this;
    const {value, onChange, editableByDefault, readOnly, messages} = this.props;

    return (
      <FormSelect
       {...{options, value, onChange, editableByDefault, readOnly, messages}}
       onCreate={this.handleCreate.bind(this)}
       isValidNewOption={this.isValidNewOption.bind(this)}
       isOptionUnique={this.isOptionUnique.bind(this)}
       filterOption={this.filterOption.bind(this)}
       name="physicianId" label="Physician" allowCreate />
    );
  }
}

export default Relay.createContainer(
  PhysicianSelect,
  {
    initialVariables: {
      ptnum: null,
      physicianFirst: 5000
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          physicians(contextualPtnum: $ptnum, first: $physicianFirst) {
            edges { node { id, lastname, firstname } }
          }
        }
      `
    }
  }
);
