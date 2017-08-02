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
from depot.io.utils import FileIntent
from .sierra import sequence_analysis
from ..reports import profsample_generators, prepare_profsample_data

db = app.db


associate_table = db.Table(
    'tbl_proficiency_sample_reports', db.Model.metadata,
    db.Column(
        'proficiency_sample_id', db.Integer,
        db.ForeignKey('tbl_proficiency_samples.id'),
        primary_key=True, doc='proficiency sample UID'),
    db.Column(
        'report_id', db.Integer, db.ForeignKey('tbl_reports.id'),
        primary_key=True, doc='report UID, a foreign key to tbl_reports'))


class ProficiencySample(db.Model):

    __tablename__ = 'tbl_proficiency_samples'
    __table_args__ = (
        db.UniqueConstraint(
            'vnum', 'test_code', 'received_at'),
    )

    id = db.Column(
        db.Integer, primary_key=True,
        nullable=False, doc='proficiency sample UID')
    name = db.Column(
        db.Unicode(128), index=True, nullable=False,
        doc='sample name / id from source')
    source = db.Column(
        db.Unicode(64), index=True, nullable=False,
        doc='proficiency sample source')
    vnum = db.Column(
        db.Unicode(64), nullable=False, index=True, doc='accession number')
    test_code = db.Column(
        db.Unicode(64), nullable=False, doc='test code')
    sequence_id = db.Column(
        db.Integer, db.ForeignKey('tbl_sequences.id'), unique=True)
    notes = db.Column(db.UnicodeText, doc='notes for physician')
    labnotes = db.Column(db.UnicodeText, doc='laboratory notes')
    received_at = db.Column(
        db.Date(), index=True, nullable=False,
        doc='date the results were received')
    entered_at = db.Column(
        db.DateTime(timezone=True), nullable=False, index=True,
        doc='date and time this record was entered')

    # relationships
    sequence = db.relationship('Sequence', doc='sample sequence')
    reports = db.relationship(
        'Report', secondary=associate_table,
        order_by='desc(Report.created_at)', doc='sample report')

    @property
    def sierra_result(self):
        if not hasattr(self, '_sierra_result'):
            self._update_sierra_result(self.sequence.naseq)
        return self._sierra_result

    def _update_sierra_result(self, sequence):
        self._sierra_result = sequence_analysis(self.vnum, sequence)

    def set_sequence(self, sequence, filename):
        seq = self.sequence = self.sequence or app.models.Sequence()
        seq.naseq = sequence
        seq.filename = filename
        self._update_sierra_result(sequence)
        seq.subtype = self.sierra_result['subtype']
        seq.genes = self.sierra_result['genes']

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

    def get_similar_sequences(self):
        return self.sequence.get_similar_sequences(self.entered_at)

    def generate_reports(self, created_at,
                         is_regenerated_report=False,
                         return_json_only=False):
        filename = (
            'PROFICIENCY_{source}_{name}_{vnum}_{test_code}_{dt}'
            .format(
                source=self.source,
                name=self.name,
                vnum=self.vnum,
                test_code=self.test_code,
                dt=created_at.strftime('%Y%m%dT%H%M')
            )
        )
        data = self.sierra_result.get('data')
        prepared_data = prepare_profsample_data(
            self, created_at, data, is_regenerated_report)
        auto_approved = prepared_data['auto_approved']
        if return_json_only:
            return prepared_data
        for generator in profsample_generators:
            report = app.models.Report(
                status='approved' if auto_approved else 'pending',
                content_type=generator.content_type,
                created_at=created_at)
            report.content = FileIntent(
                generator.render(prepared_data),
                filename='{}.{}'.format(filename, generator.content_type),
                content_type=generator.mimetype)
            self.reports.append(report)
