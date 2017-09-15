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
from flask import current_app as app
from .patient_sample import PatientSample
from .positive_control import PositiveControl
from .proficiency_sample import ProficiencySample
from .utils import get_numeric_id
from .sample_type import SampleType

db = app.db
models = app.models


class SimilarSequence(graphene.ObjectType):
    type = SampleType(required=True)
    patient_sample = graphene.Field(PatientSample)
    positive_control = graphene.Field(PositiveControl)
    proficiency_sample = graphene.Field(ProficiencySample)
    entered_at = DateTime()
    pident = graphene.Float()
    length = graphene.Int()
    mismatch = graphene.Int()


def fetch_similar_sequences(sequence_id,
                            naseq,
                            entered_before,
                            remove_positive_controls,
                            ptnum_exclude):
    if sequence_id:
        sequence_id = get_numeric_id(sequence_id)
        sequence = models.Sequence.query.get(sequence_id)
    else:
        sequence = models.Sequence(naseq=naseq)
    similars = sequence.get_similar_sequences(
        entered_before, remove_positive_controls, ptnum_exclude)
    return similars
