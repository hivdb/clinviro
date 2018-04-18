# ClinViro
# Copyright (C) 2018 Stanford HIVDB team.
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

"""Add audit logs table

Revision ID: 5266a5fd6fdf
Revises: e47c8a82b01a
Create Date: 2018-04-16 17:55:07.289511

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5266a5fd6fdf'
down_revision = 'e47c8a82b01a'
branch_labels = ()
depends_on = None


def upgrade():
    op.create_table(
        'tbl_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('operation_type', sa.Unicode(8), nullable=False),
        sa.Column('target', sa.Unicode(32), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['tbl_users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_tbl_audit_logs_created_at'),
        'tbl_audit_logs', ['created_at'], unique=False)
    op.create_index(
        op.f('ix_tbl_audit_logs_user_id'),
        'tbl_audit_logs', ['user_id'], unique=False)


def downgrade():
    op.drop_index(
        op.f('ix_tbl_audit_logs_user_id'),
        table_name='tbl_audit_logs')
    op.drop_index(
        op.f('ix_tbl_audit_logs_created_at'),
        table_name='tbl_audit_logs')
    op.drop_table('tbl_audit_logs')
