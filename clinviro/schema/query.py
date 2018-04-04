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
from flask_login import login_required, current_user

from .medical_record import MedicalRecord  # noqa
from .patient_sample import PatientSample  # noqa
from .report import Report  # noqa
from .sequence import Sequence  # noqa
from .clinic import ClinicsField
from .patient import PatientsField
from .patient_visit import PatientVisitsField
from .physician import PhysiciansField
from .positive_control import PositiveControlsField
from .proficiency_sample import ProficiencySamplesField
from .similar_sequence import (SimilarSequence,
                               fetch_similar_sequences)
from .version import Version
from ..version import VERSION, VERSION_DATE


class Viewer(graphene.ObjectType):
    node = relay.Node.Field()
    patients = PatientsField()
    patient_visits = PatientVisitsField()
    clinics = ClinicsField()
    physicians = PhysiciansField()
    positive_controls = PositiveControlsField()
    proficiency_samples = ProficiencySamplesField()
    viewer = graphene.Field(lambda: Viewer)
    version = graphene.Field(Version)
    user_authenticated = graphene.Boolean()
    similar_sequences = graphene.List(
        SimilarSequence,
        sequence_id=graphene.ID(),
        naseq=graphene.String(),
        entered_before=DateTime(),
        remove_positive_controls=graphene.Boolean(),
        ptnum_exclude=graphene.ID()
    )

    def resolve_viewer(self, *args, **kwargs):
        return Viewer()

    def resolve_version(self, *args, **kwargs):
        return Version(
            text=VERSION,
            date=VERSION_DATE)

    @login_required
    def resolve_patients(self, *args, **kwargs):
        pass

    @login_required
    def resolve_patient_visits(self, *args, **kwargs):
        pass

    @login_required
    def resolve_clinics(self, *args, **kwargs):
        pass

    @login_required
    def resolve_physicians(self, *args, **kwargs):
        pass

    @login_required
    def resolve_positive_controls(self, *args, **kwargs):
        pass

    @login_required
    def resolve_proficiency_samples(self, *args, **kwargs):
        pass

    @login_required
    def resolve_similar_sequences(self, info, sequence_id=None,
                                  naseq=None, entered_before=None,
                                  remove_positive_controls=False,
                                  ptnum_exclude=None):
        if not sequence_id and not naseq:
            return []
        return fetch_similar_sequences(
            sequence_id, naseq, entered_before,
            remove_positive_controls, ptnum_exclude)

    def resolve_user_authenticated(self, *args, **kwargs):
        return bool(current_user and current_user.is_authenticated)


Query = Viewer
