# ClinViro
# Copyright (C) 2017 Stanford HIVDB team.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from flask import current_app as app
from sqlalchemy_utils.types.choice import ChoiceType
from depot.io.utils import FileIntent
from .common import SPECIMEN_TYPE_CHOICES
from .sierra import align_sequences, sequence_analysis
from ..reports import generators, prepare_data

db = app.db


associate_table = db.Table(
    'tbl_patient_sample_reports', db.Model.metadata,
    db.Column(
        'patient_sample_id', db.Integer,
        db.ForeignKey('tbl_patient_samples.id'),
        primary_key=True, doc='patient sample UID'),
    db.Column(
        'report_id', db.Integer, db.ForeignKey('tbl_reports.id'),
        primary_key=True, doc='report UID, a foreign key to tbl_reports'))


class PatientSample(db.Model):

    __tablename__ = 'tbl_patient_samples'
    __table_args__ = (
        db.UniqueConstraint(
            'vnum', 'test_code', 'patient_visit_id'),
    )

    id = db.Column(
        db.Integer, primary_key=True, nullable=False, doc='sample UID')
    vnum = db.Column(
        db.Unicode(64), nullable=False, index=True, doc='accession number')
    test_code = db.Column(
        db.Unicode(64), nullable=False, doc='test code')
    specimen_type = db.Column(
        ChoiceType(SPECIMEN_TYPE_CHOICES, db.Unicode(32)),
        nullable=False, doc='specimen type')
    patient_visit_id = db.Column(
        db.Integer, db.ForeignKey('tbl_patient_visits.id'),
        index=True, nullable=False)
    sequence_id = db.Column(
        db.Integer, db.ForeignKey('tbl_sequences.id'), unique=True)
    physician_id = db.Column(
        db.Integer,
        db.ForeignKey('tbl_physicians.id'), index=True,
        doc='physician UID, a foreign key to tbl_physicians')
    clinic_id = db.Column(
        db.Integer,
        db.ForeignKey('tbl_clinics.id'), index=True,
        doc='clinic UID, a foreign key to tbl_clinics')
    amplifiable = db.Column(
        db.Boolean,
        doc=('sample could be amplified or not. '
             'Which indicates if this record has a sequence or not'))
    notes = db.Column(db.UnicodeText, doc='notes for physician')
    labnotes = db.Column(db.UnicodeText, doc='laboratory notes')
    received_at = db.Column(
        db.Date(), index=True,
        doc='date the results were received')
    entered_at = db.Column(
        db.DateTime(timezone=True), nullable=False, index=True,
        doc='date and time this record was entered')

    # relationships
    visit = db.relationship(
        'PatientVisit', back_populates='samples',
        doc='patient visit record which this sample links to')
    sequence = db.relationship('Sequence', doc='sample sequence')
    reports = db.relationship(
        'Report', secondary=associate_table,
        order_by='desc(Report.created_at)', doc='sample report')
    physician = db.relationship(
        'Physician', doc='physician that submit this sample')
    clinic = db.relationship(
        'Clinic', doc='clinic that submit this sample')

    @property
    def latest_reports(self):
        if not self.reports:
            return []
        last_report = self.reports[0]
        results = []
        for report in self.reports:
            if report.created_at == last_report.created_at:
                results.append(report)
            else:
                break
        return results

    @property
    def is_approved(self):
        latest_reports = self.latest_reports
        if latest_reports and latest_reports[0].status == 'approved':
            return True
        return False

    @property
    def sierra_result(self):
        if not self.amplifiable:
            return {}
        elif not hasattr(self, '_sierra_result'):
            self._update_sierra_result(self.sequence.naseq)
        return self._sierra_result

    def _update_sierra_result(self, sequence):
        self._sierra_result = sequence_analysis(self.vnum, sequence)

    def set_sequence(self, sequence, filename):
        if self.amplifiable:
            seq = self.sequence = self.sequence or app.models.Sequence()
            seq.naseq = sequence
            seq.filename = filename
            self._update_sierra_result(sequence)
            seq.subtype = self.sierra_result['subtype']
            seq.genes = self.sierra_result['genes']

    def get_previous_sequences(self):
        if not self.amplifiable:
            return []
        visit = self.visit
        patient = visit.patient
        prev_sequences = []
        for prev_visit in patient.visits:
            for prev_sample in prev_visit.samples:
                if prev_sample == self or (
                        prev_sample.received_at or
                        prev_visit.collected_at) >= self.received_at:
                    continue
                if not prev_sample.amplifiable:
                    continue
                seq = prev_sample.sequence
                seq = {
                    'header': '{}|{}|{}|{}'.format(
                        prev_sample.vnum,
                        prev_visit.collected_at.strftime('%m/%d/%Y'),
                        prev_sample.entered_at.strftime('%m/%d/%Y'),
                        prev_sample.test_code
                    ),
                    'sequence': seq.naseq
                }
                prev_sequences.append(seq)
        return align_sequences(prev_sequences)

    def get_similar_sequences(self):
        if not self.amplifiable:
            return []
        patient = None
        ptnum = None
        if self.visit and self.visit.patient:
            patient = self.visit.patient
            ptnum = patient.ptnum
        return self.sequence.get_similar_sequences(
            self.entered_at, ptnum_exclude=ptnum, min_pident=97.5,
            filter_func=lambda r: (
                r.is_patient_similar_to(patient) or r.pident > 98.5
            )
        )

    def generate_reports(self, created_at,
                         is_regenerated_report=False,
                         return_json_only=False,
                         manually_approved=False):
        visit = self.visit
        patient = visit.patient
        data = self.sierra_result.get('data')
        prepared_data = prepare_data(
            self, created_at, data, is_regenerated_report)
        approved = manually_approved or prepared_data['auto_approved']
        if return_json_only:
            return prepared_data
        filename = (
            '{clinic}_{lastname}_{mrid}_{vnum}_{test_code}_{physician}_{dt}'
            .format(
                clinic=self.clinic.name if self.clinic else 'UNKNOWN',
                lastname=patient.lastname.replace(' ', ''),
                mrid=visit.mrid,
                vnum=self.vnum,
                test_code=self.test_code,
                physician=self.physician.name.replace(' ', ''),
                dt=created_at.strftime('%Y%m%dT%H%M')
            )
        )
        for generator in generators:
            report = app.models.Report(
                status='approved' if approved else 'pending',
                content_type=generator.content_type,
                created_at=created_at)
            report.content = FileIntent(
                generator.render(prepared_data),
                filename='{}.{}'.format(filename, generator.content_type),
                content_type=generator.mimetype)
            self.reports.append(report)
