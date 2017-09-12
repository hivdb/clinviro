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

import re
import pytz
from datetime import datetime
from collections import OrderedDict

from flask import current_app as app
from ..codonutils import translate_codon

TZ = pytz.timezone(app.config['HUMAN_TIMEZONE'])


def parse_int(text):
    return int(re.sub('^.+?(\d+).+?$', '\g<1>', text))


def get_drug_levels(drugs, drug_scores):
    result = []
    for drug in sorted(drugs, key=lambda d: d['displayAbbr']):
        dlevel = {
            'drug': {
                'name': drug['displayAbbr'],
                'fullname': drug['fullName']
            },
            'level': 1,
            'level_text': 'Susceptible'
        }
        result.append(dlevel)
        for drug_score in drug_scores:
            if drug_score['drug']['displayAbbr'] == drug['displayAbbr']:
                dlevel['level'] = drug_score['level'],
                dlevel['level_text'] = drug_score['text']
                break
    return result


def get_mutation_scores(drugs, drug_scores):
    result = {}
    drugs = [drug['displayAbbr'] for drug in drugs]
    for drug_score in drug_scores:
        if drug_score['drug']['displayAbbr'] not in drugs:
            continue
        for mut_score in drug_score['partialScores']:
            muts = tuple(mut['text'] for mut in mut_score['mutations'])
            if muts not in result:
                result[muts] = {
                    'mutations': muts,
                    'drug_scores': {
                        drug: 0 for drug in drugs
                    }
                }
            target = result[muts]['drug_scores']
            target[drug_score['drug']['displayAbbr']] = int(mut_score['score'])
    result = sorted(result.items(), key=lambda ms:
                    [parse_int(m) for m in ms[1]['mutations']])
    return [v for _, v in result]


def get_mutations(mutations_by_types):
    result = []
    for mutations_by_type in mutations_by_types:
        muttype = mutations_by_type['mutationType']
        result.extend([{
            'text': mut['text'],
            'is_indel': mut['isIndel'],
            'type': muttype
        } for mut in mutations_by_type['mutations']])
    return result


def get_indels(gene, mutations_by_types):
    result = []
    for mutations_by_type in mutations_by_types:
        for mut in mutations_by_type['mutations']:
            if mut['isIndel']:
                result.append('{}:{}'.format(gene, mut['text']))
    return result


def get_comments(comments_by_types):
    result = []
    for comments_by_type in comments_by_types:
        muttype = comments_by_type['mutationType']
        for cmt in comments_by_type['comments']:
            result.append({
                'triggered_aas': cmt.get('triggeredAAs', ''),
                'position': cmt.get('boundMutation', {}).get('position', 0),
                'text': cmt['text'],
                'mutation_type': muttype
            })
    return result


def get_mutation_type_label(drug_class, muttype):
    if muttype == 'Other':
        return 'Other Mutations'
    label = {
        'PR': 'PI ',
        'RT': '',
        'IN': 'INSTI '
    }[drug_class]
    return label + muttype + ' Resistance Mutations'


def calc_distance(leftseq, rightseq):
    lfirstaa = leftseq['firstAA']
    llastaa = leftseq['lastAA']
    rfirstaa = rightseq['firstAA']
    rlastaa = rightseq['lastAA']
    leftnas = leftseq['alignedNAs']
    rightnas = rightseq['alignedNAs']

    # trim extra leading/trailing bps
    firstaa = max(lfirstaa, rfirstaa)
    lastaa = min(llastaa, rlastaa)
    leftnas = leftnas[(firstaa - lfirstaa) * 3:
                      (lastaa - llastaa) * 3 or None]
    rightnas = rightnas[(firstaa - rfirstaa) * 3:
                        (lastaa - rlastaa) * 3 or None]

    diff = 0
    total = len(leftnas)
    for lna, rna in zip(leftnas, rightnas):
        if lna == rna:
            continue
        else:
            diff += 1
    return diff / total


def prepare_prev_sequences(prevseqs, curseq):
    output = OrderedDict()
    curseq = {geneseq['gene']['name']: geneseq for geneseq in curseq}
    for seqresult in prevseqs:
        header = seqresult['inputSequence']['header']
        vnum, collected_at, entered_at = header.split('|', 2)

        for geneseq in seqresult['alignedGeneSequences']:
            gene = geneseq['gene']['name']
            if gene not in curseq:
                continue
            mutations = [mut['text'] for mut in geneseq['mutations']]
            output.setdefault(gene, []).append({
                'vnum': vnum,
                'collected_at': collected_at,
                'entered_at': entered_at,
                'distance': calc_distance(geneseq, curseq[gene]),
                'mutations': ', '.join(mutations)
            })
    return output


def prepare_prev_sequence_dates(prevseqs):
    dates = set([])
    for seqresult in prevseqs:
        header = seqresult['inputSequence']['header']
        _, collected_at, _ = header.split('|', 2)
        dates.add(collected_at)
    return sorted(dates)


def prepare_codon_comparison(blast_result, curseq):
    result = OrderedDict([])
    for geneseq in curseq:
        gene = geneseq['gene']['name']
        naseq, _ = blast_result.get_aligned_seqs(gene)
        firstaa = geneseq['firstAA']
        cur_naseq = geneseq['alignedNAs']
        result[gene] = []
        naseq = naseq[3 * firstaa - 3:]
        started = False

        for idx in range(min(len(naseq) // 3, len(cur_naseq) // 3)):
            posna = idx * 3
            codon = naseq[posna:posna + 3]
            cur_codon = cur_naseq[posna:posna + 3]
            if not started:
                if codon == '---':
                    continue
                else:
                    started = True
            if codon == cur_codon:
                continue
            result[gene].append({
                'position': idx + firstaa,
                'prev_codon': codon,
                'prev_aa': translate_codon(codon),
                'cur_codon': cur_codon,
                'cur_aa': translate_codon(cur_codon)
            })
    return result


def prepare_similar_sequences(similar_sequences, curseq):
    output = []
    # alignment is a heavy job, should only be called when generating reports
    blastdb = app.models.blastdb
    blastdb.BlastResult.populate_alignments(similar_sequences)
    for r in similar_sequences:
        one = OrderedDict([
            ('type', r.type)
        ])
        if r.type == 'patient_sample':
            sample = r.patient_sample
            visit = sample.visit
            patient = visit.patient
            one.update([
                ('name', patient.fullname),
                ('clinic', sample.clinic.name if sample.clinic else '-'),
                ('mrid', visit.mrid),
                ('vnum', sample.vnum),
                ('collected_at', visit.collected_at.strftime('%m/%d/%Y')),
                ('received_at',
                 sample.received_at.strftime('%m/%d/%Y')
                 if sample.received_at else None),
            ])
        elif r.type == 'proficiency_sample':
            sample = r.proficiency_sample
            one.update([
                ('name', sample.name),
                ('source', sample.source),
                ('vnum', sample.vnum),
                ('received_at',
                 sample.received_at.strftime('%m/%d/%Y')
                 if sample.received_at else None),
            ])
        else:
            sample = r.positive_control
            one.update([
                ('note', sample.note),
                ('lot_number', sample.lot_number),
                ('received_at', None),
            ])
        one.update([
            ('sequence_id', r.sequence_id),
            ('codon_comparison', prepare_codon_comparison(r, curseq)),
            ('entered_at',
             sample.entered_at.astimezone(TZ).strftime('%m/%d/%Y')),
            ('test_code', sample.test_code),
            ('distance', 100 - r.pident)
        ])
        output.append(one)
    return output


def count_geneseqs(sequences):
    r = OrderedDict([('PR', 0), ('RT', 0), ('IN', 0)])
    for seq in sequences or []:
        for geneseq in seq['alignedGeneSequences']:
            r[geneseq['gene']['name']] += 1
    return r


def prepare_auto_approved(data):
    previous_sequences = data.get('previous_sequences', {})
    similar_sequences = data.get('similar_sequences', [])
    if similar_sequences:
        return {'auto_approved': False}
    for gene, seqs in previous_sequences.items():
        for seq in seqs:
            distance = seq['distance']
            if distance > 0.02:
                return {'auto_approved': False}
    return {'auto_approved': True}


def prepare_sequence_data(sequence, similar_sequence,
                          prev_sequences, data):
    version = data['drugResistance'][0]['version']
    indels = sum((
        get_indels(genedr['gene']['name'], genedr['mutationsByTypes'])
        for genedr in data['drugResistance']
    ), [])
    return {
        'amplifiable': True,
        'algorithm': {
            'name': 'HIVDB',
            'version': version['text'],
            'publish_date': (datetime
                             .strptime(version['publishDate'], '%Y-%m-%d')
                             .strftime('%m/%d/%Y'))
        },
        # patient previous sequences
        'previous_sequences': prepare_prev_sequences(
            prev_sequences, data['alignedGeneSequences']),
        'previous_sequence_dates': prepare_prev_sequence_dates(prev_sequences),
        'previous_sequences_count': count_geneseqs(prev_sequences),
        'similar_sequences': prepare_similar_sequences(
            similar_sequence, data['alignedGeneSequences']),
        'indels': indels,
        'sequence': {
            'naseq': sequence.naseq,
            'subtype': sequence.subtype,
            'filename': sequence.filename,
            'gene_sequences': [{
                'gene': geneseq['gene']['name'],
                'first_aa': geneseq['firstAA'],
                'last_aa': geneseq['lastAA']
            } for geneseq in data['alignedGeneSequences']],
            'neighboring_sequences': [{
                'gene': geneseq['gene']['name'],
                'count': 0  # TODO: use blast to find neighboring patients
            } for geneseq in data['alignedGeneSequences']],
        },
        'drug_resistance': [{
            'gene': genedr['gene']['name'],
            'drug_class_results': [{
                'drug_class': {
                    'name': dclass['name'],
                    'fullname': dclass['fullName']
                },
                'drug_levels': get_drug_levels(
                    dclass['drugs'], genedr['drugScores']),
                'mutation_scores': get_mutation_scores(
                    dclass['drugs'], genedr['drugScores'])
            } for dclass in genedr['gene']['drugClasses']],
            'mutations': get_mutations(genedr['mutationsByTypes']),
            'comments': get_comments(genedr['commentsByTypes']),
            'mutation_types': [
                {
                    'name': muttype,
                    'label': get_mutation_type_label(
                        genedr['gene']['name'], muttype
                    )
                }
                for muttype in genedr['gene']['mutationTypes']
                if muttype != 'Dosage'
            ]
        } for genedr in data['drugResistance']]
    }


def prepare_data(sample, created_at, data, is_regenerated_report):
    visit = sample.visit
    patient = visit.patient
    prev_sequences = sample.get_previous_sequences()
    similar_sequences = sample.get_similar_sequences()
    result = {
        'report_type': 'patient',
        'is_regenerated_report': is_regenerated_report,
        'generated_at': created_at.astimezone(TZ).strftime('%m/%d/%Y %H:%M'),
        'patient': {
            'ptnum': patient.ptnum,
            'lastname': patient.lastname,
            'firstname': patient.firstname,
            'birthday': (patient.birthday.strftime('%m/%d/%Y')
                         if patient.birthday else 'unknown'),
            'mrid': visit.mrid
        },
        'clinic': {
            'name': (sample.clinic.name
                     if sample.clinic else 'unknown')
        },
        'physician': {
            'lastname': sample.physician.lastname,
            'firstname': sample.physician.firstname
        },
        'test_code': sample.test_code,
        'specimen_type': sample.specimen_type.name,
        'vnum': sample.vnum,
        'collected_at': visit.collected_at.strftime('%m/%d/%Y'),
        'received_at': (sample.received_at.strftime('%m/%d/%Y')
                        if sample.received_at
                        else '-'),
        'entered_at': (sample.entered_at
                       .astimezone(TZ)
                       .strftime('%m/%d/%Y %H:%M')),
        'notes': sample.notes,
        'labnotes': sample.labnotes,
        'amplifiable': False
    }
    if sample.amplifiable:
        result.update(prepare_sequence_data(
            sample.sequence, similar_sequences, prev_sequences, data))
    result.update(prepare_auto_approved(result))
    return result


def prepare_posctl_data(posctl, created_at, data, is_regenerated_report):
    similar_sequences = posctl.get_similar_sequences()
    result = {
        'report_type': 'posctl',
        'is_regenerated_report': is_regenerated_report,
        'generated_at': (created_at.astimezone(TZ)
                         .strftime('%m/%d/%Y %H:%M')),
        'note': posctl.note,
        'lot_number': posctl.lot_number,
        'test_code': posctl.test_code,
        'specimen_type': posctl.specimen_type.name,
        'entered_at': (posctl.entered_at
                       .astimezone(TZ)
                       .strftime('%m/%d/%Y %H:%M')),
        'labnotes': posctl.labnotes,
        'auto_approved': any(
            r.type == 'positive_control' and
            r.pident > 99.999
            for r in similar_sequences
        )
    }
    result.update(prepare_sequence_data(
        posctl.sequence, similar_sequences, [], data))
    return result


def prepare_profsample_data(
        profsample, created_at, data, is_regenerated_report):
    similar_sequences = profsample.get_similar_sequences()
    result = {
        'report_type': 'profsample',
        'is_regenerated_report': is_regenerated_report,
        'generated_at': created_at.astimezone(TZ).strftime('%m/%d/%Y %H:%M'),
        'name': profsample.name,
        'source': profsample.source,
        'vnum': profsample.vnum,
        'test_code': profsample.test_code,
        'received_at': profsample.received_at.strftime('%m/%d/%Y'),
        'entered_at': (profsample.entered_at
                       .astimezone(TZ)
                       .strftime('%m/%d/%Y %H:%M')),
        'notes': profsample.notes,
        'labnotes': profsample.labnotes
    }
    result.update(prepare_sequence_data(
        profsample.sequence, similar_sequences, [], data))
    result.update(prepare_auto_approved(result))
    return result
