# ClinViro
# Copyright (C) 2018 Stanford HIVDB team.
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

db = app.db
models = app.models


class AuditLog(SQLAlchemyObjectType):

    class Meta:
        model = app.models.AuditLog
        interfaces = (relay.Node, )


class AuditLogsField(SQLAlchemyConnectionField):

    def __init__(self):
        super(AuditLogsField, self).__init__(
            AuditLog,
            user_id=graphene.ID(),
            operation_type=graphene.String(),
            target=graphene.String()
        )

    @classmethod
    def get_query(self, model, info, **args):
        query = AuditLog.get_query(info)

        if args.get('user_id'):
            query = (query
                     .options(db.joinedload('user'))
                     .filter_by(user_id=args['user_id']))
        else:
            query = query.options(db.selectinload('user'))

        if args.get('operation_type'):
            query.filter_by(operation_type=args['operation_type'])

        if args.get('target'):
            query.filter_by(target=args['target'])

        return query.order_by(model.created_at.desc())
