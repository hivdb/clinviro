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

from .create_patient import CreatePatient
from .update_patient import UpdatePatient
from .create_patient_visit import CreatePatientVisit
from .update_patient_sample import UpdatePatientSample
from .create_positive_control import CreatePositiveControl
from .create_proficiency_sample import CreateProficiencySample
from .generate_report import GenerateReport
from .delete_report import DeleteReport
from .create_physician import CreatePhysician
from .create_clinic import CreateClinic
from .user_authorization import LoginUser, LogoutUser
from .preview_patient_report import PreviewPatientReport
from .preview_proficiency_sample_report import PreviewProficiencySampleReport

__all__ = ['Mutation']


class Mutation(graphene.ObjectType):
    # Used by `patients/new-patient-and-sample` view
    create_patient = CreatePatient.Field()

    # Used by `patients/one` view
    update_patient = UpdatePatient.Field()

    # NOTE: this mutation actually create one visit and one sample for
    # designated patient. Used by `patients/new-patient-and-sample` view
    create_patient_visit = CreatePatientVisit.Field()
    update_patient_sample = UpdatePatientSample.Field()

    create_positive_control = CreatePositiveControl.Field()
    create_proficiency_sample = CreateProficiencySample.Field()

    # Used by `*/reports` view
    generate_report = GenerateReport.Field()

    # Used by `*/reports` view
    delete_report = DeleteReport.Field()

    # Used by `fragments/forms/physician-select`
    create_physician = CreatePhysician.Field()

    # Used by `fragments/forms/clinic-select`
    create_clinic = CreateClinic.Field()

    preview_patient_report = PreviewPatientReport.Field()
    preview_proficiency_sample_report = PreviewProficiencySampleReport.Field()

    # Used by `users` views
    login_user = LoginUser.Field()
    logout_user = LogoutUser.Field()
