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

from .utils import split_person_name, prefixed_with

db = app.db
models = app.models


class Physician(SQLAlchemyObjectType):
    class Meta:
        model = app.models.Physician
        interfaces = (relay.Node, )


class PhysiciansField(SQLAlchemyConnectionField):

    def __init__(self):
        super(PhysiciansField, self).__init__(
            Physician,
            name_prefix=graphene.String(),
            contextual_ptnum=graphene.ID()
        )

    @classmethod
    def get_query(self, model, context, info, args):
        query = Physician.get_query(context)
        if 'name_prefix' in args:
            names = split_person_name(args['name_prefix'])
            for prefix in names:
                query = query.filter(db.or_(
                    prefixed_with(model.lastname, prefix),
                    prefixed_with(model.firstname, prefix)))

        if 'contextual_ptnum' in args:
            # contextual_ptnum puts visited clinics ahead of others
            ptnum = args['contextual_ptnum']
            subquery = (
                db.session
                .query(
                    models.PatientSample.physician_id,
                    db.func.count('*').label('count')
                )
                .join(models.PatientVisit)
                .filter(models.PatientVisit.ptnum == ptnum)
                .group_by(models.PatientSample.physician_id)
                .subquery())
            query = (
                query
                .outerjoin(subquery)
                .order_by(subquery.c.count.desc().nullslast()))

        return query.order_by(model.lastname, model.firstname)
