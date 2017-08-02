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

const DATE_FORMAT = 'MM/DD/YYYY';
const URL_DATE_FORMAT = 'MM-DD-YYYY';
const TIME_FORMAT = 'MM/DD/YYYY HH:mm';
const SUPPORT_DATE_FORMATS = [
  'MM/DD/YYYY',
  'M/D/YYYY',
  'MM-DD-YYYY',
  'MMDDYYYY',
  'M-D-YYYY',
  'YYYY-MM-DD',
  'YYYY-M-D',
  'YYYY/MM/DD',
  'YYYY/M/D'
];
const TEST_CODE_OPTIONS = [{
  value: 'AVRT',
  label: 'AVRT'
}, {
  value: 'AVIN',
  label: 'AVIN'
}, {
  value: 'PR',
  label: 'PR only',
  deprecated: true
}, {
  value: 'RT',
  label: 'RT only',
  deprecated: true
}, {
  value: 'PRRTIN',
  label: 'PR + RT + IN',
  deprecated: true
}];
const BACKEND_URL = window.__NODE_ENV === 'production' ? '' : 'http://localhost:5000';
const PROFICIENCY_SAMPLE_SOURCES = ['CAP', 'VQA'];

export {
  DATE_FORMAT, URL_DATE_FORMAT, TEST_CODE_OPTIONS, PROFICIENCY_SAMPLE_SOURCES,
  TIME_FORMAT, SUPPORT_DATE_FORMATS, BACKEND_URL };
