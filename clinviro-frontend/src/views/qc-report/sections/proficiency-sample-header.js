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
import ReportHeader from './header';


export default class ProficiencySampleReportHeader extends React.Component {

  render() {
    const {
      name, source, vnum, algorithm, sequence,
      received_at, /*entered_at, */generated_at, generated_by
    } = this.props;

    return (
      <ReportHeader
       items={[
         {
           name: 'Algorithm:',
           value: (
             <span>
               {algorithm.name}{' '}
               {algorithm.version}{' '}
               (last updated {algorithm.publish_date})
             </span>
           )
         }, {
           name: 'Generated at:',
           value: generated_by ? `${generated_at} (by ${generated_by})` : generated_at
         }, {
           name: '\xa0',
           value: '\xa0'
         }, {
           name: '\xa0',
           value: '\xa0'
         }, {
           name: 'Sample ID:',
           value: name
         }, {
           name: 'Source:',
           value: source
         }, {
           name: 'Received on:',
           value: received_at
         }, {
           name: 'Accession #:',
           value: vnum
         }/*, {
           name: 'Entered at:',
           value: entered_at
         }*/, {
           name: 'Filename:',
           value: (sequence && sequence.filename) || 'N/A'
         }
       ]} />
    );
  }

}
