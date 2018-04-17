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

from datetime import datetime

import pytz
import graphene
from graphene.types.datetime import Date
from flask_login import login_required
from flask import current_app as app

from ..patient import Patient

db = app.db
models = app.models


class CreatePatient(graphene.ClientIDMutation):

    class Input:
        lastname = graphene.String(required=True)
        firstname = graphene.String(required=True)
        birthday = Date(required=True)
        mrids = graphene.List(graphene.String, required=True)

    patient = graphene.Field(Patient)

    @staticmethod
    @login_required
    def mutate_and_get_payload(
            root, info, lastname, firstname, birthday,
            mrids, client_mutation_id=None):
        new_patient = models.Patient(
            lastname=lastname,
            firstname=firstname,
            birthday=birthday,
            created_at=datetime.now(pytz.utc)
        )
        db.session.add(new_patient)
        db.session.flush()
        payload = {
            'patient_id': new_patient.id,
            'patient_name': new_patient.fullname,
            'patient_birthday': new_patient.birthday,
            'mrids': []
        }

        for mrid in mrids:
            new_patient.medical_records.append(
                models.MedicalRecord(mrid=mrid)
            )
            payload['mrids'].append(mrid)
        payload['mrids'] = ', '.join(payload['mrids'])
        log = models.AuditLog.for_current_user('CREATE', 'PATIENT', payload)
        db.session.add(log)
        db.session.commit()
        new_patient.update_index()
        return CreatePatient(patient=new_patient)
