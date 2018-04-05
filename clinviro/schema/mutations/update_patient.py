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
        for column in ('lastname', 'firstname', 'birthday'):
            setattr(patient, column, input_[column])
        if input_['new_mrids']:
            for mrid in input_['new_mrids']:
                patient.medical_records.append(
                    models.MedicalRecord(mrid=mrid)
                )
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
        db.session.commit()
        patient.update_index()
        return UpdatePatient(patient=patient)
