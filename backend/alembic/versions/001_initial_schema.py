"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable vector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'], unique=False)

    # 2. company_profiles
    op.create_table(
        'company_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('company_name', sa.String(length=255), nullable=False),
        sa.Column('pan_number', sa.String(length=20), nullable=True),
        sa.Column('gst_number', sa.String(length=25), nullable=True),
        sa.Column('udyam_msme_number', sa.String(length=50), nullable=True),
        sa.Column('is_msme', sa.String(length=20), nullable=True, server_default='Micro'),
        sa.Column('annual_turnover_cr', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('net_worth_cr', sa.Float(), nullable=False, server_default='2.0'),
        sa.Column('years_of_experience', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('sectors', sa.JSON(), nullable=True),
        sa.Column('certifications', sa.JSON(), nullable=True),
        sa.Column('key_clients', sa.JSON(), nullable=True),
        sa.Column('core_competencies', sa.Text(), nullable=True),
        sa.Column('profile_embedding', Vector(384), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_company_profiles_id', 'company_profiles', ['id'], unique=False)

    # 3. tenders
    op.create_table(
        'tenders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tender_id', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('authority', sa.String(length=300), nullable=False),
        sa.Column('portal', sa.String(length=50), nullable=False, server_default='GeM'),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='Services'),
        sa.Column('estimated_value_inr', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('emd_amount_inr', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('msme_exemption', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('startup_exemption', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('publish_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('submission_deadline', sa.DateTime(timezone=True), nullable=False),
        sa.Column('opening_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('location_state', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('document_url', sa.String(length=500), nullable=True),
        sa.Column('eligibility_criteria', sa.JSON(), nullable=True),
        sa.Column('scope_embedding', Vector(384), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='Active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tenders_id', 'tenders', ['id'], unique=False)
    op.create_index('ix_tenders_tender_id', 'tenders', ['tender_id'], unique=True)
    op.create_index('ix_tenders_title', 'tenders', ['title'], unique=False)
    op.create_index('ix_tenders_authority', 'tenders', ['authority'], unique=False)
    op.create_index('ix_tenders_deadline', 'tenders', ['submission_deadline'], unique=False)
    op.create_index('ix_tenders_status', 'tenders', ['status'], unique=False)

    # 4. company_documents
    op.create_table(
        'company_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('stored_path', sa.String(length=500), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='Past_Experience'),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_company_documents_id', 'company_documents', ['id'], unique=False)
    op.create_index('ix_company_documents_category', 'company_documents', ['category'], unique=False)

    # 5. document_chunks
    op.create_table(
        'document_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('company_documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('chunk_metadata', sa.JSON(), nullable=True),
        sa.Column('embedding', Vector(384), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_document_chunks_id', 'document_chunks', ['id'], unique=False)
    op.create_index('ix_document_chunks_document_id', 'document_chunks', ['document_id'], unique=False)

    # 6. bid_documents
    op.create_table(
        'bid_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tender_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('doc_type', sa.String(length=100), nullable=False, server_default='Compliance_Matrix'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('drafted_content', sa.Text(), nullable=False),
        sa.Column('edited_content', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='Draft'),
        sa.Column('rag_citations', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_bid_documents_id', 'bid_documents', ['id'], unique=False)
    op.create_index('ix_bid_documents_tender_id', 'bid_documents', ['tender_id'], unique=False)
    op.create_index('ix_bid_documents_status', 'bid_documents', ['status'], unique=False)

    # 7. tender_tasks
    op.create_table(
        'tender_tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tender_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False, server_default='Technical_Bid'),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='Medium'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tender_tasks_id', 'tender_tasks', ['id'], unique=False)
    op.create_index('ix_tender_tasks_tender_id', 'tender_tasks', ['tender_id'], unique=False)
    op.create_index('ix_tender_tasks_is_completed', 'tender_tasks', ['is_completed'], unique=False)


def downgrade() -> None:
    op.drop_table('tender_tasks')
    op.drop_table('bid_documents')
    op.drop_table('document_chunks')
    op.drop_table('company_documents')
    op.drop_table('tenders')
    op.drop_table('company_profiles')
    op.drop_table('users')
