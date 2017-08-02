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
import PatientReportHeader from './sections/patient-header';
import ProficiencySampleReportHeader from './sections/proficiency-sample-header';
import AmplifiableSec from './sections/amplifiable';
import SeqSummarySec from './sections/sequence-summary';
import ResistanceSec from './sections/resistance-interpretation';
import NotesSec from './sections/notes';
import ResistDetailSec from './sections/resistance-detail';
import SimilarSeqsSec from './sections/similar-sequences';
import Footer from './sections/footer';
import Button from '../fragments/button';

import style from './style.css';

export default class QualityControlReport extends React.Component {

  static propTypes = {
    preview: PropTypes.string,
    disableSubmit: PropTypes.bool.isRequired
  }

  static defaultProps = {
    disableSubmit: false
  }

  handleSubmit() {
    const {preview} = this.props;
    window.opener.postMessage(preview, window.location.origin);
  }

  render() {
    const {
      preview, report_type, notes, labnotes,
      is_regenerated_report, disableSubmit, auto_approved
    } = this.props;

    return <section>
      <h1>Quality Control Report</h1>
      {report_type === 'posctl' ?
       <p><em>
         This sequence has{' '}
         <strong className={style.warning}>{auto_approved ? 'passed' : 'failed'}</strong>{' '}
         positive control test.
         (At least one previous positive control was found and the
          distance to the previous one was lower than 0.001%.)
       </em></p>
       : null}
      {is_regenerated_report ?
       <p><em>
         Note: this regenerated report was not
         the original report.<br />
       </em></p>
      : null}
      {preview ?
       <p><em>
         Note: this report is just a preview.
         EVERYTHING WILL BE LOST IF YOU DO NOT SUBMIT THE FORM!
       </em></p>
      : null}
      {report_type === 'patient' ?
       <PatientReportHeader {...this.props} />
       : null}
      {report_type === 'profsample' ?
       <ProficiencySampleReportHeader {...this.props} />
       : null}
      <AmplifiableSec {...this.props} />
      <SeqSummarySec {...this.props} />
      <ResistanceSec {...this.props} />
      {notes ? <NotesSec title="Notes">{notes}</NotesSec> : null}
      {labnotes ? <NotesSec title="Laboratory Notes">{labnotes}</NotesSec> : null}
      <ResistDetailSec {...this.props} />
      <SimilarSeqsSec {...this.props} />
      <Footer {...this.props} />
      {preview ?
       <p className={style.previewButtonContainer}>
         <Button
          btnStyle="primary"
          disabled={disableSubmit}
          onClick={this.handleSubmit.bind(this)}>
           Submit
         </Button>
       </p> : null}
    </section>;

  }

}
