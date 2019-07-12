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
import pytz
import iso8601
from datetime import datetime, timedelta
from collections import namedtuple
from subprocess import Popen, PIPE

import editdistance
from flask import current_app as app
from flask.helpers import locked_cached_property

from .sierra import align_sequences

from . import (Sequence,
               PatientSample,
               ProficiencySample,
               PositiveControl)


db = app.db

SPACE_PATTERN = re.compile(r'[\x00-\x1f\s]+')


class BlastResult(namedtuple('BlastResultBase',
                             ('sequence_id',
                              'patient_sample_id',
                              'proficiency_sample_id',
                              'positive_control_id',
                              'entered_at',
                              'pident',
                              'length',
                              'mismatch'))):

    @locked_cached_property
    def patient_sample(self):
        if self.patient_sample_id:
            return PatientSample.query.get(self.patient_sample_id)

    @locked_cached_property
    def proficiency_sample(self):
        if self.proficiency_sample_id:
            return ProficiencySample.query.get(self.proficiency_sample_id)

    @locked_cached_property
    def positive_control(self):
        if self.positive_control_id:
            return PositiveControl.query.get(self.positive_control_id)

    @locked_cached_property
    def sequence(self):
        if self.sequence_id:
            return Sequence.query.get(self.sequence_id)

    @locked_cached_property
    def type(self):
        if self.patient_sample_id:
            return 'patient_sample'
        elif self.proficiency_sample_id:
            return 'proficiency_sample'
        else:
            return 'positive_control'

    def is_patient_similar_to(self, another_patient):
        if not another_patient:
            return False
        if not self.patient_sample:
            return False
        patient = self.patient_sample.visit.patient
        if patient == another_patient:
            # same patient
            return True
        if editdistance.eval(patient.fullname, another_patient.fullname) < 2:
            # only two characters difference
            return True
        mrids = {m.mrid for m in patient.medical_records}
        another_mrids = {m.mrid for m in another_patient.medical_records}
        if mrids & another_mrids:
            # same MRN
            return True
        for mrid_a in mrids:
            for mrid_b in another_mrids:
                if editdistance.eval(mrid_a, mrid_b) < 1:
                    # only one character difference in MRN
                    return True
        return False

    def get_aligned_seqs(self, gene):
        return getattr(self, '_aligned_seqs', {}).get(gene, ('', ''))

    def set_aligned_seqs(self, gene, naseq, aaseq):
        if not hasattr(self, '_aligned_seqs'):
            self._aligned_seqs = {}
        self._aligned_seqs[gene] = (naseq, aaseq)

    @staticmethod
    def populate_alignments(blast_results):
        kept_br = []
        sequences = []
        for r in blast_results:
            if r.pident >= 99.999:
                # no difference was found, no need to fetch alignments
                #
                # Note: (560 * 3 - 1) / 560 * 3 ≈ 99.94%, therefore 99.999
                # will ensure that there's no difference
                continue
            kept_br.append(r)
            seqobj = r.sequence
            sequences.append({
                'header': str(seqobj.id),
                'sequence': seqobj.naseq
            })
        sierra_results = align_sequences(sequences)

        for br, sr in zip(kept_br, sierra_results):
            for geneseq in sr.get('alignedGeneSequences', []):
                gene = geneseq['gene']['name']
                first_aa = geneseq['firstAA']
                naseq = geneseq['alignedNAs']
                aaseq = geneseq['alignedAAs']
                naseq = '-' * (3 * first_aa - 3) + naseq
                aaseq = '-' * (first_aa - 1) + aaseq
                br.set_aligned_seqs(gene, naseq, aaseq)


def _sequences_to_fasta(sequences):
    fasta_text = ''
    for seq in sequences:
        header = (
            'lcl|{};PtSample:{};PfSample:{};Control:{};EnteredAt:{}'
            .format(
                seq.Sequence.id,
                seq.patient_sample_id or '',
                seq.proficiency_sample_id or '',
                seq.positive_control_id or '',
                (seq.patient_sample_dt or
                 seq.proficiency_sample_dt or
                 seq.positive_control_dt).isoformat()
            )
        )
        naseq = seq.Sequence.naseq.replace('~', '-')
        naseq = SPACE_PATTERN.sub('', naseq)
        fasta_text += '>{}\n{}\n'.format(header, naseq)
    return fasta_text


def _get_query():
    return (
        db.session
        .query(Sequence)
        .outerjoin(PatientSample)
        .outerjoin(ProficiencySample)
        .outerjoin(PositiveControl)
        .add_columns(
            PatientSample.id.label('patient_sample_id'),
            PatientSample.entered_at.label('patient_sample_dt'),
            ProficiencySample.id.label('proficiency_sample_id'),
            ProficiencySample.entered_at.label('proficiency_sample_dt'),
            PositiveControl.id.label('positive_control_id'),
            PositiveControl.entered_at.label('positive_control_dt')
        )
        .order_by(Sequence.id)
    )


def _process_line(line):
    sacc, pident, length, mismatch = line.split('\t')
    seqid, pt_sample_id, pf_sample_id, control_id, entered_at = sacc.split(';')
    seqid = int(seqid)
    pt_sample_id = pt_sample_id.replace('PtSample:', '')
    pt_sample_id = int(pt_sample_id) if pt_sample_id else None
    pf_sample_id = pf_sample_id.replace('PfSample:', '')
    pf_sample_id = int(pf_sample_id) if pf_sample_id else None
    control_id = control_id.replace('Control:', '')
    control_id = int(control_id) if control_id else None
    entered_at = entered_at.replace('EnteredAt:', '')
    entered_at = iso8601.parse_date(entered_at)
    pident = float(pident)
    length = int(length)
    mismatch = int(mismatch)
    return BlastResult(seqid, pt_sample_id, pf_sample_id, control_id,
                       entered_at, pident, length, mismatch)


def rmdb(dbname):
    for filename in glob.glob('{}.*'.format(dbname)):
        os.remove(filename)


def mkdb(title, dbpath, fasta_text):
    p = Popen([app.config['CMD_MAKEBLASTDB'], '-in', '-',
               '-dbtype', 'nucl', '-out', dbpath,
               '-title', title, '-parse_seqids'],
              stdout=PIPE, stderr=PIPE, stdin=PIPE)
    return p.communicate(input=fasta_text.encode('utf-8'))


def makeblastdb_main():
    rmdb(app.config['BLAST_DB_MAIN'])
    datelimit = datetime.now(pytz.utc).replace(
        hour=0, minute=0, second=0, microsecond=0)
    profmindate = datelimit - timedelta(days=90)
    # TODO: use latest positive control and -60 days proficiency samples
    sequences = (
        _get_query()
        .filter(
            db.or_(
                PatientSample.id.is_(None),
                PatientSample.entered_at <= datelimit
            ), db.or_(
                ProficiencySample.id.is_(None),
                ProficiencySample.entered_at <= datelimit,
                ProficiencySample.entered_at >= profmindate
            ), db.or_(
                PositiveControl.id.is_(None),
                PositiveControl.entered_at <= datelimit
            )
        )
        .all())
    fasta_text = _sequences_to_fasta(sequences)
    return mkdb('clinviro', app.config['BLAST_DB_MAIN'], fasta_text)


def makeblastdb_incr():
    rmdb(app.config['BLAST_DB_INCR'])
    datelimit = datetime.now(pytz.utc).replace(
        hour=0, minute=0, second=0, microsecond=0)
    sequences = (
        _get_query()
        .filter(
            db.or_(
                PatientSample.id.is_(None),
                PatientSample.entered_at > datelimit
            ), db.or_(
                ProficiencySample.id.is_(None),
                ProficiencySample.entered_at > datelimit
            ), db.or_(
                PositiveControl.id.is_(None),
                PositiveControl.entered_at > datelimit
            )
        )
        .all())
    fasta_text = _sequences_to_fasta(sequences)
    return mkdb('clinviro', app.config['BLAST_DB_INCR'], fasta_text)


def db_exists(dbname):
    return os.path.isfile('{}.nsq'.format(dbname))


def query_sequence(naseq, min_pident=98.5, limit=100):
    dbs = []
    for db in (app.config['BLAST_DB_MAIN'], app.config['BLAST_DB_INCR']):
        if db_exists(db):
            dbs.append(db)
    p = Popen(['blastn', '-db', ' '.join(dbs),
               '-max_target_seqs', str(limit), '-evalue', '1e-50',
               '-num_threads', '4', '-perc_identity', str(min_pident),
               '-outfmt', '6 sacc pident length mismatch'],
              stdout=PIPE, stderr=PIPE, stdin=PIPE)
    stdout, stderr = p.communicate(input=naseq.encode('utf-8'))
    stdout = stdout.decode('utf-8')
    results = sorted(
        [_process_line(line) for line in stdout.splitlines()],
        key=lambda k: -k.pident)
    return results
