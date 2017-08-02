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
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle';

import ErrorBox from './error-box';

export default class PageNotFound extends React.Component {

  render() {
    if (this.isIndexDotHtml) {
      return null;
    }
    return (
      <ErrorBox
       IconComponent={FaExclamationTriangle}>
        HTTP 404: The page you are looking for is not found.
      </ErrorBox>
    );
  }

}
