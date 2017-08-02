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

import click
import click_datetime
import pytz
from sierrapy import SierraClient
from flask import current_app as app

from ._ignored_hivdb_patients import IGNORED_HIVDB_PATIENTS

db = app.db
models = app.models

CURRENT_TIMEZONE = pytz.timezone('US/Pacific')


def dttext(dt):
    return dt.strftime('%Y-%m-%d')


def sql_create_temp_new_patients_table():
    return ('CREATE TEMPORARY TABLE _clinviro_patients ('
            'ptnum INTEGER(10), ptid INTEGER(10), new TINYINT(1));\n')


def sql_dump_patient_map():
    return ("SELECT CONCAT(ptnum, ',', ptid) AS 'ptnum,ptid'"
            ' FROM _clinviro_patients WHERE new = 1'
            ' ORDER BY ptnum;\n')


def sql_link_patient(patient, start_date, stop_date):
    ptnum = patient.ptnum
    ptid = patient.hivdb_ptid
    if ptid is None:
        sql = ('INSERT INTO tblPatients'
               ' (PseudoName, Region, DateEntered) VALUES'
               " ('ANON', 'U.S.', CURDATE());\n")
        sql += ('INSERT INTO _clinviro_patients'
                ' (ptnum, ptid, new) VALUES'
                ' ({}, LAST_INSERT_ID(), 1);\n'.format(ptnum))
        sql += ('UPDATE tblPatients p'
                ' JOIN _clinviro_patients c'
                ' ON p.PtID=c.ptid AND ptnum={}'
                " SET PseudoName=CONCAT('CA', p.PtID);\n"
                .format(ptnum))

        # just records
        if any(any(s.clinic.name.lower().startswith('kaiser')
                   for s in v.samples if s.clinic)
               for v in patient.visits):
            sql += ('INSERT INTO Kaiser'
                    ' (PtID) SELECT ptid FROM _clinviro_patients'
                    ' WHERE ptnum={};\n'.format(ptnum))
        elif any(any(s.clinic.name == 'POSITIVE CARE CLINIC'
                     for s in v.samples if s.clinic)
                 for v in patient.visits):
            sql += ('INSERT INTO POS'
                    ' (PtID) SELECT ptid FROM _clinviro_patients'
                    ' WHERE ptnum={};\n'.format(ptnum))

    else:
        sql = ('INSERT INTO _clinviro_patients'
               ' (ptnum, ptid, new) VALUES'
               ' ({}, {}, 0);\n'.format(ptnum, ptid))
    return sql


def sql_enter_vnum(ptnum, collected_at, vnum):
    vnum = vnum.replace("'", "''")
    return ('INSERT INTO _VNum'
            ' (PtID, IsolateDate, VNum)'
            " SELECT ptid, '{cdate}', '{vnum}' FROM _clinviro_patients"
            " WHERE ptnum={ptnum};\n"
            .format(ptnum=ptnum, cdate=collected_at, vnum=vnum))


def analyze_samples(samples):
    query = (
        """
        inputSequence {
          header
        }
        subtypeText
        alignedGeneSequences {
          gene { name }
          firstAA lastAA
          mutations {
            position
            AAs
            insertedNAs
          }
          alignedNAs
          alignedAAs
        }""")
    client = SierraClient()
    client.toggle_progress(True)
    results = client.iter_sequence_analysis(
        [{'header': str(s.id),
          'sequence': s.sequence.naseq}
         for s in samples], query)
    for sample, result in zip(samples, results):
        if str(sample.id) != result['inputSequence']['header']:
            raise Exception(
                "Something wrong. Sample {} doesn't match result {}."
                .format(sample.id, result['inputSequence']['header'])
            )
        subtype = result['subtypeText'].split(' ', 1)[0].rstrip('*')
        for gene_result in result['alignedGeneSequences']:
            yield {
                'ptnum': sample.visit.ptnum,
                'vnum': sample.vnum,
                'subtype': subtype,
                'collected_at': dttext(sample.visit.collected_at),
                'gene': gene_result['gene']['name'],
                'first_aa': gene_result['firstAA'],
                'last_aa': gene_result['lastAA'],
                'naseq': gene_result['alignedNAs'],
                'aaseq': gene_result['alignedAAs'],
                'insertions': [
                    {
                        'pos': m['position'],
                        'aas': m['AAs'].split('_', 1)[-1],
                        'nas': m['insertedNAs']
                    } for m in gene_result['mutations']
                    if '_' in m['AAs']
                ],
                'mixtures': [
                    {
                        'pos': m['position'],
                        'aas': m['AAs']
                    } for m in gene_result['mutations']
                    if '_' not in m['AAs'] and len(m['AAs']) > 1
                ],
            }


def sql_enter_isolate(ptnum, vnum, subtype, collected_at, gene,
                      first_aa, last_aa, naseq, aaseq, insertions, mixtures):
    # enter tblIsolates
    sql = ('INSERT INTO tblIsolates'
           ' (PtID, IsolateDate, DateMatch, IsolateName,'
           ' Gene, Type, DateEntered)'
           " SELECT ptid, '{cdate}', '=', 'EMPTY', '{gene}',"
           " 'Clinical', CURDATE() FROM _clinviro_patients"
           ' WHERE ptnum={ptnum};\n'
           .format(cdate=collected_at, gene=gene, ptnum=ptnum))
    sql += 'SET @isolate_id = LAST_INSERT_ID();\n'
    sql += ('UPDATE tblIsolates'
            " SET IsolateName=CONCAT('CA', @isolate_id)"
            ' WHERE IsolateID=@isolate_id;\n')

    # enter tblClinIsolates
    sql += ('INSERT INTO tblClinIsolates'
            ' (IsolateID, Source, Culture, SeqTemplate,'
            ' CloneMethod, SeqMethod) VALUES'
            " (@isolate_id, 'Plasma', 'No', 'PCR', 'None', 'Dideoxy');\n")

    # enter tblHosts
    sql += ('INSERT INTO tblHosts'
            ' (IsolateID, Host) VALUES'
            " (@isolate_id, 'HUMAN');\n")

    # enter tblSubtype
    sql += ('INSERT INTO tblSubtypes'
            ' (IsolateID, Subtype) VALUES'
            " (@isolate_id, '{}');\n".format(subtype))

    # enter tblSpecies
    sql += ('INSERT INTO tblSpecies'
            ' (IsolateID, Species) VALUES'
            " (@isolate_id, 'HIV1');\n")

    # enter tblRefLink (always 169)
    sql += ('INSERT INTO tblRefLink'
            ' (RefID, IsolateID, Priority) VALUES'
            ' (169, @isolate_id, 1);\n')

    # enter tblSequences
    sql += ('INSERT INTO tblSequences'
            ' (AccessionID, IsolateID, SeqType, CloneName,'
            ' Firstaa, Lastaa, NASeq, AASeq) VALUES'
            " (NULL, @isolate_id, 'Sequence', NULL,"
            " {first_aa}, {last_aa}, '{naseq}', '{aaseq}');\n"
            .format(
                first_aa=first_aa,
                last_aa=last_aa,
                naseq=naseq.replace("'", "''"),
                aaseq=aaseq.replace("'", "''")))
    sql += 'SET @sequence_id = LAST_INSERT_ID();\n'

    # enter tblInsertions
    for ins in insertions:
        sql += ('INSERT INTO tblInsertions'
                ' (SequenceID, CodonPos, AA, NA) VALUES'
                " (@sequence_id, {pos}, '{aas}', '{nas}');\n"
                .format(**ins))

    # enter tblMixtures
    for mix in mixtures:
        sql += ('INSERT INTO tblMixtures'
                ' (SequenceID, CodonPos, AA) VALUES'
                " (@sequence_id, {pos}, '{aas}');\n"
                .format(**mix))

    return sql


@app.cli.command()
@click.option('--start-date', prompt=True,
              type=click_datetime.Datetime('%Y-%m-%d'))
@click.option('--stop-date', prompt=True,
              type=click_datetime.Datetime('%Y-%m-%d'))
@click.option('--ptnum', type=int)
@click.argument('output', type=click.File('w'))
def export2hivdb(start_date, stop_date, ptnum, output):
    required_ptnum = ptnum
    start = start_date.replace(tzinfo=CURRENT_TIMEZONE)
    stop = stop_date.replace(tzinfo=CURRENT_TIMEZONE)
    output.write(sql_create_temp_new_patients_table())
    filter_args = [
        models.Patient.visits.any(
            models.PatientVisit.samples.any(db.and_(
                db.between(models.PatientSample.entered_at, start, stop),
                models.PatientSample.amplifiable.is_(True)
            ))
        ),
        ~models.Patient.ptnum.in_(IGNORED_HIVDB_PATIENTS)
    ]
    if required_ptnum:
        filter_args.append(models.Patient.ptnum == required_ptnum)
    patient_query = (
        models.Patient.query
        .filter(*filter_args)
        .order_by(models.Patient.ptnum)
    )
    new_samples = []
    for patient in patient_query:
        ptnum = patient.ptnum
        output.write(sql_link_patient(patient, start, stop))
        for visit in patient.visits:
            for sample in visit.samples:
                entered_at = sample.entered_at
                if entered_at < start or entered_at > stop:
                    continue
                if not sample.amplifiable:
                    continue
                output.write(
                    sql_enter_vnum(ptnum, visit.collected_at, sample.vnum))
                new_samples.append(sample)
    for isolate in analyze_samples(new_samples):
        output.write(sql_enter_isolate(**isolate))
    output.write(sql_dump_patient_map())
    click.echo('\nSQL File {} created.'.format(output.name))
    click.echo('Use following command to import data into HIVDB2 (MySQL):')
    click.echo(
        '  mysql [connect options] --abort-source-on-error < {} > ptids.csv'
        .format(output.name))
    click.echo('After imported the SQL file to MySQL, copy file `ptids.csv` '
               'to ClinViro server and run this command:')
    click.echo('  flask importptid ptids.csv')
