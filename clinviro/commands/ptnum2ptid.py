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

import csv
import click
from flask import current_app as app

db = app.db
models = app.models


def get_patients(ptnums):
    patients = models.Patient.query.filter(models.Patient.ptnum.in_(ptnums))
    return {p.ptnum: p for p in patients}


def writerows(writer, ptnumcache, rowcache, colidx):
    patients = get_patients(ptnumcache)
    for row in rowcache:
        if not row:
            writer.write(row)
        ptnum = row[colidx - 1]
        patient = patients[int(ptnum)]
        if not patient.hivdb_ptid and any(any(s.amplifiable
                                              for s in v.samples)
                                          for v in patient.visits):
            raise Exception(
                'No PtID was found for patient {}'.format(patient.ptnum)
            )
        row[colidx - 1] = patient.hivdb_ptid
        writer.writerow(row)


@app.cli.command()
@click.option('--first-line-header', is_flag=True,
              help='the input file contains a header line')
@click.option('--column-index', default=1,
              help='the index of `ptnum` column, starts with 1')
@click.option('--file-type', default='split',
              type=click.Choice(['tsv', 'csv', 'split']),
              help='the file type of input and output file')
@click.argument('input', type=click.File('r'))
@click.argument('output', type=click.File('w'))
def ptnum2ptid(first_line_header, column_index, file_type, input, output):
    sep = ',' if file_type == 'csv' else '\t'
    if file_type == 'split':
        reader = iter(line.split() for line in input)
    else:
        reader = csv.reader(input, delimiter=sep)
    writer = csv.writer(output, delimiter=sep)
    if first_line_header:
        writer.writerow(next(reader))
    rowcache = []
    ptnumcache = set([])
    for row in reader:
        rowcache.append(row)
        ptnumcache.add(row[column_index - 1])
        if len(ptnumcache) > 200:
            writerows(writer, ptnumcache, rowcache, column_index)
            ptnumcache = set([])
            rowcache = []
    if rowcache:
        writerows(writer, ptnumcache, rowcache, column_index)
