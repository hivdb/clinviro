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
from flask import current_app as app

DATABASE_URI = 'postgresql+psycopg2://postgres@127.0.0.1:5435/postgres'


def getenv(name, default):
    return os.environ.get(name, default)


class Default:

    DEBUG = True
    # SQLALCHEMY_ECHO = True
    SQLALCHEMY_DATABASE_URI = getenv('DATABASE_URI', DATABASE_URI)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SIERRA_GRAPHQL = 'https://hivdb.stanford.edu/graphql'
    SECRET_KEY = \
        getenv('SECRET_KEY', '!!!UNSAFE_SECRET_KEY!!!').encode('utf-8')
    CMD_MAKEBLASTDB = 'makeblastdb'
    CMD_PANDOC = 'pandoc'
    PANDOC_REFERENCE_DOCX = os.path.join(
        app.root_path, 'pandoc/reference.docx')
    BLAST_DB_ALL = os.path.join(app.root_path, 'blastdb/all')
    BLAST_DB_MAIN = os.path.join(app.root_path, 'blastdb/main')
    BLAST_DB_INCR = os.path.join(app.root_path, 'blastdb/incr')
    ALLOWED_ORIGIN = getenv('ALLOWED_ORIGIN', 'http://localhost:3000')
    DEPOT_STORAGE_PATH = getenv('DEPOT_STORAGE_PATH', '/tmp/clinviro-depot')
    ELASTICSEARCH_HOST = getenv('ELASTICSEARCH_HOST', 'localhost:9200')
    HUMAN_TIMEZONE = 'America/Los_Angeles'
