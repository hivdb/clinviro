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

from .json_generator import JSONGenerator
from .pdf_generator import PDFGenerator
from .docx_generator import DOCXGenerator
from .utils import prepare_data, prepare_posctl_data, prepare_profsample_data

generators = [
    JSONGenerator(),
    PDFGenerator(),
    DOCXGenerator()
]

posctl_generators = [
    JSONGenerator()
]

profsample_generators = [
    JSONGenerator(),
    PDFGenerator()
]

__all__ = ['JSONGenerator', 'PDFGenerator', 'DOCXGenerator',
           'generators', 'posctl_generators', 'profsample_generators',
           'prepare_data', 'prepare_posctl_data', 'prepare_profsample_data']
