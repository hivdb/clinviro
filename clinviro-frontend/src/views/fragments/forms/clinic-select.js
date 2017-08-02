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
import {messagesShape} from './messages';
import {CreateClinic} from '../../../mutations';

function clinicToOption({id, name, canonical, isActive}) {
  return {
    value: id,
    label: name,
    disabled: !isActive || canonical !== null
  };
}

class ClinicSelect extends React.Component {

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
    readOnly: true,
    messages: []
  }

  constructor() {
    super(...arguments);
    this.state = {newClinic: null};
  }

  get options() {
    const {newClinic} = this.state;
    const {viewer: {clinics: {edges}}, value: curValue} = this.props;
    let clinics = edges.map(({node}) => node);
    clinics = newClinic ? [newClinic].concat(clinics) : clinics;
    return clinics
    .map(clinicToOption)
    .filter(({value, disabled}) => !disabled || value === curValue);
  }

  handleCreate({label}) {
    const flag = confirm(
      'This new clinic record will be added to the database ' +
      'immediately once you clicked "OK". Please confirm.'
    );
    if (!flag) {
      return;
    }
    const onSuccess = response => {
      const {onChange} = this.props;
      const {clinic} = response.createClinic;
      this.setState({newClinic: clinic});
      onChange(clinicToOption(clinic));
    };
    this.props.relay.commitUpdate(
      new CreateClinic({name: label}),
      {onSuccess}
    );
  }

  filterOption(option, filter) {
    const {label} = option;
    return label.toLowerCase().startsWith(
      filter.trim().toLowerCase());
  }

  isOptionUnique({option, options, labelKey}) {
    return options
      .filter(existingOption => (
        existingOption[labelKey].toLowerCase() ===
        option[labelKey].toLowerCase()
      ))
      .length === 0;
  }

  isValidNewOption({label}) {
    if (!label) {
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
       isOptionUnique={this.isOptionUnique.bind(this)}
       isValidNewOption={this.isValidNewOption.bind(this)}
       name="clinicId" label="Clinic" allowCreate
       onCreate={this.handleCreate.bind(this)}
       filterOption={this.filterOption.bind(this)} />
    );
  }

}

export default Relay.createContainer(
  ClinicSelect,
  {
    initialVariables: {
      ptnum: null,
      clinicFirst: 5000
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          clinics(contextualPtnum: $ptnum, first: $clinicFirst) {
            edges { node {
              id, name,
              canonical { id }
              isActive
              aliases(first: 100) { edges { node {
                name
              } } }
            } }
          }
        }
      `
    }
  }
);
