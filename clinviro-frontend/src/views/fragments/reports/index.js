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
import moment from 'moment';
import FaDownload from 'react-icons/lib/fa/download';
import FaWord from 'react-icons/lib/fa/file-word-o';
import FaPDF from 'react-icons/lib/fa/file-pdf-o';
import FaText from 'react-icons/lib/fa/file-text-o';
import FaTrash from 'react-icons/lib/fa/trash';

import Button from '../button';
import QueryList from '../query-list';
import {CheckboxInput} from '../forms';
import {isEditable} from '../../../utils/editable';
import {DeleteReport} from '../../../mutations';
import {TIME_FORMAT, BACKEND_URL} from '../../../constants';

import {GenerateReport} from '../../../mutations';

import style from './style.css';

const REGENERATION_WARNING_MSG = (
  'This operation will regenerate a new version of report for ' +
  'current viewing sample. All old reports will be still kept in ' +
  'the list below. Click "OK" to continue.');


const CONTENT_TYPES = {
  'patient_sample': ['pdf', 'docx', 'json'],
  'proficiency_sample': ['pdf', 'json'],
  'positive_control': ['json']
};

const CONTENT_TYPE_LABELS = {
  'pdf': 'PDF',
  'docx': 'MS Word',
  'json': 'QC report'
};

const CONTENT_TYPE_ICONS = {
  'pdf': FaPDF,
  'docx': FaWord,
  'json': FaText
};

const CONTENT_TYPE_BTNSTYLE = {
  'pdf': 'primary',
  'docx': 'info2',
  'json': 'info'
};

class BaseReports extends React.Component {

  static propTypes = {
    type: PropTypes.oneOf(
      ['patient_sample', 'positive_control', 'proficiency_sample']
    ).isRequired,
    uid: PropTypes.string.isRequired,
    onUpdate: PropTypes.func.isRequired
  }

  get aggregatedReports() {
    const {reports} = this.props;
    let elements = {};
    for (const {id, contentType, content, createdAt} of reports) {
      if (!content) {
        continue;
      }
      const element = elements[createdAt] = elements[createdAt] || {
        createdAt,
        reportIds: []
      };
      element[contentType] = `/depot/${JSON.parse(content).path}`;
      element.reportIds.push(id);
    }
    return Object.values(elements);
  }

  constructor() {
    super(...arguments);
    this.state = {
      generating: false,
      isRegeneratedReport: this.aggregatedReports.length > 0
    };
  }
  
  handleIsRegeneratedReportChange(e) {
    this.setState({isRegeneratedReport: e.currentTarget.checked});
  }

  handleGenerationButtonClick(e) {
    e.preventDefault();
    const {aggregatedReports} = this;
    if (aggregatedReports.length > 0 &&
        !confirm(REGENERATION_WARNING_MSG)) {
      return;
    }
    this.setState({generating: true});
    const {type, uid} = this.props;
    const {isRegeneratedReport} = this.state;

    const onSuccess = () => {
      this.props.onUpdate();
      this.setState({generating: false});
    };
    this.props.relay.commitUpdate(
      new GenerateReport({type, uid, isRegeneratedReport}),
      {onSuccess}
    );
  }

  renderDownloadButton(type, child, key = 0, btnSize = 'small',
                       btnStyle = 'default', className = null) {
    child = child || <FaDownload />;
    return url => {
      if (url) {
        return <Button
         {...{key, className}}
         href={type !== 'json' ? (BACKEND_URL + url) : null}
         to={type === 'json' ? `/quality-control-report?data_url=${encodeURIComponent(url)}` : null}
         target="_blank"
         btnStyle={btnStyle}
         btnSize={btnSize}>{child}</Button>;
      } else if (btnSize === 'small') {
        return 'N/A';
      } else {
        return null;
      }
    };
  }

  handleDeleteReport(reportIds) {
    return () => {
      const confirmed = confirm(
        "You are going to delete a report and the operation " +
        "is not reversible. Please confirm.");
      if (!confirmed) {
        return;
      }
      const {type, uid} = this.props;
      const onSuccess = () => {
        this.props.onUpdate();
      };
      this.props.relay.commitUpdate(
        new DeleteReport({type, uid, reportIds}),
        {onSuccess}
      );

    };
  }

  renderDeleteButton(reportIds) {
    return <Button
      btnSize="small"
      btnStyle="default"
      title="Delete this report"
      onClick={this.handleDeleteReport(reportIds)}>
       <FaTrash />
    </Button>;
  }

  render() {
    const {type} = this.props;
    const {aggregatedReports: elements} = this;
    const latestReport = elements[0];
    const {generating, isRegeneratedReport} = this.state;
    const columns = [{
      name: 'createdAt',
      title: 'Version',
      valueDecorator: v => moment(v).format(TIME_FORMAT)
    }];
    for (const contentType of CONTENT_TYPES[type]) {
      columns.push({
        name: contentType,
        title: CONTENT_TYPE_LABELS[contentType],
        valueDecorator: this.renderDownloadButton(contentType)
      });
    }
    if (isEditable() && elements.length > 1) {
      columns.push({
        name: 'reportIds',
        title: 'Operation',
        valueDecorator: this.renderDeleteButton.bind(this)
      });
    }
    const formExtras = <div>
      <div className={style.buttonContainer}>
        {latestReport ? CONTENT_TYPES[type].map((ctype, idx) => {
          const Icon = CONTENT_TYPE_ICONS[ctype];
          return this.renderDownloadButton(
            ctype,
            [<Icon key={0} />, ' ', CONTENT_TYPE_LABELS[ctype]],
            idx, 'normal', CONTENT_TYPE_BTNSTYLE[ctype], style.mainDownloadButton
          )(latestReport[ctype]);
        }) : null}
        <Button
         onClick={this.handleGenerationButtonClick.bind(this)}
         disabled={generating}
         className={style.generationButton}
         btnStyle="primary">Generate Report</Button>
      </div>
      <div className={style.disclaimerCheckboxContainer}>
        <CheckboxInput
         className={style.disclaimerCheckbox}
         checked={isRegeneratedReport} name="isRegeneratedReport"
         onChange={this.handleIsRegeneratedReportChange.bind(this)}>
          Add disclaimer for re-generated report
        </CheckboxInput>
      </div>
      {elements.length > 0 ? <p><br />
        Below lists all historical reports that generated for current viewing sample:
      </p> : null}
    </div>;
    return (
      <QueryList {...{elements, columns, formExtras}}
       placeHolder="No previous report was found." />
    );
  }

}

export default Relay.createContainer(
  BaseReports,
  {
    initialVariables: {},
    fragments: {
      reports: () => Relay.QL`
        fragment on Report @relay(plural: true) {
          id
          contentType
          content
          createdAt
        }
      `
    }
  }
);


