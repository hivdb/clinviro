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
from sqlalchemy_utils import ChoiceType
from depot.io.utils import FileIntent
from .sierra import sequence_analysis
from .common import SPECIMEN_TYPE_CHOICES
from ..reports import posctl_generators, prepare_posctl_data

db = app.db

associate_table = db.Table(
    'tbl_positive_control_reports', db.Model.metadata,
    db.Column(
        'positive_control_id', db.Integer,
        db.ForeignKey('tbl_positive_controls.id'),
        primary_key=True, doc='positive control UID'),
    db.Column(
        'report_id', db.Integer, db.ForeignKey('tbl_reports.id'),
        primary_key=True, doc='report UID, a foreign key to tbl_reports'))


class PositiveControl(db.Model):
    """Positive control sequence"""
    __tablename__ = 'tbl_positive_controls'

    id = db.Column(
        db.Integer, primary_key=True, nullable=False,
        doc='positive control UID')
    note = db.Column(
        db.Unicode(128), nullable=False,
        doc='note for this positive control')
    lot_number = db.Column(
        db.Unicode(64), nullable=True, doc='lot number')
    test_code = db.Column(
        db.Unicode(64), nullable=False, doc='test code')
    specimen_type = db.Column(
        ChoiceType(SPECIMEN_TYPE_CHOICES, db.Unicode(32)),
        nullable=False, doc='specimen type')
    sequence_id = db.Column(
        db.Integer, db.ForeignKey('tbl_sequences.id'),
        unique=True, doc='sequence UID, a foreign key to tbl_sequences')
    labnotes = db.Column(db.UnicodeText, doc='laboratory notes')
    entered_at = db.Column(
        db.DateTime(timezone=True), nullable=False, index=True,
        doc='date the sample was entered')

    sequence = db.relationship(
        'Sequence', doc='sequence of this positive control')
    reports = db.relationship(
        'Report', secondary=associate_table,
        order_by='desc(Report.created_at)', doc='report')

    @property
    def sierra_result(self):
        if not hasattr(self, '_sierra_result'):
            self._update_sierra_result(self.sequence.naseq)
        return self._sierra_result

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

    def _update_sierra_result(self, sequence):
        self._sierra_result = sequence_analysis('__posctl', sequence)

    def set_sequence(self, sequence, filename):
        seq = self.sequence = self.sequence or app.models.Sequence()
        seq.naseq = sequence
        seq.filename = filename
        self._update_sierra_result(sequence)
        seq.subtype = self.sierra_result['subtype']
        seq.genes = self.sierra_result['genes']

    def get_similar_sequences(self):
        return self.sequence.get_similar_sequences(
            self.entered_at, remove_positive_controls=True)

    def generate_reports(self, created_at,
                         is_regenerated_report=False):
        data = self.sierra_result.get('data')
        filename = (
            'POSCTL_{note}_{lot_number}_{entered_at}_{test_code}_{dt}'
            .format(
                note=self.note,
                lot_number=self.lot_number,
                entered_at=self.entered_at.strftime('%Y%m%dT%H%M'),
                test_code=self.test_code,
                dt=created_at.strftime('%Y%m%dT%H%M')
            )
        )
        prepared_data = prepare_posctl_data(
            self, created_at, data, is_regenerated_report)
        auto_approved = prepared_data['auto_approved']
        for generator in posctl_generators:
            report = app.models.Report(
                status='approved' if auto_approved else 'pending',
                content_type=generator.content_type,
                created_at=created_at)
            report.content = FileIntent(
                generator.render(prepared_data),
                filename='{}.{}'.format(filename, generator.content_type),
                content_type=generator.mimetype)
            self.reports.append(report)
