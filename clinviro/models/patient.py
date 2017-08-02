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


class Patient(db.Model):

    __tablename__ = 'tbl_patients'
    __table_args__ = (
        db.Index('patient_name_index', 'lastname', 'firstname'),
    )

    ptnum = db.Column(
        db.Integer, primary_key=True, nullable=False,
        doc='patient record unique identifier (UID)')
    lastname = db.Column(
        db.Unicode(128), nullable=False,
        doc='patient lastname')
    firstname = db.Column(
        db.Unicode(128), nullable=False, index=True,
        doc='patient firstname')
    birthday = db.Column(
        db.Date(), nullable=True, doc='patient birthday')
    hivdb_ptid = db.Column(
        db.Integer, nullable=True, index=True,
        doc='patient unique identifier (PtID) in HIVDB2')
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, index=True,
        doc='date and time this patient record was created')

    visits = db.relationship(
        'PatientVisit', back_populates='patient',
        order_by='PatientVisit.collected_at',
        doc='all visit records of this patient')
    medical_records = db.relationship(
        'MedicalRecord',
        doc='all medical record numbers of this patient')

    @property
    def id(self):
        return self.ptnum

    @property
    def fullname(self):
        if self.firstname:
            return '{}, {}'.format(self.lastname, self.firstname)
        else:
            return self.lastname

    def update_index(self):
        if not self.ptnum:
            # TODO: probably should raise an error instead return silently
            return
        return app.es.index(
            index='patient-index',
            doc_type='patient',
            id=self.ptnum,
            body={
                'name': self.fullname
            }
        )

    @classmethod
    def search(cls, name, offset=0, limit=10, ptnums_only=False):
        if not name:
            return {
                'total': 0,
                'scores': {},
                'patients': []
            }
        es_patients = app.es.search(
            index='patient-index',
            doc_type='patient',
            body={
                'from': offset,
                'size': limit,
                'query': {
                    'match': {
                        'name': {
                            'query': name,
                            'fuzziness': 'AUTO',
                            'operator': 'OR'
                        }
                    }
                }
            }
        )
        ptnums = [int(pt['_id']) for pt in es_patients['hits']['hits']]
        if ptnums_only:
            return ptnums
        scores = {
            int(pt['_id']): pt['_score']
            for pt in es_patients['hits']['hits']
        }
        patients = cls.query.filter(cls.ptnum.in_(ptnums)).all()
        patients.sort(key=lambda pt: ptnums.index(pt.ptnum))

        return {
            'total': es_patients['hits']['total'],
            'scores': scores,
            'patients': patients
        }
