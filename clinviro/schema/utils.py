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

import re
from graphql_relay import from_global_id
from flask import current_app as app

escape_like_query = app.models.escape_like_query


def get_numeric_id(relay_id: str) -> int:
    if relay_id.isdigit():
        numeric_id = relay_id
    else:
        _, numeric_id = from_global_id(relay_id)
    return int(numeric_id)


def split_person_name(name):
    return re.split('[, ]+', name)


def prefixed_with(column, prefix, case_sensitive=False):
    like_func = column.like if case_sensitive else column.ilike
    escaped = escape_like_query(prefix, '\\')
    return like_func(escaped + '%', '\\')


def query_column_between(query, column, start, end):
    if start and end:
        query = query.filter(column.between(start, end))
    elif start:
        query = query.filter(column >= start)
    elif end:
        query = query.filter(column <= end)
    return query


def query_relationship_column_between(query, relation, column, start, end):
    exists_func = relation.any if relation.prop.uselist else relation.has
    if start and end:
        query = query.filter(exists_func(column.between(start, end)))
    elif start:
        query = query.filter(exists_func(column >= start))
    elif end:
        query = query.filter(exists_func(column <= end))
    return query
