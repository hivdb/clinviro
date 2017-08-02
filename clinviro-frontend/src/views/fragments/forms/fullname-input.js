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
import TextInput from './text-input';
import {messagesShape} from './messages';


export default class FullnameInput extends React.Component {

  static propTypes = {
    value: PropTypes.string.isRequired,
    readOnly: PropTypes.bool.isRequired,
    editableByDefault: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    messages: messagesShape.isRequired
  }

  static defaultProps = {
    editableByDefault: true,
    readOnly: false,
    onChange: () => null,
    messages: [],
    value: ''
  }

  handleChange(value) {
    let [lastname, firstname] = value.split(/,/, 2);
    if (firstname) {
      firstname = firstname.replace(/^\s+/, '');
      if (firstname.length) {
        lastname = lastname && lastname.trim();
      }
      value = `${lastname}, ${firstname}`;
    }
    else {
      firstname = '';
    }
    value = value.replace(/^\s*,\s*$/, '');
    this.props.onChange({value, lastname, firstname});
  }

  render() {
    const {value, messages, readOnly, editableByDefault} = this.props;

    return (
      <TextInput
       {...{value, messages, readOnly, editableByDefault}}
       delimiter=", "
       placeholder={['Lastname', 'Firstname']}
       name="fullname" onChange={this.handleChange.bind(this)} />
    );
  }

}
