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

import {BACKEND_URL}  from '../../constants';

export function getReportURL(reports, type) {
  reports = reports || [];
  reports = reports.filter(r => r.contentType === type);
  if (reports.length < 1) {
    return null;
  }
  const [{content}] = reports;
  if (type === 'json') {
    return '/quality-control-report?data_url=/depot/' + JSON.parse(content).path;
  }
  else {
    return BACKEND_URL + '/depot/' + JSON.parse(content).path;
  }
}
