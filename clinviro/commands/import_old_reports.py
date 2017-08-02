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

import os
import re
import glob
import click
import pdf2txt
import subprocess
from datetime import datetime
from itertools import chain
from depot.io.utils import FileIntent
from flask import current_app as app

db = app.db
models = app.models

DEBUG = True
_CLINIC_CACHE = {}


def get_clinic(name):
    if name not in _CLINIC_CACHE:
        clinic = models.Clinic.query.filter_by(name=name).first()
        _CLINIC_CACHE[name] = clinic
    return _CLINIC_CACHE.get(name)


def normalize_vnum(vnum):
    if re.match(r'^\d\d[A-Z]-?[A-Z\d]+int$', vnum):
        vnum = re.sub(r'^(\d\d[A-Z])-?([A-Z\d]+)int$', r'\1-\2', vnum)
    if re.match(r'^[A-Z\d]+int$', vnum):
        vnum = re.sub(r'int$', '', vnum)
    if re.match(r'^\d\d[A-Z][A-Z\d]+$', vnum):
        vnum = re.sub(r'^(\d\d[A-Z])([A-Z\d]+)$', r'\1-\2', vnum)
    if re.match(r'^\d\d[A-Z][A-Z\d]+int$', vnum):
        vnum = re.sub(r'^(\d\d[A-Z])([A-Z0-9]+)int$', r'\1-\2', vnum)
    if re.match(r'^[A-Z\d]+int$', vnum):
        vnum = re.sub(r'int$', '', vnum)
    if re.match(r'^\d\d[A-Z][A-Z\d]+$', vnum):
        vnum = re.sub(r'^(\d\d[A-Z])([A-Z0-9]+)$', r'\1-\2', vnum)
    return vnum


def extract_pdf_info(filename):
    proc = subprocess.run(
        ['python', pdf2txt.__file__, filename, '--char-margin=12'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE)
    text = proc.stdout.decode('U8')
    lines = text.splitlines()
    result = {
        'test_code': 'AVRT'
    }
    for idx, line in enumerate(lines):
        line = line.strip()
        if idx == 0:
            if 'Integrase' in line:
                result['test_code'] = 'AVIN'
            if 'RT/Prot' in line:
                result['test_code'] = 'AVRT'
        if line.startswith('Accession Number'):
            line = line[len('Accession Number'):].strip()
            line = line.rsplit(' (', 1)
            if len(line) > 1:
                result['ptnum'] = line[1].strip(')')
            result['vnum'] = line[0]
        elif line.startswith('Clinic'):
            clinic = line[len('Clinic'):].strip()
            if clinic == 'STANFORD UNIVERSITY':
                clinic = 'STANFORD UNIVERSITY HOSPITAL'
            elif clinic == 'STANFORD MEDICAL':
                clinic = 'STANFORD MEDICAL GROUP'
            if 'Physician' in clinic:
                clinic = clinic.split('Physician')[0].strip()
            result['clinic'] = clinic
        elif line.startswith('MR Number'):
            result['mrid'] = line[len('MR Number'):].strip()
        elif line.startswith('Collection Date'):
            result['collected_at'] = line[len('Collection Date'):].strip()
    if 'vnum' in result:
        result['vnum'] = normalize_vnum(result['vnum'])
    return result


def find_patient(data):
    m = models
    patient = None
    ptnum = data.get('ptnum')
    mrid = data.get('mrid')
    query = m.Patient.query
    if ptnum:
        # find patient by using ptnum
        patient = query.get(ptnum)
    if mrid and not patient:
        # find patient by using mrid
        query = (
            query
            .filter(m.Patient.medical_records.any(mrid=mrid))
        )
        if query.count() == 1:
            patient = query.first()
    return patient


def find_patient_sample(patient, data):
    m = models
    collected_at = data.get('collected_at')
    if collected_at:
        collected_at = datetime.strptime(collected_at, '%m/%d/%Y')
    vnum = data.get('vnum')
    test_code = data.get('test_code')
    query = (
        m.PatientSample.query
        .options(
            db.joinedload(m.PatientSample.clinic),
            db.subqueryload(m.PatientSample.reports)
        )
    )
    if vnum:
        query = query.filter_by(vnum=vnum)
    if query.count() > 1 and test_code:
        query = query.filter_by(test_code=test_code)
    if query.count() > 1 and collected_at:
        query = query.filter(m.PatientSample.visit.has(
            patient=patient,
            collected_at=collected_at
        ))
    if query.count() == 1:
        return query.first()


def find_reports(directory, patterns):
    filenames = chain.from_iterable(
        glob.iglob(os.path.join(directory, pat), recursive=True)
        for pat in patterns)
    for filename in filenames:
        if '/CDC' in filename or '/VCAP/' in filename:
            continue
        data = extract_pdf_info(filename)
        patient = find_patient(data)
        if DEBUG:
            click.echo('[DEBUG] data: {!r}'.format(data), err=True)
        if not patient:
            click.echo(
                '[WARNING] Patient not found: {}'.format(filename), err=True)
            continue
        sample = find_patient_sample(patient, data)
        if not sample:
            click.echo(
                '[WARNING] Patient sample not found: {}'
                .format(filename), err=True)
            continue
        click.echo(
            '[INFO] Patient sample located: patient-{}/sample-{} ({})'
            .format(patient.ptnum, sample.id, filename), err=True)
        data['patient'] = patient
        data['sample'] = sample
        data['filename'] = filename
        yield data


def populate_missing_data(data):
    sample = data['sample']
    if sample.amplifiable:
        return
    touched = False
    if sample.test_code == '-':
        sample.test_code = data['test_code']
        touched = True
    if not sample.clinic:
        sample.clinic = get_clinic(data['clinic'])
        touched = True
    if touched:
        click.echo(
            '[INFO] Populated missing information to unamplifiable sample-{}'
            .format(sample.id))
    return touched


def populate_report(data):
    sample = data['sample']
    if len(sample.reports):
        return
    filename = data['filename']
    created_at = datetime.fromtimestamp(os.path.getmtime(filename))
    with open(filename, 'rb') as fp:
        report = models.Report(
            status='approved',
            content_type='pdf',
            created_at=created_at)
        report.content = FileIntent(
            fp.read(),
            filename=os.path.basename(filename),
            content_type='application/pdf')
        sample.reports.append(report)
    click.echo(
        '[INFO] Populated missing report to sample-{}'
        .format(sample.id))


@app.cli.command()
@click.argument('directory', type=str)
def import_old_reports(directory):
    pub_reports = find_reports(
        os.path.join(directory, 'for_physicians'),
        ('*.pdf', '**/*.pdf')
    )
    pendings = 0
    for data in pub_reports:
        populate_missing_data(data)
        populate_report(data)
        pendings += 1
        if pendings > 100:
            db.session.commit()
            pendings = 0
    if pendings:
        db.session.commit()
