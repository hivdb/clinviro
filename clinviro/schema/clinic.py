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
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from flask import current_app as app

from .utils import prefixed_with

db = app.db
models = app.models


class Clinic(SQLAlchemyObjectType):

    class Meta:
        model = app.models.Clinic
        interfaces = (relay.Node, )


class ClinicsField(SQLAlchemyConnectionField):

    def __init__(self):
        super(ClinicsField, self).__init__(
            Clinic,
            name_prefix=graphene.String(),
            contextual_ptnum=graphene.ID()
        )

    @classmethod
    def get_query(self, model, context, info, args):
        query = Clinic.get_query(context)

        if 'name_prefix' in args:
            query.filter(prefixed_with(model.name, args['name_prefix']))

        if 'contextual_ptnum' in args:
            # contextual_ptnum puts visited clinics ahead of others
            ptnum = args['contextual_ptnum']
            subquery = (
                db.session
                .query(
                    models.PatientSample.clinic_id,
                    db.func.count('*').label('count')
                )
                .join(models.PatientVisit)
                .filter(models.PatientVisit.ptnum == ptnum)
                .group_by(models.PatientSample.clinic_id)
                .subquery())
            query = (
                query
                .outerjoin(subquery)
                .order_by(subquery.c.count.desc().nullslast()))

        return query.order_by(model.name)
