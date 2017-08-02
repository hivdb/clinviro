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

db = app.db


class PatientVisit(db.Model):

    __tablename__ = 'tbl_patient_visits'
    __table_args__ = (
        db.UniqueConstraint(
            'ptnum', 'collected_at'),
        db.ForeignKeyConstraint(
            ['mrid', 'ptnum'],
            ['tbl_medical_records.mrid', 'tbl_medical_records.ptnum'])
    )

    id = db.Column(
        db.Integer, primary_key=True, nullable=False,
        doc='UID of patient visit record')
    ptnum = db.Column(
        db.Integer, db.ForeignKey('tbl_patients.ptnum'),
        nullable=False, doc='patient UID, a foreign key to tbl_patients')
    mrid = db.Column(
        db.Unicode(128), doc='medical record number')
    collected_at = db.Column(
        db.Date(), nullable=False, index=True,
        doc='date the samples were collected')

    # relationships
    patient = db.relationship(
        'Patient', back_populates='visits',
        doc='patient who is linked to this visit record')
    samples = db.relationship(
        'PatientSample', back_populates='visit',
        order_by='PatientSample.entered_at',
        doc='samples of this visit record')

    @property
    def samples_count(self):
        return len(self.samples)
