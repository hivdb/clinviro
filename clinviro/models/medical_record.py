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


class MedicalRecord(db.Model):

    __tablename__ = 'tbl_medical_records'

    mrid = db.Column(
        db.Unicode(128), primary_key=True, doc='medical record number')
    ptnum = db.Column(
        db.Integer, db.ForeignKey('tbl_patients.ptnum'),
        primary_key=True, index=True, nullable=False,
        doc='patient UID, a foreign key to tbl_patients')

    @property
    def visits_count(self):
        return (db.session.query(app.models.PatientVisit)
                .filter_by(ptnum=self.ptnum,
                           mrid=self.mrid)
                .count())
