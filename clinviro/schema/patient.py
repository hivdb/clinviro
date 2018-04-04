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
from graphene import relay
from graphene.types.datetime import DateTime
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from flask import current_app as app

from .utils import (split_person_name,
                    prefixed_with,
                    query_column_between)

db = app.db
models = app.models


class Patient(SQLAlchemyObjectType):
    id = graphene.ID(description='Alias of ptnum', required=True)

    class Meta:
        model = models.Patient
        interfaces = (relay.Node, )


class PatientsField(SQLAlchemyConnectionField):

    def __init__(self):
        super(PatientsField, self).__init__(
            Patient,
            ptnums=graphene.List(graphene.ID),
            name_prefix=graphene.String(),
            name_fuzzymatch=graphene.String(),
            mrid=graphene.String(),
            birthday_start=DateTime(),
            birthday_end=DateTime(),
        )

    @classmethod
    def get_query(cls, model, info, **args):
        query = Patient.get_query(info)
        if 'ptnums' in args:
            ptnums = args['ptnums']
            if ptnums:
                query = query.filter(model.ptnum.in_(ptnums))
        if 'name_prefix' in args:
            names = split_person_name(args['name_prefix'])[:2]
            for attr, prefix in zip(['lastname', 'firstname'], names):
                query = query.filter(
                    prefixed_with(getattr(model, attr), prefix))
        if 'mrid' in args:
            query = query.filter(model.medical_records.any(
                models.MedicalRecord.mrid == args['mrid']
            ))
        query = query_column_between(
            query, model.birthday,
            args.get('birthday_start'),
            args.get('birthday_end'))
        if 'name_fuzzymatch' in args:
            first = args.get('first', 10)
            ptnums = model.search(
                args['name_fuzzymatch'], limit=first, ptnums_only=True)
            if not ptnums:
                return []
            patients = query.filter(model.ptnum.in_(ptnums)).all()
            patients.sort(key=lambda pt: ptnums.index(pt.ptnum))
            return patients
        return query.order_by(model.created_at.desc())
