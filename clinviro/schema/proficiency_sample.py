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

from .report import Report
from .utils import (prefixed_with,
                    get_numeric_id,
                    query_column_between)

db = app.db
models = app.models


class ProficiencySample(SQLAlchemyObjectType):

    latest_reports = graphene.List(
        Report, required=False, description='Latest reports (if existing)')
    is_approved = graphene.Boolean(
        description='Is the latest reports got approved or not')

    class Meta:
        model = models.ProficiencySample
        interfaces = (relay.Node, )


class ProficiencySamplesField(SQLAlchemyConnectionField):

    def __init__(self):
        super(ProficiencySamplesField, self).__init__(
            ProficiencySample,
            ids=graphene.List(graphene.ID),
            source=graphene.String(),
            vnum_prefix=graphene.String(),
            received_after=DateTime(),
            received_before=DateTime(),
        )

    @classmethod
    def get_query(cls, model, info, **args):
        query = ProficiencySample.get_query(info)
        if 'ids' in args:
            ids = map(get_numeric_id, args['ids'])
            if ids:
                query = query.filter(model.id.in_(ids))
        if 'source' in args:
            query = query.filter_by(source=args['source'])
        if 'vnum_prefix' in args:
            query = query.filter(
                prefixed_with(model.vnum, args['vnum_prefix']))
        query = query_column_between(
            query, model.received_at,
            args.get('received_after'),
            args.get('received_before'))
        return query.order_by(model.received_at.desc())
