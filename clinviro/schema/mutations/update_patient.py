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

import graphene
from graphene.types.datetime import Date
from flask_login import login_required
from flask import current_app as app

from ..patient import Patient

db = app.db
models = app.models


class MergeMRID(graphene.InputObjectType):
    mrid_from = graphene.String(required=True)
    mrid_to = graphene.String()


class UpdatePatient(graphene.ClientIDMutation):

    class Input:
        ptnum = graphene.ID(required=True)
        lastname = graphene.String(required=True)
        firstname = graphene.String(required=True)
        birthday = Date(required=True)
        new_mrids = graphene.List(graphene.String, required=True)
        merge_mrids = graphene.List(MergeMRID, required=True)

    patient = graphene.Field(Patient)

    @staticmethod
    @login_required
    def mutate_and_get_payload(root, info, **input_):
        patient = db.session.query(models.Patient).get(input_['ptnum'])
        payload = {'ptnum': patient.ptnum, 'changed_fields': []}
        for column in ('lastname', 'firstname', 'birthday'):
            old_value = getattr(patient, column)
            new_value = input_[column]
            if old_value != new_value:
                payload['changed_fields'].append({
                    'field': column,
                    'old_value': old_value,
                    'new_value': new_value
                })
                setattr(patient, column, new_value)
        old_mrids = [m.mrid for m in patient.medical_records]
        new_mrids = set(old_mrids)
        if input_['new_mrids']:
            for mrid in input_['new_mrids']:
                patient.medical_records.append(
                    models.MedicalRecord(mrid=mrid)
                )
                new_mrids.add(mrid)
            db.session.commit()
        delete_mrids = set()
        if input_['merge_mrids']:
            for rule in input_['merge_mrids']:
                delete_mrids.add(rule['mrid_from'])
                if 'mrid_to' not in rule:
                    continue
                for visit in patient.visits:
                    if visit.mrid == rule['mrid_from']:
                        visit.mrid = rule['mrid_to']
            for mr in patient.medical_records:
                if mr.mrid in delete_mrids:
                    db.session.delete(mr)
            new_mrids -= delete_mrids
        old_mrids = tuple(sorted(old_mrids))
        new_mrids = tuple(sorted(new_mrids))
        if old_mrids != new_mrids:
            payload['changed_fields'].append({
                'field': 'mrids',
                'old_value': old_mrids,
                'new_value': new_mrids
            })
        log = models.AuditLog.for_current_user('MODIFY', 'PATIENT', payload)
        db.session.add(log)
        db.session.commit()
        patient.update_index()
        return UpdatePatient(patient=patient)
