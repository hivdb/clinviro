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

from flask import current_app as app

QUERY_SEQUENCE_ANALYSIS_SEQS_MUTS_ONLY = """
inputSequence {
  header
}
alignedGeneSequences {
  gene {
    name
  }
  firstAA
  lastAA
  mutations {
    text
  }
  alignedNAs
  alignedAAs
}
"""

QUERY_SEQUENCE_ANALYSIS = """
validationResults {
  level
  message
}
alignedGeneSequences {
  gene {
    name
    mutationTypes
  }
  firstAA
  lastAA
  alignedNAs
  alignedAAs
}
bestMatchingSubtype {
  displayWithoutDistance
  distancePcnt
}
drugResistance {
  version {
    text
    publishDate
  }
  gene {
    name
    drugClasses {
      name
      fullName
      drugs {
        displayAbbr
        fullName
      }
    }
    mutationTypes
  }
  drugScores {
    drug {
      displayAbbr
    }
    level
    text
    partialScores {
      mutations {
        text
      }
      score
    }
  }
  mutationsByTypes {
    mutationType
    mutations {
      isIndel
      text
    }
  }
  commentsByTypes {
    mutationType
    comments {
      text
      boundMutation {
        displayAAs
        position
      }
    }
  }
}
"""


def align_sequences(sequences, query=QUERY_SEQUENCE_ANALYSIS_SEQS_MUTS_ONLY):
    client = app.sierra_client
    return client.sequence_analysis(sequences, query)


def sequence_analysis(vnum, naseq):
    client = app.sierra_client
    result = {}
    data, = client.sequence_analysis([{
        'header': vnum,
        'sequence': naseq
    }], QUERY_SEQUENCE_ANALYSIS)
    result['subtype'] = data['bestMatchingSubtype']['displayWithoutDistance']
    result['genes'] = sorted(
        [geneseq['gene']['name']
         for geneseq in data['alignedGeneSequences']])
    result['data'] = data
    return result


def get_current_version():
    client = app.sierra_client
    current_version = client.current_version()
    return {
        'algorithm_version': current_version['text'],
        'algorithm_date': current_version['publishDate']
    }
