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

# -*- coding: utf-8 -*-
from z3c.rml import rml2pdf
from flask import render_template
from .abstract import AbstractGenerator


class PDFGenerator(AbstractGenerator):

    content_type = 'pdf'
    mimetype = 'application/pdf'

    def render(self, prepared_data):
        rml = render_template('pdf_report.rml.xml.jinja2', **prepared_data)
        with open('/tmp/zzz', 'w') as fp:
            fp.write(rml)
        io = rml2pdf.parseString(rml)
        return io.getvalue()
