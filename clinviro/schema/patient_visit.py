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

from .utils import (get_numeric_id,
                    prefixed_with,
                    split_person_name,
                    query_column_between,
                    query_relationship_column_between)

db = app.db
models = app.models


class PatientVisit(SQLAlchemyObjectType):
    samples_count = graphene.Int(
        description='number of samples collected in this visit',
        required=True)

    class Meta:
        model = models.PatientVisit
        interfaces = (relay.Node, )


class SelfInc():

    def __init__(self, initial=0, step=1):
        self.current = initial
        self.step = step

    def __call__(self):
        try:
            return self.current
        finally:
            self.current += self.step


_inc = SelfInc()


class PatientVisitsOrderByEnum(graphene.Enum):

    id_asc = _inc()
    id_desc = _inc()
    ptnum_asc = _inc()
    ptnum_desc = _inc()
    collected_at_asc = _inc()
    collected_at_desc = _inc()


patient_visits_order_by_map = [
    models.PatientVisit.id,
    models.PatientVisit.id.desc(),
    models.PatientVisit.ptnum,
    models.PatientVisit.ptnum.desc(),
    models.PatientVisit.collected_at,
    models.PatientVisit.collected_at.desc(),
]


class PatientVisitsField(SQLAlchemyConnectionField):

    def __init__(self):
        super(PatientVisitsField, self).__init__(
            PatientVisit,
            ids=graphene.List(graphene.ID),
            sample_ids=graphene.List(graphene.ID),
            ptnums=graphene.List(graphene.ID),
            name_prefix=graphene.String(),
            clinic_prefix=graphene.String(),
            physician_name_prefix=graphene.String(),
            mrid=graphene.String(),
            vnum=graphene.String(),
            collected_at_start=DateTime(),
            collected_at_end=DateTime(),
            received_at_start=DateTime(),
            received_at_end=DateTime(),
            entered_at_start=DateTime(),
            entered_at_end=DateTime(),
            order_by=graphene.List(PatientVisitsOrderByEnum)
        )

    @classmethod
    def get_query(cls, model, context, info, args):
        query = PatientVisit.get_query(context)
        query = query.options(db.joinedload('patient'))
        if 'ids' in args:
            ids = map(get_numeric_id, args['ids'])
            if ids:
                query = query.filter(models.PatientVisit.id.in_(ids))
        if 'sample_ids' in args:
            sample_ids = map(get_numeric_id, args['sample_ids'])
            if sample_ids:
                query = query.filter(model.samples.any(
                    models.PatientSample.id.in_(sample_ids)
                ))
        if 'ptnums' in args:
            ptnums = args['ptnums']
            if ptnums:
                query = (query
                         .join(models.Patient)
                         .filter(models.Patient.ptnum.in_(ptnums)))

        if 'name_prefix' in args:
            names = split_person_name(args['name_prefix'])
            query = query.join(models.Patient)
            for prefix in names:
                query = query.filter(db.or_(
                    prefixed_with(models.Patient.lastname, prefix),
                    prefixed_with(models.Patient.firstname, prefix)))

        if 'clinic_prefix' in args:
            query = (query
                     .filter(model.samples.any(
                         models.PatientSample.clinic.has(
                            prefixed_with(models.Clinic.name,
                                          args['clinic_prefix'])
                         )
                     )))

        if 'physician_name_prefix' in args:
            names = split_person_name(args['physician_name_prefix'])
            query = query.join(models.Physician)
            for prefix in names:
                query = query.filter(db.or_(
                    prefixed_with(models.Physician.lastname, prefix),
                    prefixed_with(models.Physician.firstname, prefix)))
                query = (
                    query
                    .filter(model.samples.any(
                        models.PatientSample.physician.has(db.or_(
                            prefixed_with(models.Physician.lastname, prefix),
                            prefixed_with(models.Physician.firstname, prefix))
                        )
                    ))
                )

        if 'mrid' in args:
            query = query.filter(model.mrid == args['mrid'])
        if 'vnum' in args:
            query = query.filter(model.vnum == args['vnum'])

        query = query_column_between(
            query, model.collected_at,
            args.get('collected_at_start'),
            args.get('collected_at_end'))

        query = query_relationship_column_between(
            query, model.samples,
            models.PatientSample.received_at,
            args.get('received_at_start'),
            args.get('received_at_end'))

        query = query_relationship_column_between(
            query, model.samples,
            models.PatientSample.entered_at,
            args.get('entered_at_start'),
            args.get('entered_at_end'))

        if 'order_by' in args:
            query = query.order_by(
                *[patient_visits_order_by_map[i] for i in args['order_by']])
        else:
            query = query.order_by(models.PatientVisit.id)
        return query
