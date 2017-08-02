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

"""Init database

Revision ID: e47c8a82b01a
Revises:
Create Date: 2017-02-08 16:24:52.650460

"""
from alembic import op
import sqlalchemy as sa
import sqlalchemy_utils as sau
from depot.fields.sqlalchemy import UploadedFileField

# revision identifiers, used by Alembic.
revision = 'e47c8a82b01a'
down_revision = None
branch_labels = ('default',)
depends_on = None


def upgrade():
    op.create_table(
        'tbl_clinics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.Unicode(128), nullable=False),
        sa.Column('canonical_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['canonical_id'], ['tbl_clinics.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_tbl_clinics_canonical_id'),
                    'tbl_clinics', ['canonical_id'], unique=False)
    op.create_table(
        'tbl_patients',
        sa.Column('ptnum', sa.Integer(), nullable=False),
        sa.Column('lastname', sa.Unicode(128), nullable=False),
        sa.Column('firstname', sa.Unicode(128), nullable=False),
        sa.Column('birthday', sa.Date(), nullable=True),
        sa.Column('hivdb_ptid', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('ptnum')
    )
    op.create_index(op.f('ix_tbl_patients_created_at'),
                    'tbl_patients', ['created_at'], unique=False)
    op.create_index(op.f('ix_tbl_patients_firstname'),
                    'tbl_patients', ['firstname'], unique=False)
    op.create_index(op.f('ix_tbl_patients_hivdb_ptid'),
                    'tbl_patients', ['hivdb_ptid'], unique=False)
    op.create_index('patient_name_index', 'tbl_patients', [
                    'lastname', 'firstname'], unique=False)
    op.create_table(
        'tbl_physicians',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lastname', sa.Unicode(128), nullable=False),
        sa.Column('firstname', sa.Unicode(128), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('lastname', 'firstname')
    )
    op.create_index(op.f('ix_tbl_physicians_firstname'),
                    'tbl_physicians', ['firstname'], unique=False)
    op.create_index(op.f('ix_tbl_physicians_lastname'),
                    'tbl_physicians', ['lastname'], unique=False)
    op.create_table(
        'tbl_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', UploadedFileField(), nullable=True),
        sa.Column('content_type', sa.Unicode(16), nullable=True),
        sa.Column('status', sa.Unicode(32), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'tbl_sequences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('naseq', sa.Text(), nullable=False),
        sa.Column('subtype', sa.Unicode(64), nullable=False),
        sa.Column('genes', sau.ScalarListType(), nullable=False),
        sa.Column('filename', sa.Unicode(256), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'tbl_users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sau.EmailType(), nullable=False),
        sa.Column('password', sau.PasswordType(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_tbl_users_created_at'),
                    'tbl_users', ['created_at'], unique=False)
    op.create_table(
        'tbl_medical_records',
        sa.Column('mrid', sa.Unicode(128), nullable=False),
        sa.Column('ptnum', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['ptnum'], ['tbl_patients.ptnum'], ),
        sa.PrimaryKeyConstraint('mrid', 'ptnum')
    )
    op.create_index(op.f('ix_tbl_medical_records_ptnum'),
                    'tbl_medical_records', ['ptnum'], unique=False)
    op.create_table(
        'tbl_positive_controls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('note', sa.Unicode(128), nullable=False),
        sa.Column('lot_number', sa.Unicode(64), nullable=True),
        sa.Column('test_code', sa.Unicode(64), nullable=False),
        sa.Column('specimen_type', sa.Unicode(32), nullable=False),
        sa.Column('sequence_id', sa.Integer(), nullable=True),
        sa.Column('labnotes', sa.UnicodeText(), nullable=True),
        sa.Column('entered_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['sequence_id'], ['tbl_sequences.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sequence_id')
    )
    op.create_index(op.f('ix_tbl_positive_controls_entered_at'),
                    'tbl_positive_controls', ['entered_at'], unique=False)
    op.create_table(
        'tbl_proficiency_samples',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.Unicode(128), nullable=False),
        sa.Column('source', sa.Unicode(64), nullable=False),
        sa.Column('vnum', sa.Unicode(64), nullable=False),
        sa.Column('test_code', sa.Unicode(64), nullable=False),
        sa.Column('sequence_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.UnicodeText(), nullable=True),
        sa.Column('labnotes', sa.UnicodeText(), nullable=True),
        sa.Column('received_at', sa.Date(), nullable=False),
        sa.Column('entered_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['sequence_id'], ['tbl_sequences.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sequence_id'),
        sa.UniqueConstraint('vnum', 'test_code', 'received_at')
    )
    op.create_index(op.f('ix_tbl_proficiency_samples_entered_at'),
                    'tbl_proficiency_samples', ['entered_at'], unique=False)
    op.create_index(op.f('ix_tbl_proficiency_samples_name'),
                    'tbl_proficiency_samples', ['name'], unique=False)
    op.create_index(op.f('ix_tbl_proficiency_samples_received_at'),
                    'tbl_proficiency_samples', ['received_at'], unique=False)
    op.create_index(op.f('ix_tbl_proficiency_samples_source'),
                    'tbl_proficiency_samples', ['source'], unique=False)
    op.create_index(op.f('ix_tbl_proficiency_samples_vnum'),
                    'tbl_proficiency_samples', ['vnum'], unique=False)
    op.create_table(
        'tbl_patient_visits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ptnum', sa.Integer(), nullable=False),
        sa.Column('mrid', sa.Unicode(128), nullable=True),
        sa.Column('collected_at', sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(['mrid', 'ptnum'],
                                ['tbl_medical_records.mrid',
                                 'tbl_medical_records.ptnum'], ),
        sa.ForeignKeyConstraint(['ptnum'], ['tbl_patients.ptnum'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ptnum', 'collected_at')
    )
    op.create_index(op.f('ix_tbl_patient_visits_collected_at'),
                    'tbl_patient_visits', ['collected_at'], unique=False)
    op.create_table(
        'tbl_positive_control_reports',
        sa.Column('positive_control_id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['positive_control_id'], [
                                'tbl_positive_controls.id'], ),
        sa.ForeignKeyConstraint(['report_id'], ['tbl_reports.id'], ),
        sa.PrimaryKeyConstraint('positive_control_id', 'report_id')
    )
    op.create_table(
        'tbl_proficiency_sample_reports',
        sa.Column('proficiency_sample_id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['proficiency_sample_id'], [
                                'tbl_proficiency_samples.id'], ),
        sa.ForeignKeyConstraint(['report_id'], ['tbl_reports.id'], ),
        sa.PrimaryKeyConstraint('proficiency_sample_id', 'report_id')
    )
    op.create_table(
        'tbl_patient_samples',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vnum', sa.Unicode(64), nullable=False),
        sa.Column('test_code', sa.Unicode(64), nullable=False),
        sa.Column('specimen_type', sa.Unicode(32), nullable=False),
        sa.Column('patient_visit_id', sa.Integer(), nullable=False),
        sa.Column('sequence_id', sa.Integer(), nullable=True),
        sa.Column('physician_id', sa.Integer(), nullable=True),
        sa.Column('clinic_id', sa.Integer(), nullable=True),
        sa.Column('amplifiable', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.UnicodeText(), nullable=True),
        sa.Column('labnotes', sa.UnicodeText(), nullable=True),
        sa.Column('received_at', sa.Date(), nullable=True),
        sa.Column('entered_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['clinic_id'], ['tbl_clinics.id'], ),
        sa.ForeignKeyConstraint(['patient_visit_id'], [
                                'tbl_patient_visits.id'], ),
        sa.ForeignKeyConstraint(['physician_id'], ['tbl_physicians.id'], ),
        sa.ForeignKeyConstraint(['sequence_id'], ['tbl_sequences.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sequence_id'),
        sa.UniqueConstraint('vnum', 'test_code', 'patient_visit_id')
    )
    op.create_index(op.f('ix_tbl_patient_samples_clinic_id'),
                    'tbl_patient_samples', ['clinic_id'], unique=False)
    op.create_index(op.f('ix_tbl_patient_samples_entered_at'),
                    'tbl_patient_samples', ['entered_at'], unique=False)
    op.create_index(op.f('ix_tbl_patient_samples_patient_visit_id'),
                    'tbl_patient_samples', ['patient_visit_id'], unique=False)
    op.create_index(op.f('ix_tbl_patient_samples_physician_id'),
                    'tbl_patient_samples', ['physician_id'], unique=False)
    op.create_index(op.f('ix_tbl_patient_samples_received_at'),
                    'tbl_patient_samples', ['received_at'], unique=False)
    op.create_index(op.f('ix_tbl_patient_samples_vnum'),
                    'tbl_patient_samples', ['vnum'], unique=False)
    op.create_table(
        'tbl_patient_sample_reports',
        sa.Column('patient_sample_id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['patient_sample_id'], [
                                'tbl_patient_samples.id'], ),
        sa.ForeignKeyConstraint(['report_id'], ['tbl_reports.id'], ),
        sa.PrimaryKeyConstraint('patient_sample_id', 'report_id')
    )


def downgrade():
    op.drop_table('tbl_patient_sample_reports')
    op.drop_index(op.f('ix_tbl_patient_samples_vnum'),
                  table_name='tbl_patient_samples')
    op.drop_index(op.f('ix_tbl_patient_samples_received_at'),
                  table_name='tbl_patient_samples')
    op.drop_index(op.f('ix_tbl_patient_samples_physician_id'),
                  table_name='tbl_patient_samples')
    op.drop_index(op.f('ix_tbl_patient_samples_patient_visit_id'),
                  table_name='tbl_patient_samples')
    op.drop_index(op.f('ix_tbl_patient_samples_entered_at'),
                  table_name='tbl_patient_samples')
    op.drop_index(op.f('ix_tbl_patient_samples_clinic_id'),
                  table_name='tbl_patient_samples')
    op.drop_table('tbl_patient_samples')
    op.drop_table('tbl_proficiency_sample_reports')
    op.drop_table('tbl_positive_control_reports')
    op.drop_index(op.f('ix_tbl_patient_visits_collected_at'),
                  table_name='tbl_patient_visits')
    op.drop_table('tbl_patient_visits')
    op.drop_index(op.f('ix_tbl_proficiency_samples_vnum'),
                  table_name='tbl_proficiency_samples')
    op.drop_index(op.f('ix_tbl_proficiency_samples_source'),
                  table_name='tbl_proficiency_samples')
    op.drop_index(op.f('ix_tbl_proficiency_samples_received_at'),
                  table_name='tbl_proficiency_samples')
    op.drop_index(op.f('ix_tbl_proficiency_samples_name'),
                  table_name='tbl_proficiency_samples')
    op.drop_index(op.f('ix_tbl_proficiency_samples_entered_at'),
                  table_name='tbl_proficiency_samples')
    op.drop_table('tbl_proficiency_samples')
    op.drop_index(op.f('ix_tbl_positive_controls_entered_at'),
                  table_name='tbl_positive_controls')
    op.drop_table('tbl_positive_controls')
    op.drop_index(op.f('ix_tbl_medical_records_ptnum'),
                  table_name='tbl_medical_records')
    op.drop_table('tbl_medical_records')
    op.drop_index(op.f('ix_tbl_users_created_at'), table_name='tbl_users')
    op.drop_table('tbl_users')
    op.drop_table('tbl_sequences')
    op.drop_table('tbl_reports')
    op.drop_index(op.f('ix_tbl_physicians_lastname'),
                  table_name='tbl_physicians')
    op.drop_index(op.f('ix_tbl_physicians_firstname'),
                  table_name='tbl_physicians')
    op.drop_table('tbl_physicians')
    op.drop_index('patient_name_index', table_name='tbl_patients')
    op.drop_index(op.f('ix_tbl_patients_hivdb_ptid'),
                  table_name='tbl_patients')
    op.drop_index(op.f('ix_tbl_patients_firstname'), table_name='tbl_patients')
    op.drop_index(op.f('ix_tbl_patients_created_at'),
                  table_name='tbl_patients')
    op.drop_table('tbl_patients')
    op.drop_index(op.f('ix_tbl_clinics_canonical_id'),
                  table_name='tbl_clinics')
    op.drop_table('tbl_clinics')
