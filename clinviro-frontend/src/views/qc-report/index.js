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
import {BACKEND_URL} from '../../constants';
import QualityControlReport from './inner';
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle';

import ErrorBox from '../errors/error-box';

export default class QualityControlReportLoader extends React.Component {

  static propTypes = {
    location: PropTypes.shape({
      query: PropTypes.shape({
        data_url: PropTypes.string.isRequired,
        preview: PropTypes.string
      }).isRequired
    }).isRequired
  }

  constructor() {
    super(...arguments);
    this.state = {
      data: null,
      hasError: false
    };
    this._mounted = false;
  }

  async loadData({location: {query: {data_url}}}) {
    this.setState({data: null});
    if (!data_url.startsWith('blob:http')) {
      data_url = BACKEND_URL + data_url;
    }
    try {
      const resp = await fetch(data_url, {credentials: 'include'});
      const data = await resp.json();
      this.setState({data});
    } catch (err) {
      this.setState({hasError: true});
    }
  }

  componentDidMount() {
    this._mounted = true;
    this.loadData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.loadData(nextProps);
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  render() {
    const {location: {query: {data_url, preview}}} = this.props;
    const {data, hasError} = this.state;
    return <div>
      {hasError ?
       <ErrorBox
        IconComponent={FaExclamationTriangle}>
         Can not load quality control report from the <a href={data_url}>given URL</a>.
       </ErrorBox> :
       (data !== null ? <QualityControlReport {...{...data, preview}} /> : null)}
    </div>;
  }

}
