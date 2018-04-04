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
from graphene.types.datetime import DateTime


def sample_input_to_args(input_):
    return {
        'name': input_['name'],
        'source': input_['source'],
        'vnum': input_['vnum'],
        'test_code': input_['test_code'],
        'notes': input_.get('notes'),
        'labnotes': input_.get('labnotes'),
        'received_at': input_['received_at'].date()
    }


class ProficiencySampleInput:
    name = graphene.String(required=True)
    source = graphene.String(required=True)
    vnum = graphene.String(required=True)
    test_code = graphene.String(required=True)
    sequence = graphene.String()
    filename = graphene.String()
    notes = graphene.String()
    labnotes = graphene.String()
    received_at = DateTime(required=True)
