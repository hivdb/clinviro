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
from sqlalchemy_utils import ScalarListType

db = app.db


class Sequence(db.Model):

    __tablename__ = 'tbl_sequences'

    id = db.Column(
        db.Integer, primary_key=True, nullable=False,
        doc='sequence UID')
    naseq = db.Column(
        db.Text(), nullable=False, doc='DNA sequence')
    subtype = db.Column(
        db.Unicode(64), nullable=False,
        doc='subtype of this sequence')
    genes = db.Column(
        ScalarListType(), nullable=False,
        doc='genes found in this sequence')
    filename = db.Column(
        db.Unicode(256), doc='input FASTA file name')

    def get_similar_sequences(self, entered_before=None,
                              remove_positive_controls=False,
                              ptnum_exclude=None, min_pident=98.5):
        total = Sequence.query.count()
        result = (app.models.blastdb
                  .query_sequence(self.naseq, min_pident, total))
        # remove self
        result = (r for r in result if r.sequence_id != self.id)
        # remove failed posctls
        result = (r for r in result if r.type == 'positive_control' and
                  r.positive_control.is_approved)
        if entered_before:
            result = (r for r in result if r.entered_at <= entered_before)
        if ptnum_exclude:
            result = (
                r for r in result if r.type == 'patient_sample' and
                str(r.patient_sample.visit.patient.ptnum)
                != str(ptnum_exclude))
        if remove_positive_controls:
            # only keep at most 10 non-ident posctl
            filtered = []
            posctls = []
            for r in result:
                if r.type == 'positive_control':
                    posctls.append(r)
                else:
                    filtered.append(r)
            posctls.sort(key=lambda r: -r.pident)
            result = filtered + posctls[:10]
            result.sort(key=lambda r: -r.pident)
        return list(result)
