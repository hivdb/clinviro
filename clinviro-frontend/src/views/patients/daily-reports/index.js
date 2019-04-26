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
import {Link} from 'react-router';
import moment from 'moment';
import copy from 'copy-to-clipboard';
import FaWord from 'react-icons/lib/fa/file-word-o';
import FaPDF from 'react-icons/lib/fa/file-pdf-o';
import FaText from 'react-icons/lib/fa/file-text-o';
import FaInfo from 'react-icons/lib/fa/info';
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle';

import Button from '../../fragments/button';
import Breadcrumb from '../../fragments/breadcrumb';
import {FormGroup, CheckboxInput, style as formStyle} from '../../fragments/forms';
import QueryList from '../../fragments/query-list';
import {DATE_FORMAT, URL_DATE_FORMAT} from '../../../constants';

import style from '../style.css';
import {getReportURL} from '../utils';


class ReportButtons extends React.Component {

  static propTypes = {
    ptnum: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
    visit: PropTypes.shape({
      id: PropTypes.string.isRequired
    }).isRequired,
    latestReports: PropTypes.array
  }

  render() {
    const {
      ptnum, id: sampleId,
      visit: {id: visitId}, latestReports} = this.props;
    let qcurl = getReportURL(latestReports, 'json');
    let pdfurl = getReportURL(latestReports, 'pdf');
    let wordurl = getReportURL(latestReports, 'docx');
    let detailurl = `/patients/patient-${ptnum}/visits/${visitId}/sample-${sampleId}/reports`;
    return <div className={style.reportButtons}>
      {pdfurl ? <Button
        title="Download PDF report"
        btnStyle="primary" to={pdfurl} className={style.icon}
        btnSize="small" target="_blank"><FaPDF /></Button> : null}
      {wordurl ? <Button
        title="Download Word report" 
        btnStyle="info2" to={wordurl} className={style.icon}
        btnSize="small" target="_blank"><FaWord /></Button> : null}
      {qcurl ? <Button
        title="View QC report"
        btnStyle="info" to={qcurl} className={style.icon}
        btnSize="small" target="_blank"><FaText /></Button> : null}
      <Button
        title="Open report detail page" 
        btnStyle="default" to={detailurl} className={style.icon}
        btnSize="small" target="_blank"><FaInfo /></Button>
    </div>;
  }
}


class DailyReports extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static propTypes = {
    location: PropTypes.object.isRequired
  }

  constructor() {
    super(...arguments);
    this.state = {
      selectedSamples: new Set()
    };
  }

  toggleSelectedSample(id) {
    return e => {
      const {checked} = e.currentTarget;
      const {selectedSamples} = this.state;
      if (checked) {
        selectedSamples.add(id);
      }
      else {
        selectedSamples.delete(id);
      }
      this.setState({selectedSamples});
    };
  }

  handleCopyPLink() {
    const {origin} = window.location;
    let {sampleIds} = this.props;
    let {selectedSamples} = this.state;
    if (selectedSamples.size === 0 && sampleIds) {
      selectedSamples = new Set(sampleIds);
    }
    if (selectedSamples.size > 0) {
      const {elements} = this;
      const allSamples = new Set();
      for (const {samples} of elements) {
        for (const {id} of samples) {
          allSamples.add(id);
        }
      }
      selectedSamples = new Set(
        [...selectedSamples].filter(
          id => allSamples.has(id)
        )
      );
    }
    let plink;
    if (selectedSamples.size > 0) {
      selectedSamples = [...selectedSamples].sort().join(',');
      plink = (
        `${origin}/patients/daily-reports?sample_ids=${selectedSamples}`
      );
    }
    else {
      const {first, start, end} = this.props;
      const {removeApproved} = this;
      plink = (
        `${origin}/patients/daily-reports?start=` +
        `${moment(start).format(URL_DATE_FORMAT)}&end=` +
        `${moment(end).format(URL_DATE_FORMAT)}` +
        `&removeApproved=${removeApproved}` +
        `&first=${first}`
      );
    }
    copy(plink);
    window.alert('The permanent link is copied to the clipboard:\n' + plink);
  }

  get removeApproved() {
    const {location} = this.props;
    let {remove_approved} = location.query;
    return (remove_approved || 'false').toLowerCase() === 'true';
  }

  get elements() {
    const {
      viewer: {patientVisits: connection}
    } = this.props;
    let elements = connection.edges.map(({node}) => node);
    if (this.removeApproved) {
      elements = elements.filter(({samples}) => samples.some(({isApproved}) => !isApproved));
    }
    elements = elements.map(elem => {
      elem.samples = this.filterSamples(elem.samples);
      return elem;
    });
    return elements;
  }

  filterSamples(samples) {
    const {removeApproved} = this;
    let {sampleIds, start, end} = this.props;
    sampleIds = sampleIds ? new Set(sampleIds) : null;
    return samples.filter(
      ({id, isApproved, enteredAt}) => {
        if (removeApproved && isApproved) {
          return false;
        }
        enteredAt = moment(enteredAt);
        let r = start ? enteredAt.isSameOrAfter(start) : true;
        r = r && end ? enteredAt.isSameOrBefore(end) : true;
        if (sampleIds) {
          r = r && sampleIds.has(id);
        }
        return r;
      }
    );
  }

  render() {
    const {
      start, end, first, sampleIds,
      viewer: {patientVisits: connection},
      location: {pathname, query}} = this.props;
    const {selectedSamples} = this.state;
    const {elements} = this;
    const params = sampleIds ? [] : [{
      name: 'start',
      label: 'Entered date start',
      type: 'date',
      initialValue: start
    }, {
      name: 'end',
      label: 'End',
      type: 'date',
      initialValue: end
    }, {
      name: 'removeApproved',
      label: 'Hide approved reports',
      type: 'bool',
      initialValue: this.removeApproved
    }];
    const columns = [{
      name: 'patient',
      valueDecorator: (_, {ptnum, patient: {lastname, firstname}}) => (
        <Link className={style.link} to={`/patients/patient-${ptnum}`}>
          {lastname}{firstname ? `, ${firstname}` : ''}
        </Link>
      )
    }, {
      name: 'birthday',
      title: 'DOB',
      valueDecorator: (_, {patient: {birthday}}) => (
        birthday ? moment(birthday).format(DATE_FORMAT) : '-'
      )
    }, {
      name: 'mrid',
      title: 'MRN'
    }, {
      name: 'vnum',
      title: '# Accession',
      valueDecorator: (_, {samples}) => {
        if (new Set(samples.map(({vnum}) => vnum)).size === 1) {
          const [{vnum}] = samples;
          return vnum;
        }
        else {
          return samples.map(({vnum}, idx) => (
            <div key={idx}>{vnum}</div>
          ));
        }
      }
    }, {
      name: 'collectedAt',
      title: 'Collected on',
      valueDecorator: collectedAt => moment(collectedAt).format(DATE_FORMAT)
    }, {
      name: 'receivedAt',
      title: 'Received on',
      valueDecorator: (_, {samples}) => {
        if (new Set(samples.map(({receivedAt}) => receivedAt)).size === 1) {
          const [{receivedAt}] = samples;
          return moment(receivedAt).format(DATE_FORMAT);
        }
        else {
          return samples.map(({receivedAt}, idx) => (
            <div key={idx}>{moment(receivedAt).format(DATE_FORMAT)}</div>
          ));
        }
      }
    }, {
      name: 'enteredAt',
      title: 'Entered on',
      valueDecorator: (_, {samples}) => {
        if (new Set(samples.map(({enteredAt}) => enteredAt)).size === 1) {
          const [{enteredAt}] = samples;
          return moment(enteredAt).format(DATE_FORMAT);
        }
        else {
          return samples.map(({enteredAt}, idx) => (
            <div key={idx}>{moment(enteredAt).format(DATE_FORMAT)}</div>
          ));
        }
      }
    }, {
      name: 'testCode',
      title: 'Sample',
      valueDecorator: (_, {ptnum, samples}) => {
        return samples.map(({id, visit: {id: vid}, testCode, isApproved}, idx) => (
          <div key={idx}>
            <Link
              to={`/patients/patient-${ptnum}/visits/${vid}/sample-${id}`}
              title={isApproved ? undefined : 'This sample needs further review.'}
              className={style.link}>
              {isApproved ? null : <FaExclamationTriangle />}
              {(testCode && testCode !== '-') ? testCode : 'Unknown'}
            </Link>
            &nbsp;
            <CheckboxInput
              onChange={this.toggleSelectedSample(id)}
              name="sampleIds" value={id} noLabel
              checked={selectedSamples.has(id)} />
          </div>
        ));
      }
    }, {
      name: 'samples',
      title: 'Report',
      valueDecorator: (samples, {ptnum}) => {
        return samples.map((sample, idx) => {
          return <ReportButtons key={idx} ptnum={ptnum} {...sample} />;
        });
      }
    }];
    const formExtras = <FormGroup className={formStyle.pullRight}>
      <Button onClick={this.handleCopyPLink.bind(this)} btnStyle="primary">
        Permanent link{selectedSamples.size ? ' for selected samples' : null}
      </Button>
    </FormGroup>;

    const {pageInfo: {hasNextPage}} = connection;
    const isPlural = elements.length > 1;

    return <div>
      <Breadcrumb
        paths={[{
          to: '/',
          label: 'Home'
        }, {
          to: '/patients',
          label: 'Patients'
        }, {
          to: '/patients/daily-reports',
          label: 'Daily reports',
          isCurrent: true
        }]} />
      <h1>Patient report list</h1>
      <p>{hasNextPage ?
        `There were too many reports in this time range. Only the first ${first} patient visits were retrieved.` :
        isPlural ?
          `All ${elements.length} patient visits were retrieved.` :
          'There is only one patient visit in this time range.'}</p>
      <QueryList {...{elements, params, columns, pathname, formExtras, query}} />
    </div>;
  }

}


export function prepareDailyReportsQueryParams(params, {location}) {
  let {first, start, end, sample_ids: sampleIds} = location.query;
  sampleIds = sampleIds ? sampleIds.split(',') : null;
  if (sampleIds) {
    start = end = null;
    first = sampleIds.length;
  }
  else {
    start = start ? moment(start, 'MM-DD-YYYY') : moment().subtract(1, 'weeks').startOf('day');
    end = end ? moment(end, 'MM-DD-YYYY') : start.clone().add(8, 'days');
    start = start.toDate();
    end = end.toDate();
    first = parseInt(first || 100, 10);
  }
  if (first > 200) {
    first = 200;
  }
  if (first < 10) {
    first = 10;
  }
  return {...params, first, start, end, sampleIds};
}


export default Relay.createContainer(
  DailyReports,
  {
    initialVariables: {
      first: 100,
      start: null,
      end: null,
      sampleIds: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          patientVisits(first: $first, enteredAtStart: $start, sampleIds: $sampleIds, enteredAtEnd: $end, orderBy: id_desc) {
            pageInfo { hasNextPage }
            edges {
              node {
                ptnum
                mrid
                patient {
                  lastname
                  firstname
                  birthday
                }
                collectedAt
                samples {
                  id
                  visit {id}
                  testCode
                  vnum
                  receivedAt
                  enteredAt
                  isApproved
                  latestReports {
                    content
                    contentType
                  }
                }
              }
            }
          }
        }
      `
    }
  }
);
