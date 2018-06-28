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


export default class PatientReportHeader extends React.Component {

  render() {
    const {
      patient, clinic, physician, test_code,
      vnum, collected_at, received_at, entered_at,
      generated_at, generated_by, amplifiable, sequence
    } = this.props;
    let algorithm;
    if (amplifiable) {
      algorithm = this.props.algorithm;
    }

    return (
      <ReportHeader
       items={[
         {
           name: 'Algorithm:',
           value: (amplifiable ?
             <span>
               {algorithm.name}{' '}
               {algorithm.version}{' '}
               (last updated {algorithm.publish_date})
             </span>
             : 'N/A')
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
           name: 'Last name:',
           value: patient.lastname
         }, {
           name: 'First name:',
           value: patient.firstname
         }, {
           name: 'DOB:',
           value: patient.birthday
         }, {
           name: 'Physician:',
           value: physician.lastname + (physician.firstname ? `, ${physician.firstname}` : '')
         }, {
           name: 'Clinic:',
           value: clinic.name
         }, {
           name: 'Accession #:',
           value: patient.ptnum > 0 ? `${vnum} (ptnum: ${patient.ptnum})` : `${vnum} (new patient)`
         }, {
           name: 'MRN:',
           value: patient.mrid
         }, {
           name: 'Filename:',
           value: (sequence && sequence.filename) || 'N/A'
         }, {
           name: 'Test code:',
           value: test_code
         }, {
           name: 'Received on:',
           value: received_at
         }, {
           name: 'Collected on:',
           value: collected_at
         }/*, {
           name: 'Entered at:',
           value: entered_at
         }*/
       ]} />
    );
  }

}
