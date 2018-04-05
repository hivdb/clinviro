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

from graphene import Enum
from graphene.types.json import JSONString
from graphene.types.datetime import Date
from graphene_sqlalchemy.converter import (get_column_doc,
                                           is_column_nullable,
                                           convert_sqlalchemy_type)
from depot.fields.sqlalchemy import UploadedFileField
from sqlalchemy_utils import ChoiceType


@convert_sqlalchemy_type.register(app.db.Date)
def convert_column_to_datetime(type, column, registry=None):
    return Date(
        description=get_column_doc(column),
        required=not(is_column_nullable(column)))


@convert_sqlalchemy_type.register(UploadedFileField)
def convert_depot_column_to_string(type, column, registry=None):
    return JSONString(
        description=get_column_doc(column),
        required=not(is_column_nullable(column)))


@convert_sqlalchemy_type.register(ChoiceType)
def convert_column_to_enum(type, column, registry=None):
    """A bug from graphene_sqlalchemy prevented any Enum

    The Enum class must be instantiated here
    """
    name = '{}_{}'.format(column.table.name, column.name).upper()
    return Enum(name, type.choices, description=get_column_doc(column))()
