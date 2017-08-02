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
import FormGroup from './form-group';
import ValueViewer from './value-viewer';
import humanize from 'underscore.string/humanize';
import underscored from 'underscore.string/underscored';


export default class ReadOnlyInput extends React.Component {

  static propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    placeholder: PropTypes.node.isRequired,
    value: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
  }

  static defaultProps = {
    placeholder: 'Not available',
    children: '',
    value: ''
  }

  render() {
    const {name, label, children, value, placeholder} = this.props;
    const _name = underscored(name);

    return (
      <FormGroup>
        <label htmlFor={_name}>{label ? label : humanize(name)}: </label>
        <ValueViewer
         readOnly={true}
         emptyText={placeholder}>{children || value}</ValueViewer>
      </FormGroup>
    );
  }

}
